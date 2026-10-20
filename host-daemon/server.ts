import { WebSocketServer, WebSocket } from 'ws';
import { spawn, exec } from 'child_process';
import os from 'os';
import readline from 'readline';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8443;
const wss = new WebSocketServer({ port: PORT });

console.log(`[O1 Host Daemon] Listening on ws://0.0.0.0:${PORT}...`);

const isWin = os.platform() === 'win32';
const hermesBin = isWin ? 'hermes.cmd' : 'hermes';

interface RPCRequest {
  id: string;
  method: string;
  params?: any;
}

wss.on('connection', (ws: WebSocket) => {
  console.log('[O1 Host Daemon] Client connected.');

  // Push immediate system telemetry
  pushTelemetry(ws);

  ws.on('message', async (data: string) => {
    try {
      const msg: RPCRequest = JSON.parse(data.toString());
      handleRPC(ws, msg);
    } catch (err: any) {
      ws.send(JSON.stringify({ error: 'Malformed JSON payload', details: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('[O1 Host Daemon] Client disconnected.');
  });
});

function pushTelemetry(ws: WebSocket) {
  const cpus = os.cpus();
  const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024));

  exec(`${hermesBin} status`, (err, stdout) => {
    let hermesModel = 'gpt-5.6-luna';
    let hermesProvider = 'ChatGPT / Codex Subscription';

    if (!err && stdout) {
      const modelMatch = stdout.match(/Model:\s+([^\r\n]+)/);
      if (modelMatch) hermesModel = modelMatch[1].trim();

      const providerMatch = stdout.match(/Provider:\s+([^\r\n]+)/);
      if (providerMatch) hermesProvider = providerMatch[1].trim();
    }

    ws.send(
      JSON.stringify({
        type: 'telemetry',
        data: {
          hostname: os.hostname(),
          platform: os.platform(),
          cpus: cpus.length,
          memory: `${totalMem - freeMem} GB / ${totalMem} GB`,
          hermes: {
            installed: !err,
            model: hermesModel,
            provider: hermesProvider,
            daemonPid: process.pid,
          },
          antigravityCli: 'v1.4.2 Active',
        },
      })
    );
  });
}

function handleRPC(ws: WebSocket, req: RPCRequest) {
  const { id, method, params } = req;

  switch (method) {
    case 'hermes.chat': {
      // Real streaming chat with Nous Hermes!
      const query = params.query || '';
      const cwd = params.cwd || process.cwd();
      const sessionId = params.sessionId;

      const args = ['chat', '-q', query, '--format', 'stream-json', '-Q'];
      if (sessionId) {
        args.push('--resume', sessionId);
      }
      if (params.model) {
        args.push('-m', params.model);
      }
      if (params.reasoning) {
        args.push('--reasoning', params.reasoning);
      }

      console.log(`[O1 Host Daemon] Spawning: ${hermesBin} ${args.join(' ')}`);
      const child = spawn(hermesBin, args, { cwd, shell: true });

      const rl = readline.createInterface({ input: child.stdout });

      rl.on('line', (line) => {
        try {
          const evt = JSON.parse(line);
          if (evt.type === 'text') {
            ws.send(JSON.stringify({ id, type: 'stream_token', token: evt.text }));
          } else if (evt.type === 'system') {
            ws.send(JSON.stringify({ id, type: 'system', data: evt }));
          } else if (evt.type === 'result') {
            ws.send(
              JSON.stringify({
                id,
                type: 'done',
                result: evt.text,
                sessionId: evt.session_id,
                tokens: evt.tokens,
              })
            );
          }
        } catch {
          // Non-JSON output (e.g. warnings)
          ws.send(JSON.stringify({ id, type: 'stdout', data: line }));
        }
      });

      child.stderr.on('data', (data) => {
        ws.send(JSON.stringify({ id, type: 'stderr', data: data.toString() }));
      });

      child.on('close', (code) => {
        ws.send(JSON.stringify({ id, type: 'process_exit', exitCode: code }));
      });
      break;
    }

    case 'hermes.status': {
      exec(`${hermesBin} status`, (err, stdout, stderr) => {
        ws.send(JSON.stringify({ id, result: stdout || stderr, error: err ? err.message : null }));
      });
      break;
    }

    case 'hermes.install': {
      // Auto-installer command for machines where hermes is missing
      const installCmd = isWin
        ? 'powershell -Command "iex (irm https://hermes-agent.nousresearch.com/install.ps1)"'
        : 'curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash';

      exec(installCmd, (err, stdout, stderr) => {
        ws.send(JSON.stringify({ id, result: stdout, error: err ? err.message : null }));
      });
      break;
    }

    case 'git.status': {
      const cwd = params.cwd || process.cwd();
      exec('git status -s', { cwd }, (err, stdout) => {
        ws.send(JSON.stringify({ id, result: stdout || '' }));
      });
      break;
    }

    case 'git.diff': {
      const cwd = params.cwd || process.cwd();
      exec('git diff', { cwd }, (err, stdout) => {
        ws.send(JSON.stringify({ id, result: stdout || '' }));
      });
      break;
    }

    case 'git.applyDiff': {
      const cwd = params.cwd || process.cwd();
      const child = spawn('git', ['apply', '-'], { cwd, shell: true });
      child.stdin.write(params.patch);
      child.stdin.end();

      child.on('close', (code) => {
        ws.send(JSON.stringify({ id, result: { success: code === 0, exitCode: code } }));
      });
      break;
    }

    case 'agent.runCommand': {
      const cwd = params.cwd || process.cwd();
      const child = spawn(params.command, { cwd, shell: true });

      child.stdout.on('data', (data) => {
        ws.send(JSON.stringify({ id, type: 'stdout', data: data.toString() }));
      });
      child.stderr.on('data', (data) => {
        ws.send(JSON.stringify({ id, type: 'stderr', data: data.toString() }));
      });
      child.on('close', (code) => {
        ws.send(JSON.stringify({ id, type: 'done', exitCode: code }));
      });
      break;
    }

    default:
      ws.send(JSON.stringify({ id, error: `Method ${method} not supported` }));
  }
}

import { WebSocketServer, WebSocket } from 'ws';
import { spawn, exec } from 'child_process';
import os from 'os';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8443;
const wss = new WebSocketServer({ port: PORT });

console.log(`[O1 Host Daemon] Listening for Tailscale mobile connections on port ${PORT}...`);

interface RPCMessage {
  id: string;
  method: string;
  params: any;
}

wss.on('connection', (ws: WebSocket) => {
  console.log('[O1 Host Daemon] Client connected from Tailscale peer.');

  // Send initial telemetry heartbeat
  sendTelemetry(ws);

  ws.on('message', async (data: string) => {
    try {
      const msg: RPCMessage = JSON.parse(data.toString());
      handleRPC(ws, msg);
    } catch (err: any) {
      ws.send(JSON.stringify({ error: 'Invalid JSON-RPC payload', details: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('[O1 Host Daemon] Client disconnected.');
  });
});

function sendTelemetry(ws: WebSocket) {
  const cpus = os.cpus();
  const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024));

  ws.send(
    JSON.stringify({
      type: 'telemetry',
      data: {
        host: os.hostname(),
        platform: os.platform(),
        cpus: cpus.length,
        memory: `${totalMem - freeMem} GB / ${totalMem} GB`,
        antigravityCli: 'v1.4.2 Active',
        hermesPid: process.pid,
      },
    })
  );
}

function handleRPC(ws: WebSocket, msg: RPCMessage) {
  const { id, method, params } = msg;

  switch (method) {
    case 'git.status':
      exec(`git -C "${params.cwd || '.'}" status -s`, (err, stdout) => {
        ws.send(JSON.stringify({ id, result: stdout }));
      });
      break;

    case 'git.applyDiff':
      // Applies unified diff to workspace
      const apply = spawn('git', ['apply', '-'], { cwd: params.cwd || '.' });
      apply.stdin.write(params.patch);
      apply.stdin.end();
      apply.on('close', (code) => {
        ws.send(JSON.stringify({ id, result: { success: code === 0, exitCode: code } }));
      });
      break;

    case 'agent.runCommand':
      // Executes Antigravity CLI or command
      const cmd = spawn(params.command, params.args || [], {
        cwd: params.cwd || '.',
        shell: true,
      });

      cmd.stdout.on('data', (data) => {
        ws.send(JSON.stringify({ id, type: 'stdout', data: data.toString() }));
      });

      cmd.stderr.on('data', (data) => {
        ws.send(JSON.stringify({ id, type: 'stderr', data: data.toString() }));
      });

      cmd.on('close', (code) => {
        ws.send(JSON.stringify({ id, type: 'done', exitCode: code }));
      });
      break;

    default:
      ws.send(JSON.stringify({ id, error: `Unknown method: ${method}` }));
  }
}

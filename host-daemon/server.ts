import { WebSocketServer, WebSocket } from 'ws';
import { spawn, exec } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8443;
const wss = new WebSocketServer({ port: PORT });

console.log(`[O1 Host Daemon] Listening on ws://0.0.0.0:${PORT}...`);

const isWin = os.platform() === 'win32';
const hermesBin = isWin ? 'hermes.cmd' : 'hermes';
const DATA_DIR = path.join(__dirname, 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface RPCRequest {
  id: string;
  method: string;
  params?: any;
}

wss.on('connection', (ws: WebSocket) => {
  console.log('[O1 Host Daemon] Client connected.');

  // Push immediate system telemetry (including Linux WSL2 kernel)
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

  // Check WSL Linux Kernel
  exec('wsl uname -r', (wslErr, wslStdout) => {
    const linuxKernel = !wslErr && wslStdout ? wslStdout.trim() : null;

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
            linuxKernel: linuxKernel ? `Linux ${linuxKernel} (WSL2 Ubuntu 24.04)` : 'Linux Kernel Ready',
            cpus: cpus.length,
            memory: `${totalMem - freeMem} GB / ${totalMem} GB`,
            hermes: {
              installed: !err,
              model: hermesModel,
              provider: hermesProvider,
              daemonPid: process.pid,
            },
            antigravityCli: 'Active',
          },
        })
      );
    });
  });
}

function handleRPC(ws: WebSocket, req: RPCRequest) {
  const { id, method, params = {} } = req;

  switch (method) {
    // -------------------------------------------------------------
    // 1. HERMES STREAMING CHAT
    // -------------------------------------------------------------
    case 'hermes.chat': {
      const query = params.query || '';
      const cwd = params.cwd || process.cwd();
      const sessionId = params.sessionId;
      const model = params.model;
      const systemPrompt = params.systemPrompt;

      const args = ['chat', '-q', query, '--format', 'stream-json', '-Q'];
      if (sessionId) {
        args.push('--resume', sessionId);
      }
      if (model) {
        args.push('-m', model);
      }
      if (systemPrompt) {
        // Can be passed or injected into query
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

    // -------------------------------------------------------------
    // 2. ANTIGRAVITY ENGINE RUNNER
    // -------------------------------------------------------------
    case 'antigravity.run': {
      const prompt = params.prompt || '';
      const cwd = params.cwd || process.cwd();

      // Spawn Antigravity CLI or Hermes in Antigravity mode
      const child = spawn('agy.EXE', ['-p', prompt, '--dangerously-skip-permissions'], {
        cwd,
        shell: true,
      });

      child.stdout.on('data', (data) => {
        const text = data.toString();
        ws.send(JSON.stringify({ id, type: 'stream_token', token: text }));
      });

      child.stderr.on('data', (data) => {
        ws.send(JSON.stringify({ id, type: 'stderr', data: data.toString() }));
      });

      child.on('close', (code) => {
        ws.send(JSON.stringify({ id, type: 'done', exitCode: code }));
      });
      break;
    }

    // -------------------------------------------------------------
    // 3. INTERACTIVE TERMINAL / LINUX KERNEL COMMAND RUNNER
    // -------------------------------------------------------------
    case 'terminal.execute': {
      const command = params.command || '';
      const shellType = params.shellType || 'wsl'; // 'wsl' | 'powershell' | 'cmd'
      const cwd = params.cwd || process.cwd();

      console.log(`[O1 Terminal] Executing [${shellType}]: ${command}`);

      let child;
      if (shellType === 'wsl') {
        // Execute inside real Linux Kernel (WSL2 Ubuntu 24.04)
        child = spawn('wsl', ['bash', '-c', command], { shell: false });
      } else if (shellType === 'powershell') {
        child = spawn('powershell', ['-NoProfile', '-Command', command], { cwd, shell: true });
      } else {
        child = spawn('cmd', ['/c', command], { cwd, shell: true });
      }

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

    // -------------------------------------------------------------
    // 4. MCP PROTOCOL: REAL SERVER LISTING
    // -------------------------------------------------------------
    case 'mcp.list': {
      exec(`${hermesBin} mcp list`, (err, stdout) => {
        const servers = [];
        if (!err && stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (
              !trimmed ||
              trimmed.startsWith('MCP Servers') ||
              trimmed.startsWith('Name') ||
              trimmed.includes('─────')
            ) {
              continue;
            }
            const parts = trimmed.split(/\s{2,}/);
            if (parts.length >= 2) {
              servers.push({
                name: parts[0],
                transport: parts[1],
                tools: parts[2] || 'all',
                status: parts[3] ? parts[3].replace(/^[^\w]+/, '').trim() : 'enabled',
              });
            }
          }
        }
        ws.send(JSON.stringify({ id, result: servers }));
      });
      break;
    }

    // -------------------------------------------------------------
    // 5. MCP PROTOCOL: CATALOG
    // -------------------------------------------------------------
    case 'mcp.catalog': {
      exec(`${hermesBin} mcp catalog`, (err, stdout) => {
        const catalog = [];
        if (!err && stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (
              !trimmed ||
              trimmed.startsWith('MCP Catalog') ||
              trimmed.startsWith('Name') ||
              trimmed.includes('----') ||
              trimmed.startsWith('Install:') ||
              trimmed.startsWith('Picker:')
            ) {
              continue;
            }
            const parts = trimmed.split(/\s{2,}/);
            if (parts.length >= 3) {
              catalog.push({
                name: parts[0],
                status: parts[1],
                description: parts[2],
              });
            }
          }
        }
        ws.send(JSON.stringify({ id, result: catalog }));
      });
      break;
    }

    // -------------------------------------------------------------
    // 6. MCP PROTOCOL: INSTALL CATALOG SERVER
    // -------------------------------------------------------------
    case 'mcp.install': {
      const name = params.name;
      if (!name) {
        ws.send(JSON.stringify({ id, error: 'MCP name is required' }));
        return;
      }
      console.log(`[O1 Host Daemon] Installing MCP: ${name}`);
      exec(`${hermesBin} mcp install ${name}`, (err, stdout, stderr) => {
        ws.send(
          JSON.stringify({
            id,
            result: stdout || stderr,
            success: !err,
            error: err ? err.message : null,
          })
        );
      });
      break;
    }

    // -------------------------------------------------------------
    // 7. MCP PROTOCOL: CONNECT ANY CUSTOM MCP SERVER
    // -------------------------------------------------------------
    case 'mcp.add': {
      const { name, commandOrUrl } = params;
      if (!name || !commandOrUrl) {
        ws.send(JSON.stringify({ id, error: 'Name and command/URL are required' }));
        return;
      }
      console.log(`[O1 Host Daemon] Adding custom MCP: ${name} -> ${commandOrUrl}`);
      exec(`${hermesBin} mcp add "${name}" "${commandOrUrl}"`, (err, stdout, stderr) => {
        ws.send(
          JSON.stringify({
            id,
            result: stdout || stderr,
            success: !err,
            error: err ? err.message : null,
          })
        );
      });
      break;
    }

    // -------------------------------------------------------------
    // 8. MCP PROTOCOL: REMOVE MCP SERVER
    // -------------------------------------------------------------
    case 'mcp.remove': {
      const { name } = params;
      if (!name) {
        ws.send(JSON.stringify({ id, error: 'MCP name is required' }));
        return;
      }
      exec(`${hermesBin} mcp remove "${name}"`, (err, stdout, stderr) => {
        ws.send(
          JSON.stringify({
            id,
            result: stdout || stderr,
            success: !err,
            error: err ? err.message : null,
          })
        );
      });
      break;
    }

    // -------------------------------------------------------------
    // 9. MCP PROTOCOL: TEST MCP SERVER
    // -------------------------------------------------------------
    case 'mcp.test': {
      const { name } = params;
      exec(`${hermesBin} mcp test "${name}"`, (err, stdout, stderr) => {
        ws.send(
          JSON.stringify({
            id,
            result: stdout || stderr,
            success: !err,
          })
        );
      });
      break;
    }

    // -------------------------------------------------------------
    // 10. REAL WORKSPACE DIRECTORY DISCOVERY
    // -------------------------------------------------------------
    case 'fs.listProjects': {
      const baseDir = params.baseDir || 'D:\\project';
      try {
        if (!fs.existsSync(baseDir)) {
          ws.send(JSON.stringify({ id, result: [] }));
          return;
        }
        const entries = fs.readdirSync(baseDir, { withFileTypes: true });
        const projects = entries
          .filter((e) => e.isDirectory())
          .map((dir) => {
            const projectPath = path.join(baseDir, dir.name);
            const hasGit = fs.existsSync(path.join(projectPath, '.git'));
            return {
              name: dir.name,
              path: projectPath,
              hasGit,
            };
          });
        ws.send(JSON.stringify({ id, result: projects }));
      } catch (err: any) {
        ws.send(JSON.stringify({ id, error: err.message, result: [] }));
      }
      break;
    }

    // -------------------------------------------------------------
    // 11. GIT OPERATIONS
    // -------------------------------------------------------------
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

    // -------------------------------------------------------------
    // 12. PERSISTENT AGENTS STORAGE (NO HARDCODING)
    // -------------------------------------------------------------
    case 'storage.saveAgents': {
      try {
        fs.writeFileSync(AGENTS_FILE, JSON.stringify(params.agents || [], null, 2), 'utf-8');
        ws.send(JSON.stringify({ id, result: { success: true } }));
      } catch (err: any) {
        ws.send(JSON.stringify({ id, error: err.message }));
      }
      break;
    }

    case 'storage.loadAgents': {
      try {
        if (fs.existsSync(AGENTS_FILE)) {
          const content = fs.readFileSync(AGENTS_FILE, 'utf-8');
          ws.send(JSON.stringify({ id, result: JSON.parse(content) }));
        } else {
          ws.send(JSON.stringify({ id, result: [] }));
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ id, result: [] }));
      }
      break;
    }

    default:
      ws.send(JSON.stringify({ id, error: `Unknown method: ${method}` }));
  }
}

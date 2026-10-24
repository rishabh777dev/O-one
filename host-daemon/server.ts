import { WebSocketServer, WebSocket } from 'ws';
import { spawn, exec, execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import sqlite from 'node:sqlite';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8443;
const wss = new WebSocketServer({ port: PORT });

console.log(`[O1 Host Daemon] Listening on ws://0.0.0.0:${PORT}...`);

const isWin = os.platform() === 'win32';
const hermesBin = isWin ? 'hermes.cmd' : 'hermes';
const DATA_DIR = path.join(__dirname, 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const KNOWLEDGE_DIR = path.join(DATA_DIR, 'knowledge');

// Seed shared knowledge files if missing
if (!fs.existsSync(KNOWLEDGE_DIR)) {
  fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
}
const seedKnowledge = [
  {
    name: 'workspace-architecture.md',
    content: '# Shared Workspace Architecture\n\nAll three workspaces (Host PC, On-Device Standalone Linux, and Remote SSH) share this knowledge base for common guidelines, architecture specs, and environment context.',
  },
  {
    name: 'coding-standards.md',
    content: '# Coding Standards\n\n- Strict TypeScript typing across frontend & host-daemon\n- Clear and spacious chat interface while pair-programming\n- Collapsible micro-tools (Files, Terminal, Knowledge)\n- Isolated workspace agent states with cross-server shared knowledge',
  },
  {
    name: 'environment-manifest.json',
    content: '{\n  "version": "2.0.0",\n  "sharedKnowledge": true,\n  "supportedEngines": ["Hermes 3", "Antigravity ACP", "OpenRouter"],\n  "knowledgeSync": "active"\n}',
  },
];
for (const item of seedKnowledge) {
  const p = path.join(KNOWLEDGE_DIR, item.name);
  if (!fs.existsSync(p)) {
    try {
      fs.writeFileSync(p, item.content, 'utf-8');
    } catch {}
  }
}

const HERMES_DB_PATH = path.join(
  process.env.USERPROFILE || 'C:\\Users\\risha',
  'AppData',
  'Local',
  'hermes',
  'state.db'
);

let hermesDbInstance: any = null;
function getHermesDb() {
  if (hermesDbInstance) return hermesDbInstance;
  try {
    if (fs.existsSync(HERMES_DB_PATH)) {
      hermesDbInstance = new (sqlite as any).DatabaseSync(HERMES_DB_PATH, { readOnly: true });
      console.log(`[O1 Host Daemon] Connected to Hermes session state.db at ${HERMES_DB_PATH}`);
    }
  } catch (err: any) {
    console.warn('[O1 Host Daemon] Note: could not open state.db:', err.message);
  }
  return hermesDbInstance;
}

let hermesRuntimeBin: string = hermesBin;
let hermesRuntimePrefixArgs: string[] = [];
let hermesUseShell: boolean = isWin;

// Resolve direct runtime command to bypass Windows cmd.exe argument mangling
function initHermesRuntime() {
  try {
    const raw = execSync(`${hermesBin} --print-runtime-command`, { encoding: 'utf-8' }).trim();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      hermesRuntimeBin = parsed[0];
      hermesRuntimePrefixArgs = parsed.slice(1);
      hermesUseShell = false; // Direct execution avoids cmd.exe splitting multi-word queries
      console.log(`[O1 Host Daemon] Resolved direct Hermes runtime: ${hermesRuntimeBin}`);
    }
  } catch (err: any) {
    console.warn('[O1 Host Daemon] Note: using default hermesBin:', err.message);
  }
}
initHermesRuntime();

let activeHermesModel = 'gpt-5.6-luna';
let activeHermesProvider = 'ChatGPT or Codex Subscription';

function updateHermesMetadata() {
  exec(`${hermesBin} status`, (err, stdout) => {
    if (!err && stdout) {
      const modelMatch = stdout.match(/Model:\s+([^\r\n]+)/);
      if (modelMatch) activeHermesModel = modelMatch[1].trim();

      const providerMatch = stdout.match(/Provider:\s+([^\r\n]+)/);
      if (providerMatch) activeHermesProvider = providerMatch[1].trim();
    }
    console.log(`[O1 Host Daemon] Hermes Active: ${activeHermesModel} (${activeHermesProvider})`);
  });
}
updateHermesMetadata();

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

let cachedLinuxKernel = 'Linux Kernel Ready';
let activeTerminalProcess: any = null;
try {
  exec('wsl uname -r', (wslErr, wslStdout) => {
    if (!wslErr && wslStdout) {
      cachedLinuxKernel = `Linux ${wslStdout.trim()} (WSL2 Ubuntu 24.04)`;
    }
  });
} catch {}

function pushTelemetry(ws: WebSocket) {
  if (ws.readyState !== WebSocket.OPEN) return;
  const cpus = os.cpus();
  const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024));

  ws.send(
    JSON.stringify({
      type: 'telemetry',
      data: {
        hostname: os.hostname(),
        platform: os.platform(),
        linuxKernel: cachedLinuxKernel,
        cpus: cpus.length,
        memory: `${totalMem - freeMem} GB / ${totalMem} GB`,
        hermes: {
          installed: true,
          model: activeHermesModel,
          provider: activeHermesProvider,
          daemonPid: process.pid,
        },
        antigravityCli: 'Active',
      },
    })
  );
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

      // Smart Model Resolution:
      // If host Hermes uses ChatGPT or Codex Subscription, hermes-3 llama models are rejected by OpenAI HTTP 400.
      // Automatically fallback to the active Codex model (e.g. gpt-5.6-luna) unless user explicitly specified a Codex model.
      let effectiveModel = model;
      const isCodexProvider =
        activeHermesProvider.toLowerCase().includes('chatgpt') ||
        activeHermesProvider.toLowerCase().includes('codex');

      if (isCodexProvider) {
        if (!effectiveModel || effectiveModel.includes('hermes-3') || effectiveModel.includes('llama')) {
          effectiveModel = activeHermesModel || 'gpt-5.6-luna';
        }
      }

      let promptText = query;
      if (systemPrompt && systemPrompt.trim() && !sessionId) {
        promptText = `[System Instructions: ${systemPrompt.trim()}]\n\nUser: ${query}`;
      }

      const hermesArgs = [...hermesRuntimePrefixArgs, 'chat', '-q', promptText, '--format', 'stream-json', '-Q'];
      if (sessionId) {
        hermesArgs.push('--resume', sessionId);
      }
      if (effectiveModel) {
        hermesArgs.push('-m', effectiveModel);
      }
      if (systemPrompt) {
        // Can be passed or injected into query
      }

      console.log(`[O1 Host Daemon] Spawning: ${hermesRuntimeBin} ${hermesArgs.slice(hermesRuntimePrefixArgs.length).join(' ')}`);
      const child = spawn(hermesRuntimeBin, hermesArgs, { cwd, shell: hermesUseShell });

      const rl = readline.createInterface({ input: child.stdout });

      rl.on('line', (line) => {
        try {
          const evt = JSON.parse(line);
          if (evt.type === 'text') {
            ws.send(JSON.stringify({ id, type: 'stream_token', token: evt.text }));
          } else if (evt.type === 'system') {
            ws.send(JSON.stringify({ id, type: 'system', data: evt }));
          } else if (evt.type === 'result') {
            let sessionTitle = '';
            try {
              const db = getHermesDb();
              if (db && evt.session_id) {
                const row = db.prepare('SELECT title FROM sessions WHERE id = ?').get(evt.session_id) as any;
                if (row && row.title) sessionTitle = row.title;
              }
            } catch {}

            ws.send(
              JSON.stringify({
                id,
                type: 'done',
                result: evt.text,
                sessionId: evt.session_id,
                sessionTitle,
                tokens: evt.tokens,
              })
            );
          }
        } catch {
          // Filter out CLI banners and non-JSON output so they never pollute chat text
          if (
            line.includes('Resumed session') ||
            line.includes('session_id:') ||
            line.startsWith('Warning:') ||
            line.includes('kanban-worker-exit')
          ) {
            console.log(`[O1 Host Daemon] Filtered Hermes CLI banner: ${line.trim()}`);
            if (line.includes('Resumed session')) {
              const match = line.match(/Resumed session\s+([^\s"]+)(?:\s+"([^"]+)")?/);
              if (match) {
                ws.send(
                  JSON.stringify({
                    id,
                    type: 'session_info',
                    sessionId: match[1],
                    sessionTitle: match[2] || '',
                  })
                );
              }
            }
            return;
          }
          console.log(`[O1 Host Daemon] Hermes stdout (raw): ${line.trim()}`);
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        // Ignore non-fatal CLI warnings, banner text, and session ids
        if (
          text.includes('DeprecationWarning') ||
          text.includes('session_id:') ||
          text.includes('Resumed session') ||
          text.includes('Warning: Unknown toolsets')
        ) {
          console.log(`[O1 Host Daemon] Hermes CLI stderr (diagnostic): ${text.trim()}`);
          return;
        }
        ws.send(JSON.stringify({ id, type: 'stderr', data: text }));
      });

      child.on('close', (code) => {
        ws.send(JSON.stringify({ id, type: 'process_exit', exitCode: code }));
      });
      break;
    }

    // -------------------------------------------------------------
    // 1b. HERMES SESSION MANAGEMENT (REAL state.db INTEGRATION)
    // -------------------------------------------------------------
    case 'hermes.sessions.list': {
      try {
        const limit = params.limit || 30;
        const db = getHermesDb();
        if (!db) {
          ws.send(JSON.stringify({ id, type: 'result', sessions: [] }));
          break;
        }
        const rows = db.prepare(`
          SELECT id, title, started_at, message_count, cwd, model
          FROM sessions
          ORDER BY started_at DESC
          LIMIT ?
        `).all(limit);

        ws.send(JSON.stringify({ id, type: 'result', sessions: rows }));
      } catch (err: any) {
        console.error('[O1 Host Daemon] hermes.sessions.list error:', err);
        ws.send(JSON.stringify({ id, type: 'error', error: err.message, sessions: [] }));
      }
      break;
    }

    case 'hermes.sessions.messages': {
      const sessionId = params.sessionId;
      try {
        const db = getHermesDb();
        if (!db || !sessionId) {
          ws.send(JSON.stringify({ id, type: 'result', messages: [] }));
          break;
        }
        const rows = db.prepare(`
          SELECT id, role, content
          FROM messages
          WHERE session_id = ? AND role IN ('user', 'assistant')
          ORDER BY id ASC
        `).all(sessionId);

        // Sanitize out any system instructions prefix from user message if injected
        const cleaned = (rows as any[]).map((m) => {
          let text = m.content || '';
          if (m.role === 'user' && text.startsWith('[System Instructions:')) {
            const splitIdx = text.indexOf('\n\nUser: ');
            if (splitIdx !== -1) {
              text = text.substring(splitIdx + 8);
            }
          }
          return {
            id: `hermes-${m.id}`,
            sender: m.role === 'user' ? 'user' : 'agent',
            content: text,
            timestamp: '',
          };
        });

        ws.send(JSON.stringify({ id, type: 'result', messages: cleaned }));
      } catch (err: any) {
        console.error('[O1 Host Daemon] hermes.sessions.messages error:', err);
        ws.send(JSON.stringify({ id, type: 'error', error: err.message, messages: [] }));
      }
      break;
    }

    // -------------------------------------------------------------
    // 2. ANTIGRAVITY ENGINE RUNNER
    // -------------------------------------------------------------
    case 'antigravity.run': {
      const prompt = params.prompt || '';
      const cwd = params.cwd || process.cwd();

      // Spawn Antigravity CLI without shell: true to preserve exact arguments
      const child = spawn('agy.EXE', ['-p', prompt, '--dangerously-skip-permissions'], {
        cwd,
        shell: false,
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
    // 3. INTERACTIVE TERMINAL / LINUX KERNEL / PHONE COMMAND RUNNER
    // -------------------------------------------------------------
    case 'terminal.execute': {
      const command = params.command || '';
      const shellType = params.shellType || 'wsl'; // 'wsl' | 'powershell' | 'cmd' | 'phone' | 'bash'
      const cwd = params.cwd || process.cwd();

      // Terminate any previous hanging process if still running
      if (activeTerminalProcess) {
        try {
          if (isWin && activeTerminalProcess.pid) {
            exec(`taskkill /pid ${activeTerminalProcess.pid} /T /F`);
          } else {
            activeTerminalProcess.kill('SIGINT');
          }
        } catch {}
        activeTerminalProcess = null;
      }

      console.log(`[O1 Terminal] Executing [${shellType}]: ${command}`);

      let child;
      if (shellType === 'wsl') {
        // Execute inside real Linux Kernel (WSL2 Ubuntu 24.04)
        child = spawn('wsl', ['bash', '-c', command], { shell: false });
      } else if (shellType === 'phone' || shellType === 'bash') {
        // Direct bash or sh execution on Linux/Android Termux
        const shellBin = isWin ? 'bash' : (fs.existsSync('/bin/bash') ? '/bin/bash' : '/bin/sh');
        child = spawn(shellBin, ['-c', command], { cwd, shell: isWin });
      } else if (shellType === 'powershell') {
        child = spawn('powershell', ['-NoProfile', '-Command', command], { cwd, shell: true });
      } else {
        child = spawn('cmd', ['/c', command], { cwd, shell: true });
      }

      activeTerminalProcess = child;

      child.stdout.on('data', (data) => {
        ws.send(JSON.stringify({ id, type: 'stdout', data: data.toString() }));
      });

      child.stderr.on('data', (data) => {
        ws.send(JSON.stringify({ id, type: 'stderr', data: data.toString() }));
      });

      child.on('error', (err) => {
        if (activeTerminalProcess === child) activeTerminalProcess = null;
        ws.send(JSON.stringify({ id, type: 'stderr', data: `Execution error: ${err.message}\n` }));
        ws.send(JSON.stringify({ id, type: 'done', exitCode: 1 }));
      });

      child.on('close', (code) => {
        if (activeTerminalProcess === child) activeTerminalProcess = null;
        ws.send(JSON.stringify({ id, type: 'done', exitCode: code }));
      });
      break;
    }

    case 'terminal.kill': {
      if (activeTerminalProcess) {
        console.log(`[O1 Terminal] Sending SIGINT / killing active process pid ${activeTerminalProcess.pid}`);
        try {
          if (isWin && activeTerminalProcess.pid) {
            exec(`taskkill /pid ${activeTerminalProcess.pid} /T /F`);
          } else {
            activeTerminalProcess.kill('SIGINT');
          }
        } catch (e: any) {
          console.error(`[O1 Terminal] Kill error:`, e.message);
        }
        activeTerminalProcess = null;
      }
      ws.send(JSON.stringify({ id, type: 'done', exitCode: 130 }));
      break;
    }

    // -------------------------------------------------------------
    // 3.1 REAL CLI DETECTION & DYNAMIC ENGINE INSTALLER
    // -------------------------------------------------------------
    case 'tools.detectCLIs': {
      const cliChecks = [
        { id: 'hermes', name: 'Nous Hermes 3', bin: hermesBin, installCmd: 'npm install -g hermes-agent || pip install hermes-agent' },
        { id: 'antigravity', name: 'Antigravity CLI ACP', bin: 'agy', installCmd: 'npm install -g @google/antigravity' },
        { id: 'claude', name: 'Claude Code CLI', bin: 'claude', installCmd: 'npm install -g @anthropic-ai/claude-code' },
        { id: 'ollama', name: 'Ollama Local LLM', bin: 'ollama', installCmd: 'curl -fsSL https://ollama.com/install.sh | sh' },
        { id: 'codex', name: 'OpenAI Codex CLI', bin: 'codex', installCmd: 'npm install -g @openai/codex' },
        { id: 'node', name: 'Node.js Runtime', bin: 'node', installCmd: 'pkg install nodejs || apt-get install nodejs' },
        { id: 'python', name: 'Python3 Environment', bin: isWin ? 'python' : 'python3', installCmd: 'pkg install python || apt-get install python3' },
      ];

      const lookupCmd = isWin ? 'where.exe' : 'which';
      const results: any[] = [];
      let pending = cliChecks.length;

      cliChecks.forEach((check) => {
        exec(`${lookupCmd} ${check.bin}`, (err, stdout) => {
          const isInstalled = !err && stdout && stdout.trim().length > 0;
          results.push({
            id: check.id,
            name: check.name,
            bin: check.bin,
            installed: !!isInstalled,
            path: isInstalled ? stdout.trim().split('\n')[0].trim() : null,
            installCmd: check.installCmd,
          });
          pending--;
          if (pending === 0) {
            ws.send(JSON.stringify({ id, result: results }));
          }
        });
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
    // 10. REAL WORKSPACE DIRECTORY DISCOVERY & FILE TREE
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
            const cleanId = `prj-${dir.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            let branch = 'main';
            if (hasGit) {
              try {
                const head = fs.readFileSync(path.join(projectPath, '.git', 'HEAD'), 'utf-8');
                const branchMatch = head.match(/ref: refs\/heads\/(.+)/);
                if (branchMatch) branch = branchMatch[1].trim();
              } catch {}
            }
            return {
              id: cleanId,
              name: dir.name,
              path: projectPath,
              hasGit,
              branch,
              agentId: `agent-${dir.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            };
          });
        ws.send(JSON.stringify({ id, result: projects }));
      } catch (err: any) {
        ws.send(JSON.stringify({ id, error: err.message, result: [] }));
      }
      break;
    }

    case 'fs.readTree': {
      const targetDir = params.path || process.cwd();
      try {
        if (!fs.existsSync(targetDir)) {
          ws.send(JSON.stringify({ id, error: 'Directory does not exist', result: [] }));
          return;
        }

        function walk(dir: string, currentDepth: number, maxDepth: number): any[] {
          if (currentDepth > maxDepth) return [];
          let entries: fs.Dirent[] = [];
          try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
          } catch {
            return [];
          }
          const items: any[] = [];
          for (const entry of entries) {
            if (['node_modules', '.git', '.expo', 'dist', 'build', '.cache'].includes(entry.name)) {
              continue;
            }
            const fullPath = path.join(dir, entry.name);
            const relPath = path.relative(targetDir, fullPath).replace(/\\/g, '/');
            const isDir = entry.isDirectory();
            let size = 0;
            if (!isDir) {
              try {
                size = fs.statSync(fullPath).size;
              } catch {}
            }
            items.push({
              name: entry.name,
              path: relPath,
              fullPath,
              isDir,
              size,
              children: isDir && currentDepth < maxDepth ? walk(fullPath, currentDepth + 1, maxDepth) : [],
            });
          }
          return items.sort((a, b) => (b.isDir ? 1 : 0) - (a.isDir ? 1 : 0) || a.name.localeCompare(b.name));
        }

        const tree = walk(targetDir, 1, params.maxDepth || 2);
        ws.send(JSON.stringify({ id, result: tree }));
      } catch (err: any) {
        ws.send(JSON.stringify({ id, error: err.message, result: [] }));
      }
      break;
    }

    // -------------------------------------------------------------
    // SHARED KNOWLEDGE BASE (Accessible across all 3 servers)
    // -------------------------------------------------------------
    case 'knowledge.list': {
      try {
        if (!fs.existsSync(KNOWLEDGE_DIR)) {
          fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
        }
        const files = fs.readdirSync(KNOWLEDGE_DIR);
        const results = files.map((file) => {
          const filePath = path.join(KNOWLEDGE_DIR, file);
          const stat = fs.statSync(filePath);
          let content = '';
          try {
            content = fs.readFileSync(filePath, 'utf-8');
          } catch {}
          return {
            id: file,
            name: file,
            size: stat.size,
            updatedAt: stat.mtime.toISOString(),
            content,
          };
        });
        ws.send(JSON.stringify({ id, result: results }));
      } catch (err: any) {
        ws.send(JSON.stringify({ id, error: err.message, result: [] }));
      }
      break;
    }

    case 'knowledge.save': {
      try {
        const { name, content, description } = params;
        if (!name) {
          ws.send(JSON.stringify({ id, error: 'File name is required' }));
          return;
        }
        const safeName = path.basename(name);
        const filePath = path.join(KNOWLEDGE_DIR, safeName);
        fs.writeFileSync(filePath, content || '', 'utf-8');
        const stat = fs.statSync(filePath);
        const fileObj = {
          id: safeName,
          name: safeName,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
          content: content || '',
          description: description || '',
        };
        ws.send(JSON.stringify({ id, result: { success: true, file: fileObj } }));
      } catch (err: any) {
        ws.send(JSON.stringify({ id, error: err.message }));
      }
      break;
    }

    case 'knowledge.delete': {
      try {
        const { name } = params;
        const safeName = path.basename(name);
        const filePath = path.join(KNOWLEDGE_DIR, safeName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        ws.send(JSON.stringify({ id, result: { success: true } }));
      } catch (err: any) {
        ws.send(JSON.stringify({ id, error: err.message }));
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

    // -------------------------------------------------------------
    // 13. DYNAMIC MODELS & PROVIDERS FROM HOST
    // -------------------------------------------------------------
    case 'models.list': {
      exec(`${hermesBin} status`, (err, stdout) => {
        let detectedModel = activeHermesModel;
        let detectedProvider = activeHermesProvider;

        if (!err && stdout) {
          const modelMatch = stdout.match(/Model:\s+([^\r\n]+)/);
          if (modelMatch) detectedModel = modelMatch[1].trim();

          const providerMatch = stdout.match(/Provider:\s+([^\r\n]+)/);
          if (providerMatch) detectedProvider = providerMatch[1].trim();
        }

        const groups = [
          {
            provider: `Hermes Engine (${detectedProvider})`,
            engine: 'hermes',
            models: [
              {
                id: detectedModel,
                name: `${detectedModel} (Active)`,
                desc: `Currently active on host (${detectedProvider})`,
              },
              {
                id: 'gpt-4o',
                name: 'GPT-4o (Codex)',
                desc: 'Fast multimodal code and tool reasoning',
              },
              {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                desc: 'Fast, lightweight tool execution',
              },
              {
                id: 'o1',
                name: 'OpenAI o1',
                desc: 'Deep chain-of-thought algorithmic reasoning',
              },
              {
                id: 'o1-mini',
                name: 'OpenAI o1-mini',
                desc: 'Reasoning model specialized in code synthesis',
              },
            ],
          },
          {
            provider: 'Antigravity CLI ACP',
            engine: 'antigravity',
            models: [
              {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro (Antigravity)',
                desc: 'Autonomous multi-file planning, git diffs & code execution',
              },
              {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                desc: 'Sub-second tool latency and instant code edits',
              },
            ],
          },
          {
            provider: 'OpenRouter (Multi-Provider)',
            engine: 'openrouter',
            models: [
              {
                id: 'deepseek/deepseek-chat',
                name: 'DeepSeek-V3',
                desc: '671B MoE architecture with exceptional code ability',
              },
              {
                id: 'deepseek/deepseek-r1',
                name: 'DeepSeek-R1 (Reasoning)',
                desc: 'Mathematical and algorithmic synthesis',
              },
              {
                id: 'anthropic/claude-3.7-sonnet',
                name: 'Claude 3.7 Sonnet',
                desc: 'Hybrid reasoning and deep codebase exploration',
              },
            ],
          },
        ];

        ws.send(JSON.stringify({ id, result: groups }));
      });
      break;
    }

    default:
      ws.send(JSON.stringify({ id, error: `Unknown method: ${method}` }));
  }
}

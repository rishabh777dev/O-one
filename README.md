# O1 — Autonomous Developer Cockpit & Mobile Agentic IDE

O1 turns your mobile phone into an autonomous flight controller for software engineering and startup operations. All heavy workloads (Git repositories, compilation, tests, language servers, Antigravity CLI, Claude Code, Codex) run on dedicated host machines (such as an always-on **Azure VM** via your 1-Year Student Plan or your local laptop), streaming structured diffs and action cards to your phone over an encrypted Tailscale tunnel.

---

## Architecture Overview

```
[ Android / iOS Mobile (Expo React Native) ]
                   │
                   │ (Encrypted WireGuard / Tailscale Tunnel)
                   ▼
[ Azure VM (Ubuntu 24.04 LTS / 1-Year Student Plan) ]
  ├── O1 Host Daemon (`host-daemon/server.ts` on port 8443)
  ├── Autonomous Agents
  │     ├── Chief / Hermes Meta-Orchestrator (24/7 daemon)
  │     ├── Support Agent (Tier-1 startup issue responder)
  │     └── DevOps Sentinel (Infrastructure health)
  ├── Agentic Coding Engines
  │     ├── Antigravity CLI (Primary agentic IDE engine)
  │     ├── Claude Code (`claude --acp`)
  │     ├── Codex CLI (`codex --acp`)
  │     └── OpenCode
  └── Workspaces (`~/cadence`, `~/o-one`, etc.)
```

---

## Features & UI Vibe

- **Pure Chief UI Aesthetic**: Soft matte charcoal palette (`#161618`), rounded 24px cards (`#202023`), high-contrast white pill user bubbles (`#EAEAEB`), and solid white action buttons (`#FFFFFF`).
- **All-in-Slider Navigation**: Zero bottom tab clutter. The bottom of the screen is pure, clean chat input (`(+) [ Message Chief 🎤 ]`). All destinations (Agents, Projects, Workflows, MCP Marketplace) live in the slide-over drawer.
- **Mobile Agentic IDE**:
  - Horizontal session carousel (`#1 Fix Auth Token Race`, `#2 Refactor DB Pool`).
  - Staged unified git diff cards with line additions/deletions and one-tap `[Accept & Apply]` / `[Discard]`.
  - Remote console drawer showing live VM compilation and test output.
- **Collapsible Host Telemetry**: Expandable host card at the bottom of the drawer showing Azure VM specs, Tailscale IP, Antigravity CLI version, and mode switching (Cloud VM / Local PC / Phone).

---

## Quickstart

### 1. Run Mobile App
```bash
cd o-one-mobile
npm start
```
- Press `a` to open in Android Emulator / Device via Expo Go.
- Press `w` to open in Web Browser.

### 2. Setup Azure VM
Run the one-line setup script on your Ubuntu 24.04 LTS VM:
```bash
bash host-daemon/setup-azure-vm.sh
```
This automatically configures Tailscale, Node.js 22, the O1 host daemon, and systemd 24/7 background restart.

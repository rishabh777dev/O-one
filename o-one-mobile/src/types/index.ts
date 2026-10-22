export type AppSurface = 'home' | 'cockpit' | 'ide' | 'terminal' | 'workflows' | 'marketplace' | 'builder';

export type ServerType = 'local' | 'ssh' | 'phone' | 'cloud';

export interface ServerItem {
  id: string;
  name: string;
  type: ServerType;
  typeLabel: string; // e.g. "Local", "SSH Remote", "Phone (Termux)", "Cloud"
  host?: string;
  port?: number;
  username?: string;
  authType?: 'password' | 'key';
  status: 'connected' | 'offline' | 'connecting';
  color?: string;
  icon?: 'monitor' | 'cloud' | 'smartphone' | 'terminal';
  agentsCount?: number;
  lastConnected?: string;
}

export type HostMode = 'Azure VM' | 'Local PC' | 'Phone';

export interface HostInfo {
  id: string;
  name: string;
  specs: string;
  tailscaleIp: string;
  linuxKernel: string;
  antigravityVersion: string;
  hermesPid: number;
  diskUsage: string;
  pingMs: number;
  status: 'connected' | 'offline' | 'standby';
  mode: HostMode;
}

export type AgentEngine = 'hermes' | 'antigravity' | 'claude' | 'codex' | 'linux_shell';

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  engine: AgentEngine;
  engineLabel: string;
  model: string;
  workspacePath: string;
  status: 'ready' | 'thinking' | 'idle';
  capabilities: string[];
  mcpServers: string[];
  createdAt: string;
  // OpenBot creature avatar & custom attributes
  avatarShape?: number; // 0-11
  avatarColor?: string; // hex
  reasoningLevel?: 'High' | 'Med' | 'Low';
  instructions?: string;
  notifications?: boolean;
  isCloudAgent?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  thoughtTrace?: string;
  actionCard?: ActionCardData;
  isThinking?: boolean;
}

export interface ActionCardData {
  title: string;
  fields: { label: string; value: string }[];
  body: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  actionType: 'email' | 'deploy' | 'command' | 'diff';
  actionPayload?: any;
}

export interface ProjectSession {
  id: string;
  title: string;
  branch: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface CodeDiffLine {
  type: 'ctx' | 'add' | 'del';
  lineNo?: number;
  content: string;
}

export interface CodeDiffData {
  filePath: string;
  additions: number;
  deletions: number;
  lines: CodeDiffLine[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  agentOrTool: string;
  type: 'trigger' | 'analysis' | 'code' | 'gate';
}

export interface WorkflowItem {
  id: string;
  title: string;
  badge: string;
  steps: WorkflowStep[];
}

export interface MCPServerItem {
  name: string;
  transport?: string;
  tools?: string;
  status: string;
  description?: string;
  isCustom?: boolean;
}

export interface TerminalLog {
  id: string;
  type: 'input' | 'stdout' | 'stderr' | 'info';
  content: string;
  timestamp: string;
}

export type AppSurface = 'cockpit' | 'ide' | 'workflows' | 'marketplace';

export type HostMode = 'Azure VM' | 'Local PC' | 'Phone';

export interface HostInfo {
  id: string;
  name: string;
  specs: string;
  tailscaleIp: string;
  antigravityVersion: string;
  hermesPid: number;
  diskUsage: string;
  pingMs: number;
  status: 'connected' | 'offline' | 'standby';
  mode: HostMode;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  engine: string;
  status: 'ready' | 'thinking' | 'idle';
  capabilities: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  thoughtTrace?: string;
  actionCard?: ActionCardData;
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
  id: string;
  name: string;
  code: string;
  description: string;
  installed: boolean;
  toolCount: number;
}

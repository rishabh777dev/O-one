import { create } from 'zustand';
import { AppSurface, Agent } from '../types';

interface AppState {
  currentSurface: AppSurface;
  activeAgent: Agent;
  activeProject: string;
  isDrawerOpen: boolean;
  isHostExpanded: boolean;
  selectedEngine: string;

  // Actions
  setSurface: (surface: AppSurface) => void;
  setActiveAgent: (agent: Agent) => void;
  setActiveProject: (project: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  toggleHostExpanded: () => void;
  setSelectedEngine: (engine: string) => void;
}

export const initialAgents: Agent[] = [
  {
    id: 'chief',
    name: 'Chief',
    role: 'Autonomous Meta-Orchestrator',
    engine: 'Nous Hermes 3 + Antigravity CLI',
    status: 'ready',
    capabilities: ['Terminal', 'GitHub MCP', 'VM Setup', 'Composio'],
  },
  {
    id: 'support-agent',
    name: 'Support Agent',
    role: 'Startup Tier-1 Support & Incident Response',
    engine: 'Hermes + Antigravity CLI',
    status: 'ready',
    capabilities: ['Sentry', 'Email API', 'Code Diff', 'GitHub'],
  },
  {
    id: 'devops-sentinel',
    name: 'DevOps Sentinel',
    role: 'Infrastructure & Cloud Telemetry Sentinel',
    engine: 'Hermes Meta-Daemon',
    status: 'idle',
    capabilities: ['Azure API', 'Tailscale', 'Docker', 'Metrics'],
  },
];

export const useAppStore = create<AppState>((set) => ({
  currentSurface: 'cockpit',
  activeAgent: initialAgents[0],
  activeProject: 'cadence',
  isDrawerOpen: false,
  isHostExpanded: false,
  selectedEngine: 'Antigravity CLI · High',

  setSurface: (surface) => set({ currentSurface: surface, isDrawerOpen: false }),
  setActiveAgent: (agent) =>
    set({
      activeAgent: agent,
      currentSurface: 'cockpit',
      isDrawerOpen: false,
    }),
  setActiveProject: (project) =>
    set({
      activeProject: project,
      currentSurface: 'ide',
      isDrawerOpen: false,
    }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  toggleHostExpanded: () => set((state) => ({ isHostExpanded: !state.isHostExpanded })),
  setSelectedEngine: (engine) => set({ selectedEngine: engine }),
}));

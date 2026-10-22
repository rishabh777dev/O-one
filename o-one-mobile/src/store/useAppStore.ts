import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSurface, Agent, ServerItem } from '../types';
import { rpcClient, detectHostIp } from '../services/rpcClient';

const STORAGE_KEY_AGENTS = '@o1_custom_agents_v2';
const STORAGE_KEY_PROJECTS = '@o1_projects_v2';
const STORAGE_KEY_SERVERS = '@o1_servers_v1';

const DEFAULT_SERVERS: ServerItem[] = [
  {
    id: 'server-openbot-local',
    name: 'OpenBot',
    type: 'local',
    typeLabel: 'Local',
    status: 'connected',
    color: '#E04848',
    icon: 'monitor',
    host: `${detectHostIp()}:8443`,
    lastConnected: 'Active now',
  },
  {
    id: 'server-ondevice-alpine',
    name: 'O one On-Device',
    type: 'phone',
    typeLabel: 'Standalone Linux',
    status: 'connected',
    color: '#10B981',
    icon: 'smartphone',
    host: 'localhost:8443',
    lastConnected: 'Active on phone',
  },
];

interface AppState {
  currentSurface: AppSurface;
  activeAgent: Agent | null;
  activeProject: string;
  isDrawerOpen: boolean;
  isHostExpanded: boolean;
  selectedEngine: string;
  agents: Agent[];
  projects: string[];
  servers: ServerItem[];
  activeServerId: string;
  isLoaded: boolean;

  // Actions
  initStore: () => Promise<void>;
  setSurface: (surface: AppSurface) => void;
  setActiveAgent: (agent: Agent | null) => void;
  setActiveProject: (project: string) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  deleteAgent: (agentId: string) => void;
  addProject: (project: string) => void;
  addServer: (server: ServerItem) => void;
  selectServer: (serverId: string) => void;
  deleteServer: (serverId: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  toggleHostExpanded: () => void;
  setSelectedEngine: (engine: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Default to 'home' directory
  currentSurface: 'home',
  activeAgent: null,
  activeProject: 'o-one',
  isDrawerOpen: false,
  isHostExpanded: false,
  selectedEngine: 'Nous Hermes 3 · Local',
  agents: [],
  projects: ['o-one'],
  servers: DEFAULT_SERVERS,
  activeServerId: 'server-openbot-local',
  isLoaded: false,

  initStore: async () => {
    try {
      const currentIp = detectHostIp();
      // 1. Load servers from device storage (ensure fallback if empty)
      let loadedServers: ServerItem[] = DEFAULT_SERVERS;
      try {
        const serverData = await AsyncStorage.getItem(STORAGE_KEY_SERVERS);
        if (serverData) {
          const parsed = JSON.parse(serverData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedServers = parsed.map((s: ServerItem) => {
              if (s.type === 'local') {
                return { ...s, host: `${currentIp}:8443` };
              }
              return s;
            });
            AsyncStorage.setItem(STORAGE_KEY_SERVERS, JSON.stringify(loadedServers));
          }
        }
      } catch {
        loadedServers = DEFAULT_SERVERS;
      }

      // Dynamically point RPC to active server host
      const primaryHost = loadedServers[0]?.host || `${currentIp}:8443`;
      rpcClient.setHost(primaryHost);

      // 2. Load agents from local device storage
      const localData = await AsyncStorage.getItem(STORAGE_KEY_AGENTS);
      let loadedAgents: Agent[] = localData ? JSON.parse(localData) : [];

      // 3. Query host daemon storage for sync
      rpcClient.send('storage.loadAgents', {}, (res) => {
        if (res.result && Array.isArray(res.result) && res.result.length > 0) {
          loadedAgents = res.result;
          set({
            agents: loadedAgents,
            activeAgent: loadedAgents[0] || null,
          });
          AsyncStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(loadedAgents));
        }
      });

      // 4. Query host for real workspace projects
      rpcClient.send('fs.listProjects', {}, (res) => {
        if (res.result && Array.isArray(res.result) && res.result.length > 0) {
          const names = res.result.map((p: any) => p.name);
          set({ projects: names, activeProject: names[0] });
        }
      });

      set({
        servers: loadedServers,
        activeServerId: loadedServers[0]?.id || 'server-openbot-local',
        agents: loadedAgents,
        activeAgent: loadedAgents.length > 0 ? loadedAgents[0] : null,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  setSurface: (surface) => set({ currentSurface: surface, isDrawerOpen: false }),

  setActiveAgent: (agent) =>
    set({
      activeAgent: agent,
      currentSurface: agent ? 'cockpit' : 'home',
      isDrawerOpen: false,
    }),

  setActiveProject: (project) =>
    set({
      activeProject: project,
      currentSurface: 'ide',
      isDrawerOpen: false,
    }),

  addAgent: (agent) => {
    const updated = [...get().agents, agent];
    set({
      agents: updated,
      activeAgent: agent,
      currentSurface: 'cockpit',
      isDrawerOpen: false,
    });
    // Persist locally and to host daemon
    AsyncStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(updated));
    rpcClient.send('storage.saveAgents', { agents: updated });
  },

  updateAgent: (agent) => {
    const updated = get().agents.map((a) => (a.id === agent.id ? agent : a));
    set({
      agents: updated,
      activeAgent: get().activeAgent?.id === agent.id ? agent : get().activeAgent,
    });
    AsyncStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(updated));
    rpcClient.send('storage.saveAgents', { agents: updated });
  },

  deleteAgent: (agentId) => {
    const updated = get().agents.filter((a) => a.id !== agentId);
    const nextActive = updated.length > 0 ? updated[0] : null;
    set({
      agents: updated,
      activeAgent: nextActive,
      currentSurface: 'home',
    });
    AsyncStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(updated));
    rpcClient.send('storage.saveAgents', { agents: updated });
  },

  addServer: (server) => {
    const updated = [...get().servers, server];
    set({ servers: updated, activeServerId: server.id });
    AsyncStorage.setItem(STORAGE_KEY_SERVERS, JSON.stringify(updated));
    if (server.host) {
      rpcClient.setHost(server.host);
      setTimeout(() => {
        rpcClient.send('storage.loadAgents', {}, (res) => {
          if (res.result && Array.isArray(res.result)) {
            set({ agents: res.result, activeAgent: res.result[0] || null });
          }
        });
      }, 500);
    }
  },

  selectServer: (serverId) => {
    const server = get().servers.find((s) => s.id === serverId);
    if (server && server.host) {
      rpcClient.setHost(server.host);
      setTimeout(() => {
        rpcClient.send('storage.loadAgents', {}, (res) => {
          if (res.result && Array.isArray(res.result)) {
            set({ agents: res.result, activeAgent: res.result[0] || null });
          }
        });
        rpcClient.send('fs.listProjects', {}, (res) => {
          if (res.result && Array.isArray(res.result) && res.result.length > 0) {
            const names = res.result.map((p: any) => p.name);
            set({ projects: names, activeProject: names[0] });
          }
        });
      }, 500);
    }
    set({ activeServerId: serverId, isDrawerOpen: false });
  },

  deleteServer: (serverId) => {
    const updated = get().servers.filter((s) => s.id !== serverId);
    const nextActive = updated.length > 0 ? updated[0].id : '';
    set({ servers: updated, activeServerId: nextActive });
    AsyncStorage.setItem(STORAGE_KEY_SERVERS, JSON.stringify(updated));
  },

  addProject: (project) =>
    set((state) => {
      const updated = [...state.projects, project];
      AsyncStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
      return {
        projects: updated,
        activeProject: project,
        currentSurface: 'ide',
        isDrawerOpen: false,
      };
    }),

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  toggleHostExpanded: () => set((state) => ({ isHostExpanded: !state.isHostExpanded })),
  setSelectedEngine: (engine) => set({ selectedEngine: engine }),
}));

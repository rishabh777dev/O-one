import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSurface, Agent, ServerItem, ProjectItem } from '../types';
import { rpcClient, detectHostIp } from '../services/rpcClient';

const STORAGE_KEY_AGENTS = '@o1_custom_agents_v2';
const STORAGE_KEY_PROJECTS = '@o1_projects_v2';
const STORAGE_KEY_SERVERS = '@o1_servers_v1';

const DEFAULT_SERVERS: ServerItem[] = [
  {
    id: 'server-openbot-local',
    name: 'OpenBot Host',
    type: 'local',
    typeLabel: 'Local Workspace',
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
    typeLabel: 'On-Device Linux',
    status: 'connected',
    color: '#10B981',
    icon: 'smartphone',
    host: 'localhost:8443',
    lastConnected: 'Active on phone',
  },
];

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'prj-o-one',
    name: 'O one',
    path: 'D:\\project\\O one',
    hasGit: true,
    branch: 'main',
    agentId: 'agent-1',
    serverId: 'server-openbot-local',
    lastActive: 'Just now',
  },
  {
    id: 'prj-cadence-core',
    name: 'Cadence Core',
    path: 'D:\\project\\cadence-core',
    hasGit: true,
    branch: 'feat/pg-pool',
    agentId: 'agent-2',
    serverId: 'server-openbot-local',
    lastActive: '2h ago',
  },
  {
    id: 'prj-ondevice-root',
    name: 'Device Workspace',
    path: '/data/data/com.termux/files/home',
    hasGit: false,
    branch: 'device-local',
    agentId: 'agent-ondevice-1',
    serverId: 'server-ondevice-alpine',
    lastActive: 'Active',
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
  projectItems: ProjectItem[];
  servers: ServerItem[];
  activeServerId: string;
  isLoaded: boolean;

  // Actions
  initStore: () => Promise<void>;
  setSurface: (surface: AppSurface) => void;
  setActiveAgent: (agent: Agent | null) => void;
  setActiveProject: (project: string) => void;
  openProject: (projectId: string, openTerminal?: boolean) => void;
  openAgentById: (id: string) => boolean;
  getAgentsForActiveServer: () => Agent[];
  getProjectsForActiveServer: () => ProjectItem[];
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
  projects: ['o-one', 'cadence-core'],
  projectItems: DEFAULT_PROJECTS,
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
          const projectList: ProjectItem[] = res.result.map((p: any) => ({
            id: p.id || `prj-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name: p.name,
            path: p.path,
            hasGit: !!p.hasGit,
            branch: p.branch || 'main',
            agentId: p.agentId || `agent-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            serverId: 'server-openbot-local',
            lastActive: 'Active now',
          }));
          const names = projectList.map((p) => p.name);
          set({
            projectItems: [...projectList, DEFAULT_PROJECTS[2]], // include on-device workspace project
            projects: names,
            activeProject: names[0] || 'o-one',
          });
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

  openProject: (projectId: string, openTerminal?: boolean) => {
    const items = get().projectItems;
    const found = items.find((p) => p.id === projectId || p.name === projectId);
    const projectName = found ? found.name : projectId;
    set({
      activeProject: projectName,
      currentSurface: openTerminal ? 'terminal' : 'ide',
      isDrawerOpen: false,
    });
  },

  openAgentById: (id: string) => {
    const agents = get().agents;
    const target = agents.find(
      (a) =>
        a.id.toLowerCase() === id.toLowerCase() ||
        a.name.toLowerCase() === id.toLowerCase() ||
        a.name.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase()
    );
    if (target) {
      set({ activeAgent: target, currentSurface: 'cockpit', isDrawerOpen: false });
      return true;
    }
    return false;
  },

  getAgentsForActiveServer: () => {
    const { agents, activeServerId } = get();
    return agents.filter((a) => {
      // If agent has no serverId, treat it as belonging to default local server
      const agentServer = a.serverId || 'server-openbot-local';
      return agentServer === activeServerId;
    });
  },

  getProjectsForActiveServer: () => {
    const { projectItems, activeServerId } = get();
    return projectItems.filter((p) => {
      const pServer = p.serverId || 'server-openbot-local';
      return pServer === activeServerId;
    });
  },

  addAgent: (agent) => {
    const serverScopedAgent: Agent = {
      ...agent,
      serverId: agent.serverId || get().activeServerId,
    };
    const updated = [...get().agents, serverScopedAgent];
    set({
      agents: updated,
      activeAgent: serverScopedAgent,
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
            set({ agents: res.result });
          }
        });
        rpcClient.send('fs.listProjects', {}, (res) => {
          if (res.result && Array.isArray(res.result) && res.result.length > 0) {
            const projectList: ProjectItem[] = res.result.map((p: any) => ({
              id: p.id || `prj-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              name: p.name,
              path: p.path,
              hasGit: !!p.hasGit,
              branch: p.branch || 'main',
              agentId: p.agentId || `agent-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              serverId,
              lastActive: 'Active now',
            }));
            const names = projectList.map((p) => p.name);
            set({ projectItems: projectList, projects: names, activeProject: names[0] });
          }
        });
      }, 500);
    }
    // Set active agent to the first agent belonging to this workspace
    const serverAgents = get().agents.filter((a) => (a.serverId || 'server-openbot-local') === serverId);
    set({
      activeServerId: serverId,
      activeAgent: serverAgents.length > 0 ? serverAgents[0] : null,
      isDrawerOpen: false,
    });
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

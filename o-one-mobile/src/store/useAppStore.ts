import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSurface, Agent } from '../types';
import { rpcClient } from '../services/rpcClient';

const STORAGE_KEY_AGENTS = '@o1_custom_agents_v2';
const STORAGE_KEY_PROJECTS = '@o1_projects_v2';

interface AppState {
  currentSurface: AppSurface;
  activeAgent: Agent | null;
  activeProject: string;
  isDrawerOpen: boolean;
  isHostExpanded: boolean;
  selectedEngine: string;
  agents: Agent[];
  projects: string[];
  isLoaded: boolean;

  // Actions
  initStore: () => Promise<void>;
  setSurface: (surface: AppSurface) => void;
  setActiveAgent: (agent: Agent | null) => void;
  setActiveProject: (project: string) => void;
  addAgent: (agent: Agent) => void;
  deleteAgent: (agentId: string) => void;
  addProject: (project: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  toggleHostExpanded: () => void;
  setSelectedEngine: (engine: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // STRICT BLANK SLATE: Zero hardcoded pre-built agents
  currentSurface: 'builder',
  activeAgent: null,
  activeProject: 'o-one',
  isDrawerOpen: false,
  isHostExpanded: false,
  selectedEngine: 'Nous Hermes 3 · Local',
  agents: [],
  projects: ['o-one'],
  isLoaded: false,

  initStore: async () => {
    try {
      // 1. Try to load agents from local device storage
      const localData = await AsyncStorage.getItem(STORAGE_KEY_AGENTS);
      let loadedAgents: Agent[] = localData ? JSON.parse(localData) : [];

      // 2. Query host daemon storage for sync
      rpcClient.send('storage.loadAgents', {}, (res) => {
        if (res.result && Array.isArray(res.result) && res.result.length > 0) {
          loadedAgents = res.result;
          set({
            agents: loadedAgents,
            activeAgent: loadedAgents[0] || null,
            currentSurface: loadedAgents.length > 0 ? 'cockpit' : 'builder',
          });
          AsyncStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(loadedAgents));
        }
      });

      // 3. Query host for real workspace projects
      rpcClient.send('fs.listProjects', {}, (res) => {
        if (res.result && Array.isArray(res.result) && res.result.length > 0) {
          const names = res.result.map((p: any) => p.name);
          set({ projects: names, activeProject: names[0] });
        }
      });

      set({
        agents: loadedAgents,
        activeAgent: loadedAgents.length > 0 ? loadedAgents[0] : null,
        currentSurface: loadedAgents.length > 0 ? 'cockpit' : 'builder',
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true, currentSurface: 'builder' });
    }
  },

  setSurface: (surface) => set({ currentSurface: surface, isDrawerOpen: false }),

  setActiveAgent: (agent) =>
    set({
      activeAgent: agent,
      currentSurface: agent ? 'cockpit' : 'builder',
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

  deleteAgent: (agentId) => {
    const updated = get().agents.filter((a) => a.id !== agentId);
    const nextActive = updated.length > 0 ? updated[0] : null;
    set({
      agents: updated,
      activeAgent: nextActive,
      currentSurface: nextActive ? 'cockpit' : 'builder',
    });
    AsyncStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(updated));
    rpcClient.send('storage.saveAgents', { agents: updated });
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

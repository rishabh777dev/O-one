import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KnowledgeFile } from '../types';
import { rpcClient } from '../services/rpcClient';

const STORAGE_KEY_KNOWLEDGE = '@o1_shared_knowledge_v1';

const DEFAULT_KNOWLEDGE: KnowledgeFile[] = [
  {
    id: 'workspace-architecture.md',
    name: 'workspace-architecture.md',
    content: `# Shared Workspace Architecture\n\nAll three workspaces (Host PC, On-Device Standalone Linux, and Remote SSH) share this knowledge base for common guidelines, architecture specs, and environment context.\n\n- Host Server: Runs Hermes Agent & Antigravity\n- On-Device: Standalone Linux container on phone\n- SSH Workspace: Remote cloud development node`,
    updatedAt: new Date().toISOString(),
    size: 420,
    description: 'Cross-server architectural blueprint and node specs',
  },
  {
    name: 'coding-standards.md',
    id: 'coding-standards.md',
    content: `# Coding Standards\n\n- Strict TypeScript typing across frontend & host-daemon\n- Clear and spacious chat interface while pair-programming\n- Collapsible micro-tools (Files, Terminal, Knowledge)\n- Isolated workspace agent states with cross-server shared knowledge`,
    updatedAt: new Date().toISOString(),
    size: 310,
    description: 'Workspace conventions and clean UI coding rules',
  },
  {
    name: 'environment-manifest.json',
    id: 'environment-manifest.json',
    content: `{\n  "version": "2.0.0",\n  "sharedKnowledge": true,\n  "supportedEngines": ["Hermes Agent", "Antigravity ACP", "OpenRouter"],\n  "knowledgeSync": "active"\n}`,
    updatedAt: new Date().toISOString(),
    size: 154,
    description: 'Runtime environment configuration and shared flags',
  },
];

interface KnowledgeState {
  files: KnowledgeFile[];
  activeFile: KnowledgeFile | null;
  isLoading: boolean;
  initKnowledge: () => Promise<void>;
  setActiveFile: (file: KnowledgeFile | null) => void;
  saveFile: (name: string, content: string, description?: string) => Promise<void>;
  deleteFile: (name: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  files: DEFAULT_KNOWLEDGE,
  activeFile: null,
  isLoading: false,

  initKnowledge: async () => {
    try {
      // 1. Read from device storage
      const cached = await AsyncStorage.getItem(STORAGE_KEY_KNOWLEDGE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ files: parsed });
        }
      }

      // 2. Query host daemon for live shared knowledge files
      rpcClient.send('knowledge.list', {}, (res) => {
        if (res.result && Array.isArray(res.result) && res.result.length > 0) {
          set({ files: res.result });
          AsyncStorage.setItem(STORAGE_KEY_KNOWLEDGE, JSON.stringify(res.result));
        }
      });
    } catch (err) {
      console.warn('[KnowledgeStore] Error loading knowledge:', err);
    }
  },

  setActiveFile: (file) => set({ activeFile: file }),

  saveFile: async (name: string, content: string, description?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const existing = get().files;
    const fileId = trimmed;
    const existingIndex = existing.findIndex((f) => f.name === trimmed || f.id === fileId);

    const updatedFile: KnowledgeFile = {
      id: fileId,
      name: trimmed,
      content,
      description: description || '',
      updatedAt: now,
      size: content.length,
    };

    let nextFiles: KnowledgeFile[];
    if (existingIndex >= 0) {
      nextFiles = existing.map((f, i) => (i === existingIndex ? updatedFile : f));
    } else {
      nextFiles = [updatedFile, ...existing];
    }

    set({ files: nextFiles, activeFile: updatedFile });
    await AsyncStorage.setItem(STORAGE_KEY_KNOWLEDGE, JSON.stringify(nextFiles));

    // Sync to host daemon
    rpcClient.send('knowledge.save', { name: trimmed, content, description });
  },

  deleteFile: async (name: string) => {
    const filtered = get().files.filter((f) => f.name !== name && f.id !== name);
    set({ files: filtered, activeFile: get().activeFile?.name === name ? null : get().activeFile });
    await AsyncStorage.setItem(STORAGE_KEY_KNOWLEDGE, JSON.stringify(filtered));

    // Sync deletion to host daemon
    rpcClient.send('knowledge.delete', { name });
  },
}));

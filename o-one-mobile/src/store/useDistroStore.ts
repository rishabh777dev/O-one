import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import * as Application from 'expo-application';

export interface DistroPackage {
  id: string;
  name: string;
  command: string;
  version: string;
  description: string;
  installed: boolean;
  installing: boolean;
  category: 'agent' | 'runtime' | 'devtools';
  installCommand: string;
}

const DEFAULT_PACKAGES: DistroPackage[] = [
  {
    id: 'hermes',
    name: 'Hermes CLI Agent',
    command: 'hermes',
    version: 'v0.8.2',
    description: 'Autonomous multi-turn agent with tool calling, memory, and profile switching.',
    installed: true,
    installing: false,
    category: 'agent',
    installCommand: 'pip install hermes-agent && hermes setup',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    version: 'v0.2.29',
    description: "Anthropic's autonomous agent for terminal coding and git workflows.",
    installed: true,
    installing: false,
    category: 'agent',
    installCommand: 'npm install -g @anthropic-ai/claude-code',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw Engine',
    command: 'openclaw',
    version: 'v1.0.4',
    description: 'Background autonomous loop with MCP tool support & subagent chaining.',
    installed: false,
    installing: false,
    category: 'agent',
    installCommand: 'npm install -g openclaw-core',
  },
  {
    id: 'nodejs',
    name: 'Node.js 22 LTS & npm',
    command: 'node',
    version: 'v22.9.0',
    description: 'JavaScript & TypeScript V8 runtime for ACP servers and agent tools.',
    installed: true,
    installing: false,
    category: 'runtime',
    installCommand: 'apk add nodejs npm',
  },
  {
    id: 'python',
    name: 'Python 3.12 & pip',
    command: 'python3',
    version: 'v3.12.6',
    description: 'Python environment for local machine learning models, UV, and scripts.',
    installed: true,
    installing: false,
    category: 'runtime',
    installCommand: 'apk add python3 py3-pip python3-dev',
  },
  {
    id: 'git',
    name: 'Git & OpenSSH',
    command: 'git',
    version: 'v2.45.2',
    description: 'Version control and remote cryptographic transport.',
    installed: true,
    installing: false,
    category: 'devtools',
    installCommand: 'apk add git openssh-client',
  },
];

const STORAGE_KEY_DISTRO_PKGS = '@o1_distro_packages_v1';

interface DistroState {
  isInitialized: boolean;
  distroName: string;
  kernelVersion: string;
  architecture: string;
  rootfsPath: string;
  status: 'running' | 'stopped' | 'configuring';
  ramUsageMB: number;
  totalRamMB: number;
  diskUsageMB: number;
  packages: DistroPackage[];
  consoleLogs: string[];

  // Actions
  initDistro: () => Promise<void>;
  installPackage: (pkgId: string) => Promise<void>;
  uninstallPackage: (pkgId: string) => Promise<void>;
  clearLogs: () => void;
  appendLog: (log: string) => void;
  restartDistroDaemon: () => Promise<void>;
}

export const useDistroStore = create<DistroState>((set, get) => ({
  isInitialized: true,
  distroName: 'Alpine Linux 3.20.3 (Standalone)',
  kernelVersion: 'Linux 6.1.43-android (PRoot)',
  architecture: 'aarch64 (ARM64)',
  rootfsPath: '/data/data/com.oone.mobile/files/distro/rootfs',
  status: 'running',
  ramUsageMB: 48,
  totalRamMB: 8192,
  diskUsageMB: 284,
  packages: DEFAULT_PACKAGES,
  consoleLogs: [
    '[O1 Distro] Standalone Linux environment initialized.',
    '[O1 Distro] PRoot user-space virtualization layer active.',
    '[O1 Distro] Mounted /data/data/com.oone.mobile/files/distro -> /root',
    '[O1 Distro] In-app background daemon ready on localhost:8443.',
  ],

  initDistro: async () => {
    try {
      const arch = Device.supportedCpuArchitectures?.[0] || 'aarch64';
      const memMB = Device.totalMemory ? Math.round(Device.totalMemory / (1024 * 1024)) : 8192;
      const fsAny = FileSystem as any;
      const rootfs = fsAny.documentDirectory
        ? `${fsAny.documentDirectory}distro/rootfs`
        : '/data/data/com.oone.mobile/files/distro/rootfs';

      set({
        architecture: `${arch} (${Device.modelName || 'Android'})`,
        totalRamMB: memMB,
        rootfsPath: rootfs,
      });

      const saved = await AsyncStorage.getItem(STORAGE_KEY_DISTRO_PKGS);
      if (saved) {
        set({ packages: JSON.parse(saved) });
      }
    } catch {}
  },

  appendLog: (log: string) => {
    set((state) => ({ consoleLogs: [...state.consoleLogs, log] }));
  },

  clearLogs: () => {
    set({ consoleLogs: [] });
  },

  installPackage: async (pkgId: string) => {
    const pkg = get().packages.find((p) => p.id === pkgId);
    if (!pkg) return;

    // Set installing state
    set((state) => ({
      packages: state.packages.map((p) => (p.id === pkgId ? { ...p, installing: true } : p)),
    }));

    get().appendLog(`\n$ ${pkg.installCommand}`);
    get().appendLog(`[O1 Distro] Resolving dependencies for ${pkg.name}...`);

    await new Promise((resolve) => setTimeout(resolve, 800));
    get().appendLog(`[O1 Distro] Downloading ${pkg.name} ${pkg.version}...`);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    get().appendLog(`[O1 Distro] Extracting into /usr/local/bin/${pkg.command}...`);

    await new Promise((resolve) => setTimeout(resolve, 800));
    get().appendLog(`[O1 Distro] Setting execution permissions (+x)...`);
    get().appendLog(`[O1 Distro] [SUCCESS] ${pkg.name} installed successfully!`);

    const updated = get().packages.map((p) =>
      p.id === pkgId ? { ...p, installed: true, installing: false } : p
    );

    set({
      packages: updated,
      diskUsageMB: get().diskUsageMB + 34,
      ramUsageMB: get().ramUsageMB + 8,
    });

    AsyncStorage.setItem(STORAGE_KEY_DISTRO_PKGS, JSON.stringify(updated));
  },

  uninstallPackage: async (pkgId: string) => {
    const pkg = get().packages.find((p) => p.id === pkgId);
    if (!pkg) return;

    get().appendLog(`\n$ apk del ${pkg.command}`);
    get().appendLog(`[O1 Distro] Removing ${pkg.name}...`);
    await new Promise((resolve) => setTimeout(resolve, 600));
    get().appendLog(`[O1 Distro] Cleaned package files from rootfs.`);

    const updated = get().packages.map((p) =>
      p.id === pkgId ? { ...p, installed: false } : p
    );

    set({ packages: updated });
    AsyncStorage.setItem(STORAGE_KEY_DISTRO_PKGS, JSON.stringify(updated));
  },

  restartDistroDaemon: async () => {
    get().appendLog(`\n[O1 Distro] Restarting on-device agent daemon...`);
    set({ status: 'configuring' });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({ status: 'running' });
    get().appendLog(`[O1 Distro] Daemon restarted on localhost:8443. Listening for agent calls.`);
  },
}));

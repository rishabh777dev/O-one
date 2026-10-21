import { create } from 'zustand';
import { HostInfo, HostMode } from '../types';

interface HostState {
  currentHost: HostInfo;
  availableHosts: HostInfo[];
  setHostMode: (mode: HostMode) => void;
  updateTelemetry: (data: Partial<HostInfo>) => void;
}

export const defaultHost: HostInfo = {
  id: 'azure-vm-main',
  name: 'Local Host & VM (24/7)',
  specs: 'Standard_B4ms · 4vCPU 16GB',
  tailscaleIp: '100.92.14.8',
  linuxKernel: 'Ubuntu 24.04 (WSL2 Linux 5.15)',
  antigravityVersion: 'Active',
  hermesPid: 1420,
  diskUsage: '34.2 GB / 128 GB',
  pingMs: 24,
  status: 'connected',
  mode: 'Local PC',
};

export const useHostStore = create<HostState>((set) => ({
  currentHost: defaultHost,
  availableHosts: [
    defaultHost,
    {
      id: 'azure-vm',
      name: 'Azure VM (Student Plan)',
      specs: 'Standard_B4ms · Ubuntu 24.04',
      tailscaleIp: '100.92.14.8',
      linuxKernel: 'Ubuntu 24.04 LTS (Kernel 6.8)',
      antigravityVersion: 'Active',
      hermesPid: 2401,
      diskUsage: '12 GB / 64 GB',
      pingMs: 28,
      status: 'connected',
      mode: 'Azure VM',
    },
  ],
  setHostMode: (mode) =>
    set((state) => ({
      currentHost: { ...state.currentHost, mode },
    })),
  updateTelemetry: (data) =>
    set((state) => ({
      currentHost: { ...state.currentHost, ...data },
    })),
}));

import { create } from 'zustand';
import { HostInfo, HostMode } from '../types';

interface HostState {
  currentHost: HostInfo;
  availableHosts: HostInfo[];
  setHostMode: (mode: HostMode) => void;
  updateTelemetry: (pingMs: number) => void;
}

export const defaultHost: HostInfo = {
  id: 'azure-vm-main',
  name: 'Azure VM (24/7)',
  specs: 'Standard_B4ms · 4vCPU 16GB',
  tailscaleIp: '100.92.14.8',
  antigravityVersion: 'v1.4.2 Active',
  hermesPid: 1420,
  diskUsage: '34.2 GB / 128 GB',
  pingMs: 24,
  status: 'connected',
  mode: 'Azure VM',
};

export const useHostStore = create<HostState>((set) => ({
  currentHost: defaultHost,
  availableHosts: [
    defaultHost,
    {
      id: 'local-laptop',
      name: 'Work Laptop (Local)',
      specs: 'M3 Pro / Intel i9 · 32GB',
      tailscaleIp: '100.92.14.9',
      antigravityVersion: 'v1.4.2 Standby',
      hermesPid: 0,
      diskUsage: '180 GB / 512 GB',
      pingMs: 4,
      status: 'standby',
      mode: 'Local PC',
    },
  ],
  setHostMode: (mode) =>
    set((state) => ({
      currentHost: { ...state.currentHost, mode },
    })),
  updateTelemetry: (pingMs) =>
    set((state) => ({
      currentHost: { ...state.currentHost, pingMs },
    })),
}));

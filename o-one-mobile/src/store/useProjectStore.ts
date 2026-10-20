import { create } from 'zustand';
import { ProjectSession, CodeDiffData } from '../types';

interface ProjectState {
  sessions: ProjectSession[];
  activeSessionId: string;
  activeDiff: CodeDiffData | null;
  terminalLogs: string[];
  isTerminalVisible: boolean;

  setActiveSession: (id: string) => void;
  createSession: (title: string) => void;
  applyDiff: () => void;
  rejectDiff: () => void;
  toggleTerminal: () => void;
}

const initialDiff: CodeDiffData = {
  filePath: 'src/auth/jwt.ts',
  additions: 4,
  deletions: 2,
  lines: [
    { type: 'ctx', lineNo: 18, content: 'export async function verifyToken(req) {' },
    { type: 'del', lineNo: 19, content: '-  const token = await jwt.verify(req.token, SECRET);' },
    { type: 'del', lineNo: 20, content: '-  return token;' },
    { type: 'add', lineNo: 19, content: '+  // Grace window for concurrent refresh requests' },
    { type: 'add', lineNo: 20, content: '+  const token = await jwt.verifyWithGrace(req.token, {' },
    { type: 'add', lineNo: 21, content: '+    clockTolerance: 30' },
    { type: 'add', lineNo: 22, content: '+  });' },
    { type: 'ctx', lineNo: 23, content: '   return token;' },
  ],
};

export const useProjectStore = create<ProjectState>((set) => ({
  sessions: [
    {
      id: 'session-1',
      title: '#1 Fix Auth Token Race',
      branch: 'main',
      status: 'active',
      createdAt: '10m ago',
    },
    {
      id: 'session-2',
      title: '#2 Refactor DB Pool',
      branch: 'feat/pg-pool',
      status: 'active',
      createdAt: '1h ago',
    },
  ],
  activeSessionId: 'session-1',
  activeDiff: initialDiff,
  terminalLogs: [
    'azureuser@o1-vm:~/cadence$ git status',
    'On branch main. 1 file changed, 4 insertions(+), 2 deletions(-)',
    'npm test: PASS src/auth/jwt.test.ts (4 tests, 0 failures)',
    'Antigravity ACP session listening for diff approval...',
  ],
  isTerminalVisible: true,

  setActiveSession: (id) => set({ activeSessionId: id }),
  createSession: (title) =>
    set((state) => ({
      sessions: [
        ...state.sessions,
        {
          id: `session-${Date.now()}`,
          title: `#${state.sessions.length + 1} ${title}`,
          branch: 'main',
          status: 'active',
          createdAt: 'Just now',
        },
      ],
      activeSessionId: `session-${Date.now()}`,
    })),
  applyDiff: () =>
    set((state) => ({
      activeDiff: null,
      terminalLogs: [
        ...state.terminalLogs,
        'Applied patch: git apply src/auth/jwt.patch (Exit 0)',
        'Build passed. Automated suite clean.',
      ],
    })),
  rejectDiff: () =>
    set((state) => ({
      activeDiff: null,
      terminalLogs: [...state.terminalLogs, 'Patch discarded.'],
    })),
  toggleTerminal: () => set((state) => ({ isTerminalVisible: !state.isTerminalVisible })),
}));

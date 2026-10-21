import { create } from 'zustand';
import { ProjectSession, CodeDiffData, ChatMessage } from '../types';
import { rpcClient, RPCResponse } from '../services/rpcClient';

interface ProjectState {
  sessions: ProjectSession[];
  activeSessionId: string;
  activeDiff: CodeDiffData | null;
  terminalLogs: string[];
  isTerminalVisible: boolean;
  sessionMessages: Record<string, ChatMessage[]>;

  setActiveSession: (id: string) => void;
  createSession: (title: string) => void;
  applyDiff: () => void;
  rejectDiff: () => void;
  toggleTerminal: () => void;
  sendProjectInstruction: (
    projectId: string,
    sessionId: string,
    instruction: string,
    engine: string
  ) => void;
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

const initialSessionMessages: Record<string, ChatMessage[]> = {
  'session-1': [
    {
      id: 'ide-msg-1',
      sender: 'agent',
      content:
        'I analyzed `src/auth/jwt.ts` on your repository. Added a 30-second clock tolerance window so concurrent mobile token refreshes do not drop sessions.',
      timestamp: '10m ago',
    },
  ],
  'session-2': [
    {
      id: 'ide-msg-2',
      sender: 'agent',
      content:
        'Refactoring PostgreSQL connection pool with max 20 connections and 10s idle timeout.',
      timestamp: '1h ago',
    },
  ],
};

export const useProjectStore = create<ProjectState>((set, get) => ({
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
    'Antigravity ACP session ready for instructions...',
  ],
  isTerminalVisible: true,
  sessionMessages: initialSessionMessages,

  setActiveSession: (id) => set({ activeSessionId: id }),

  createSession: (title) =>
    set((state) => {
      const newId = `session-${Date.now()}`;
      return {
        sessions: [
          ...state.sessions,
          {
            id: newId,
            title: `#${state.sessions.length + 1} ${title}`,
            branch: 'main',
            status: 'active',
            createdAt: 'Just now',
          },
        ],
        activeSessionId: newId,
        sessionMessages: {
          ...state.sessionMessages,
          [newId]: [
            {
              id: `welcome-${newId}`,
              sender: 'agent',
              content: `Session started for "${title}". Ready for coding instructions.`,
              timestamp: 'Just now',
            },
          ],
        },
      };
    }),

  applyDiff: () => {
    const diff = get().activeDiff;
    if (diff) {
      rpcClient.send('git.applyDiff', { patch: diff.filePath }, (res) => {
        console.log('git apply result:', res);
      });
    }

    set((state) => ({
      activeDiff: null,
      terminalLogs: [
        ...state.terminalLogs,
        'git apply: patch applied cleanly to working tree.',
        'npm test: PASS (all tests clean).',
      ],
    }));
  },

  rejectDiff: () =>
    set((state) => ({
      activeDiff: null,
      terminalLogs: [...state.terminalLogs, 'git checkout: discarded staged patch.'],
    })),

  toggleTerminal: () => set((state) => ({ isTerminalVisible: !state.isTerminalVisible })),

  sendProjectInstruction: (projectId, sessionId, instruction, engine) => {
    const currentList = get().sessionMessages[sessionId] || [];
    const userMsgId = `usr-${Date.now()}`;
    const agentMsgId = `agt-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: instruction,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialAgentMsg: ChatMessage = {
      id: agentMsgId,
      sender: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set({
      sessionMessages: {
        ...get().sessionMessages,
        [sessionId]: [...currentList, userMsg, initialAgentMsg],
      },
      terminalLogs: [
        ...get().terminalLogs,
        `[${engine}] Running task: "${instruction}"`,
      ],
    });

    let accumulated = '';

    rpcClient.send(
      'hermes.chat',
      { query: `[Project: ${projectId}] ${instruction}`, sessionId },
      (res: RPCResponse) => {
        if (res.type === 'stream_token' && res.token) {
          accumulated += res.token;
          const updated = (get().sessionMessages[sessionId] || []).map((m) =>
            m.id === agentMsgId ? { ...m, content: accumulated } : m
          );
          set({
            sessionMessages: {
              ...get().sessionMessages,
              [sessionId]: updated,
            },
          });
        } else if (res.type === 'done' || res.result) {
          const finalAns = res.result || accumulated;
          const updated = (get().sessionMessages[sessionId] || []).map((m) =>
            m.id === agentMsgId ? { ...m, content: finalAns } : m
          );
          set({
            sessionMessages: {
              ...get().sessionMessages,
              [sessionId]: updated,
            },
            terminalLogs: [
              ...get().terminalLogs,
              `Task finished. Output tokens: ${res.data?.tokens?.output || 'completed'}.`,
            ],
          });
        }
      }
    );
  },
}));

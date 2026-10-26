import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, Agent } from '../types';
import { rpcClient, RPCResponse } from '../services/rpcClient';
import { useAppStore } from './useAppStore';

const STORAGE_KEY_MESSAGES = '@o1_chat_messages_v2';
const STORAGE_KEY_SESSIONS = '@o1_chat_sessions_v1';
const STORAGE_KEY_TITLES = '@o1_chat_titles_v1';

export function sanitizeChatMessage(text: string): string {
  if (!text) return '';
  return text
    // Strip ANSI escape sequences (e.g. \u001b[0m, \x1b[32m)
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
    .replace(/\u001B\[[0-9;]*[a-zA-Z]/g, '')
    // Strip control characters
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    // Strip leftover terminal box glyphs like □[0m, ■[0m, ?[0m
    .replace(/^[□■\?]?\[\d+m/gm, '')
    .replace(/[□■\?]?\[\d+m/g, '')
    // Strip OpenCode build headers
    .replace(/^> build · [^\n]+\n*/gm, '')
    // Strip Hermes banner artifacts
    .replace(/^(\u21bb|\u21ba|\u27f3)?\s*Resumed session\s+[^\n]+\n*/gim, '')
    .replace(/^session_id:\s*[^\n]+\n*/gim, '')
    .replace(/^Warning:\s*[^\n]+\n*/gim, '')
    .trim();
}

interface AgentState {
  messages: Record<string, ChatMessage[]>;
  sessions: Record<string, string>;
  sessionTitles: Record<string, string>;
  initMessages: () => Promise<void>;
  sendMessage: (agent: Agent, text: string) => void;
  resolveActionCard: (agentId: string, messageId: string, approved: boolean) => void;
  clearMessages: (agentId: string) => void;
  startNewSession: (agentId: string) => void;
  switchSession: (agentId: string, sessionId: string, title?: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: {},
  sessions: {},
  sessionTitles: {},

  initMessages: async () => {
    try {
      let data = await AsyncStorage.getItem(STORAGE_KEY_MESSAGES);
      if (!data) {
        data = await AsyncStorage.getItem('@o1_chat_messages');
      }
      if (data) {
        const parsed = JSON.parse(data);
        const cleaned: Record<string, ChatMessage[]> = {};
        for (const [k, v] of Object.entries(parsed)) {
          cleaned[k] = (v as ChatMessage[])
            .map((m) => ({
              ...m,
              content: sanitizeChatMessage(m.content),
              isThinking: false, // Persisted messages are never left in thinking state
            }))
            .filter((m) => (m.content && m.content.trim().length > 0) || m.actionCard);
        }
        set({ messages: cleaned });
      }
      const sessData = await AsyncStorage.getItem(STORAGE_KEY_SESSIONS);
      if (sessData) {
        set({ sessions: JSON.parse(sessData) });
      }
      const titlesData = await AsyncStorage.getItem(STORAGE_KEY_TITLES);
      if (titlesData) {
        set({ sessionTitles: JSON.parse(titlesData) });
      }

      // If an agent has an active session ID but local messages array is empty, restore messages from daemon
      const activeSessions = sessData ? JSON.parse(sessData) : {};
      const currentMessages = get().messages;
      for (const [agentId, sessId] of Object.entries(activeSessions)) {
        if (sessId && (!currentMessages[agentId] || currentMessages[agentId].length === 0)) {
          rpcClient.send('hermes.sessions.messages', { sessionId: sessId }, (res: RPCResponse) => {
            if (res.type === 'result' && Array.isArray(res.messages) && res.messages.length > 0) {
              const mapped: ChatMessage[] = res.messages.map((m: any) => ({
                id: m.id || `msg-${Date.now()}-${Math.random()}`,
                sender: m.sender || 'agent',
                content: sanitizeChatMessage(m.content),
                timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }));
              const next = { ...get().messages, [agentId]: mapped };
              set({ messages: next });
              AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(next));
            }
          });
        }
      }
    } catch {}
  },

  startNewSession: (agentId: string) => {
    const nextSessions = { ...get().sessions };
    delete nextSessions[agentId];
    const nextTitles = { ...get().sessionTitles };
    delete nextTitles[agentId];
    const nextMessages = { ...get().messages, [agentId]: [] };

    set({
      sessions: nextSessions,
      sessionTitles: nextTitles,
      messages: nextMessages,
    });
    AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(nextSessions));
    AsyncStorage.setItem(STORAGE_KEY_TITLES, JSON.stringify(nextTitles));
    AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(nextMessages));
  },

  switchSession: async (agentId: string, sessionId: string, title?: string) => {
    const nextSessions = { ...get().sessions, [agentId]: sessionId };
    const nextTitles = { ...get().sessionTitles, [agentId]: title || sessionId };
    set({ sessions: nextSessions, sessionTitles: nextTitles });
    AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(nextSessions));
    AsyncStorage.setItem(STORAGE_KEY_TITLES, JSON.stringify(nextTitles));

    // Request messages for this session from host daemon
    rpcClient.send('hermes.sessions.messages', { sessionId }, (res: RPCResponse) => {
      if (res.type === 'result' && Array.isArray(res.messages)) {
        const mapped: ChatMessage[] = res.messages.map((m: any) => ({
          id: m.id,
          sender: m.sender,
          content: sanitizeChatMessage(m.content),
          timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        const nextMessages = { ...get().messages, [agentId]: mapped };
        set({ messages: nextMessages });
        AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(nextMessages));
      }
    });
  },

  sendMessage: (agent, text) => {
    const agentId = agent.id;
    const currentList = get().messages[agentId] || [];

    // 1. Purge any stale, empty, or orphaned thinking bubbles from previous interrupted runs
    const cleanedList = currentList.filter(
      (m) => (m.content && m.content.trim().length > 0) || m.actionCard
    );

    // 2. Prepare the App Brain conversation context from recent valid turns
    const recentHistory = cleanedList
      .slice(-12)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: sanitizeChatMessage(m.content),
      }));

    const userMsgId = `user-${Date.now()}`;
    const agentMsgId = `agent-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialAgentMsg: ChatMessage = {
      id: agentMsgId,
      sender: 'agent',
      content: '',
      isThinking: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser = [...cleanedList, userMsg, initialAgentMsg];
    const nextMessages = {
      ...get().messages,
      [agentId]: updatedWithUser,
    };
    set({ messages: nextMessages });
    AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(nextMessages));

    let accumulatedText = '';

    // Choose execution method based on agent's engine
    if (agent.engine === 'linux_shell') {
      rpcClient.send(
        'terminal.execute',
        { command: text, shellType: 'wsl' },
        (res: RPCResponse) => {
          if ((res.type === 'stdout' || res.type === 'stderr') && res.data) {
            accumulatedText += res.data;
            const updated = (get().messages[agentId] || []).map((m) =>
              m.id === agentMsgId ? { ...m, content: accumulatedText, isThinking: false } : m
            );
            set({ messages: { ...get().messages, [agentId]: updated } });
          } else if (res.type === 'done') {
            const final = accumulatedText || 'Command executed (Exit 0)';
            const updated = (get().messages[agentId] || []).map((m) =>
              m.id === agentMsgId ? { ...m, content: final, isThinking: false } : m
            );
            set({ messages: { ...get().messages, [agentId]: updated } });
            AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(get().messages));
          }
        }
      );
      return;
    }

    // On-Device Phone Environment: Execute hermes CLI in phone's local Linux runtime
    const activeServerId = useAppStore.getState().activeServerId;
    const servers = useAppStore.getState().servers;
    const currentServer = servers.find((s) => s.id === activeServerId);
    const isOnDevice =
      currentServer?.type === 'phone' ||
      activeServerId === 'server-ondevice-alpine' ||
      agent.serverId === 'server-ondevice-alpine';

    if (isOnDevice && agent.engine === 'hermes') {
      const activeSession = get().sessions[agentId];
      const safePrompt = text.replace(/"/g, '\\"');
      let phoneCmd = `hermes chat -q "${safePrompt}" --format stream-json -Q`;
      if (activeSession) {
        phoneCmd += ` --resume ${activeSession}`;
      }
      if (agent.model) {
        phoneCmd += ` -m ${agent.model}`;
      }

      rpcClient.send(
        'terminal.execute',
        { command: phoneCmd, shellType: 'phone' },
        (res: RPCResponse) => {
          if (res.data) {
            const rawLines = res.data.split('\n');
            for (const line of rawLines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                const evt = JSON.parse(trimmed);
                if (evt.type === 'text' && evt.text) {
                  accumulatedText += evt.text;
                } else if (evt.type === 'result' && evt.text) {
                  accumulatedText = evt.text;
                }
              } catch {
                if (
                  !trimmed.includes('Resumed session') &&
                  !trimmed.startsWith('Warning:') &&
                  !trimmed.startsWith('session_id:')
                ) {
                  accumulatedText += trimmed + '\n';
                }
              }
            }
            const updated = (get().messages[agentId] || []).map((m) =>
              m.id === agentMsgId ? { ...m, content: sanitizeChatMessage(accumulatedText), isThinking: false } : m
            );
            set({ messages: { ...get().messages, [agentId]: updated } });
          } else if (res.type === 'done') {
            const final = sanitizeChatMessage(accumulatedText) || '✓ Turn complete';
            const updated = (get().messages[agentId] || []).map((m) =>
              m.id === agentMsgId ? { ...m, content: final, isThinking: false } : m
            );
            set({ messages: { ...get().messages, [agentId]: updated } });
            AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(get().messages));
          }
        }
      );
      return;
    }

    let rpcMethod = 'hermes.chat';
    if (agent.engine === 'antigravity') {
      rpcMethod = 'antigravity.run';
    } else if (
      agent.engine === 'opencode' ||
      (agent.model &&
        (agent.model.startsWith('opencode/') ||
          agent.model.includes('flash-free') ||
          agent.model.includes('pickle') ||
          agent.model.includes('beam') ||
          agent.model.includes('ultra-free') ||
          agent.model.includes('lightning-free')))
    ) {
      rpcMethod = 'opencode.run';
    }

    const thinkingTimeout = setTimeout(() => {
      const currentMsg = (get().messages[agentId] || []).find((m) => m.id === agentMsgId);
      if (currentMsg && currentMsg.isThinking) {
        const fallbackText =
          accumulatedText ||
          '⚠️ Response timed out after 45s. Verify that the host daemon is running on your laptop.';
        const updatedList = (get().messages[agentId] || []).map((m) =>
          m.id === agentMsgId ? { ...m, content: fallbackText, isThinking: false } : m
        );
        set({ messages: { ...get().messages, [agentId]: updatedList } });
      }
    }, 45000);

    rpcClient.send(
      rpcMethod,
      {
        query: text,
        prompt: text,
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        cwd: agent.workspacePath,
        agentId,
        sessionId: get().sessions[agentId],
        history: recentHistory,
      },
      (res: RPCResponse) => {
        if (res.type === 'stream_token' || res.type === 'done' || res.type === 'process_exit') {
          clearTimeout(thinkingTimeout);
        }

        if (res.type === 'stream_token' && res.token) {
          const cleanToken = res.token
            .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
            .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '');
          accumulatedText += cleanToken;
          const updatedList = (get().messages[agentId] || []).map((m) =>
            m.id === agentMsgId ? { ...m, content: sanitizeChatMessage(accumulatedText), isThinking: false } : m
          );
          set({
            messages: {
              ...get().messages,
              [agentId]: updatedList,
            },
          });
        } else if (res.type === 'session_info') {
          if (res.sessionId) {
            const nextSessions = { ...get().sessions, [agentId]: res.sessionId };
            const nextTitles = { ...get().sessionTitles };
            if (res.sessionTitle) {
              nextTitles[agentId] = res.sessionTitle;
            }
            set({ sessions: nextSessions, sessionTitles: nextTitles });
            AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(nextSessions));
            AsyncStorage.setItem(STORAGE_KEY_TITLES, JSON.stringify(nextTitles));
          }
        } else if (res.type === 'stdout' && res.data) {
          const cleanData = res.data
            .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
            .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '');
          const isBanner =
            cleanData.includes('Resumed session') ||
            cleanData.startsWith('Warning:') ||
            cleanData.startsWith('session_id:');
          if (!isBanner) {
            accumulatedText += cleanData;
            const updatedList = (get().messages[agentId] || []).map((m) =>
              m.id === agentMsgId ? { ...m, content: sanitizeChatMessage(accumulatedText), isThinking: false } : m
            );
            set({
              messages: {
                ...get().messages,
                [agentId]: updatedList,
              },
            });
          }
        } else if (res.type === 'stderr' && res.data) {
          // Diagnostic CLI logs/colors on stderr should not be appended to chat text
          console.log('[RPC Diagnostic stderr]:', res.data);
        } else if (res.type === 'done' || res.result) {
          // Keep accumulatedText if it has streamed content so the text doesn't abruptly mutate
          const streamText = sanitizeChatMessage(accumulatedText);
          const resultText = sanitizeChatMessage(res.result || '');
          let settled = streamText;
          if (!settled || (resultText && resultText.length > streamText.length && !streamText.includes(resultText))) {
            settled = resultText || settled;
          }
          if (!settled) {
            settled = '✓ Message received.';
          }

          const updatedList = (get().messages[agentId] || []).map((m) =>
            m.id === agentMsgId ? { ...m, content: sanitizeChatMessage(settled), isThinking: false } : m
          );

          const nextSessions = { ...get().sessions };
          const nextTitles = { ...get().sessionTitles };
          if (res.sessionId) {
            nextSessions[agentId] = res.sessionId;
          }
          if (res.sessionTitle) {
            nextTitles[agentId] = res.sessionTitle;
          }

          const finalMessages = {
            ...get().messages,
            [agentId]: updatedList,
          };
          set({
            messages: finalMessages,
            sessions: nextSessions,
            sessionTitles: nextTitles,
          });
          AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(nextSessions));
          AsyncStorage.setItem(STORAGE_KEY_TITLES, JSON.stringify(nextTitles));
          AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(finalMessages));
        } else if (res.type === 'process_exit') {
          const currentMsg = (get().messages[agentId] || []).find((m) => m.id === agentMsgId);
          if (currentMsg && currentMsg.isThinking && !currentMsg.content) {
            const fallbackText = sanitizeChatMessage(accumulatedText) || '✓ Finished';
            const updatedList = (get().messages[agentId] || []).map((m) =>
              m.id === agentMsgId ? { ...m, content: fallbackText, isThinking: false } : m
            );
            const finalMessages = {
              ...get().messages,
              [agentId]: updatedList,
            };
            set({ messages: finalMessages });
            AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(finalMessages));
          }
        }
      }
    );
  },

  resolveActionCard: (agentId, messageId, approved) =>
    set((state) => {
      const list = state.messages[agentId] || [];
      const updated = list.map((m) => {
        if (m.id === messageId && m.actionCard) {
          return {
            ...m,
            content: approved
              ? `✓ Approved: ${m.actionCard.title} executed on host.`
              : `✕ Discarded: ${m.actionCard.title}.`,
            actionCard: undefined,
          };
        }
        return m;
      });

      const newMessages = { ...state.messages, [agentId]: updated };
      AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(newMessages));
      return { messages: newMessages };
    }),

  clearMessages: (agentId) =>
    set((state) => {
      const newMessages = { ...state.messages, [agentId]: [] };
      const newSessions = { ...state.sessions };
      delete newSessions[agentId];
      const newTitles = { ...state.sessionTitles };
      delete newTitles[agentId];

      AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(newMessages));
      AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(newSessions));
      AsyncStorage.setItem(STORAGE_KEY_TITLES, JSON.stringify(newTitles));
      return { messages: newMessages, sessions: newSessions, sessionTitles: newTitles };
    }),
}));

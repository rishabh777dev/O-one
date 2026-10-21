import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, Agent } from '../types';
import { rpcClient, RPCResponse } from '../services/rpcClient';

const STORAGE_KEY_MESSAGES = '@o1_chat_messages_v2';

interface AgentState {
  messages: Record<string, ChatMessage[]>;
  initMessages: () => Promise<void>;
  sendMessage: (agent: Agent, text: string) => void;
  resolveActionCard: (agentId: string, messageId: string, approved: boolean) => void;
  clearMessages: (agentId: string) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  // Pure blank slate: no hardcoded agent messages
  messages: {},

  initMessages: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_MESSAGES);
      if (data) {
        set({ messages: JSON.parse(data) });
      }
    } catch {}
  },

  sendMessage: (agent, text) => {
    const agentId = agent.id;
    const currentList = get().messages[agentId] || [];
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser = [...currentList, userMsg, initialAgentMsg];

    set({
      messages: {
        ...get().messages,
        [agentId]: updatedWithUser,
      },
    });

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
              m.id === agentMsgId ? { ...m, content: accumulatedText } : m
            );
            set({ messages: { ...get().messages, [agentId]: updated } });
          } else if (res.type === 'done') {
            const final = accumulatedText || 'Command executed (Exit 0)';
            const updated = (get().messages[agentId] || []).map((m) =>
              m.id === agentMsgId ? { ...m, content: final } : m
            );
            set({ messages: { ...get().messages, [agentId]: updated } });
            AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(get().messages));
          }
        }
      );
      return;
    }

    const rpcMethod = agent.engine === 'antigravity' ? 'antigravity.run' : 'hermes.chat';

    rpcClient.send(
      rpcMethod,
      {
        query: text,
        prompt: text,
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        cwd: agent.workspacePath,
        agentId,
      },
      (res: RPCResponse) => {
        if (res.type === 'stream_token' && res.token) {
          accumulatedText += res.token;
          const updatedList = (get().messages[agentId] || []).map((m) =>
            m.id === agentMsgId ? { ...m, content: accumulatedText } : m
          );
          set({
            messages: {
              ...get().messages,
              [agentId]: updatedList,
            },
          });
        } else if (res.type === 'done' || res.result) {
          const finalText = res.result || accumulatedText;
          const updatedList = (get().messages[agentId] || []).map((m) =>
            m.id === agentMsgId ? { ...m, content: finalText } : m
          );
          set({
            messages: {
              ...get().messages,
              [agentId]: updatedList,
            },
          });
          AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(get().messages));
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
      AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(newMessages));
      return { messages: newMessages };
    }),
}));

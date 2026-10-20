import { create } from 'zustand';
import { ChatMessage } from '../types';
import { rpcClient, RPCResponse } from '../services/rpcClient';

interface AgentState {
  messages: Record<string, ChatMessage[]>;
  sendMessage: (agentId: string, text: string) => void;
  resolveActionCard: (agentId: string, messageId: string, approved: boolean) => void;
}

const initialMessages: Record<string, ChatMessage[]> = {
  chief: [
    {
      id: 'chief-welcome',
      sender: 'agent',
      content: 'Chief active on local Hermes engine (gpt-5.6-luna). Ready to execute commands or software engineering tasks.',
      timestamp: 'Just now',
    },
  ],
  'support-agent': [
    {
      id: 'sa-welcome',
      sender: 'agent',
      content: 'Support Agent standing by. Connected to Sentry, GitHub, and local Hermes pipeline.',
      timestamp: 'Just now',
    },
  ],
  'devops-sentinel': [
    {
      id: 'dev-welcome',
      sender: 'agent',
      content: 'DevOps Sentinel active. Monitoring host CPU, RAM, and Antigravity CLI daemon.',
      timestamp: 'Just now',
    },
  ],
};

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: initialMessages,

  sendMessage: (agentId, text) => {
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

    // Append user message and placeholder agent message
    set({
      messages: {
        ...get().messages,
        [agentId]: [...currentList, userMsg, initialAgentMsg],
      },
    });

    // Send real command to host daemon
    let accumulatedText = '';

    rpcClient.send(
      'hermes.chat',
      { query: text, agentId },
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
              ? `Action Approved: ${m.actionCard.title} completed on host.`
              : `Action Discarded: ${m.actionCard.title}.`,
            actionCard: undefined,
          };
        }
        return m;
      });

      return {
        messages: {
          ...state.messages,
          [agentId]: updated,
        },
      };
    }),
}));

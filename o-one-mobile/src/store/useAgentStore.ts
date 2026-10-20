import { create } from 'zustand';
import { ChatMessage } from '../types';

interface AgentState {
  messages: Record<string, ChatMessage[]>;
  sendMessage: (agentId: string, text: string) => void;
  resolveActionCard: (agentId: string, messageId: string, approved: boolean) => void;
}

const initialMessages: Record<string, ChatMessage[]> = {
  chief: [
    {
      id: 'msg-1',
      sender: 'agent',
      content: 'I have prepared the follow-up meeting email for the Acme partnership review.',
      timestamp: '5:56 PM',
      actionCard: {
        title: 'New email',
        fields: [
          { label: 'From', value: 'sam@x.ai' },
          { label: 'To', value: 'vicky@acme.co' },
          { label: 'Subject', value: "Re: Thursday's num..." },
        ],
        body: "Hi Vicky,\n\nThursday works. I'll bring the usage summary. Seats and the integration counts are both in there.\n\nSam",
        primaryActionLabel: 'Send email',
        secondaryActionLabel: 'Discard',
        actionType: 'email',
      },
    },
    {
      id: 'msg-2',
      sender: 'user',
      content: 'send the easy one, leave legal',
      timestamp: '5:58 PM',
    },
    {
      id: 'msg-3',
      sender: 'agent',
      content: 'sent one. legal stays. meeting brief for acme is in the thread.',
      timestamp: '5:58 PM',
    },
  ],
  'support-agent': [
    {
      id: 'sa-1',
      sender: 'user',
      content: 'Webhooks for Stripe customer checkouts are dropping on staging. Can you investigate and fix it?',
      timestamp: '6:12 PM',
    },
    {
      id: 'sa-2',
      sender: 'agent',
      content: 'I investigated the Sentry error log. The raw request body stream was consumed by Express JSON parser before the Stripe signature check could verify the HMAC digest.',
      timestamp: '6:13 PM',
      thoughtTrace:
        '1. Queried staging Sentry logs via Tailscale tunnel.\n2. Captured SignatureVerificationError in `api/webhooks/stripe.ts`.\n3. Antigravity CLI inspected route middleware sequence.\n4. Drafted raw buffer preservation fix on branch `fix/stripe-hmac`.',
      actionCard: {
        title: 'Approval Required: Deploy Staging Patch',
        fields: [
          { label: 'Branch', value: 'fix/stripe-hmac' },
          { label: 'Target', value: 'Azure VM Staging Container' },
        ],
        body: 'Hermes will commit the fix, push to remote repository, and reload the Docker container.',
        primaryActionLabel: 'Approve & Deploy',
        secondaryActionLabel: 'Deny',
        actionType: 'deploy',
      },
    },
  ],
  'devops-sentinel': [
    {
      id: 'dev-1',
      sender: 'agent',
      content: 'Azure VM telemetry is nominal. 4 vCPUs active, RAM usage at 28%, Antigravity CLI daemon listening on port 8443.',
      timestamp: '08:00 AM',
    },
  ],
};

export const useAgentStore = create<AgentState>((set) => ({
  messages: initialMessages,
  sendMessage: (agentId, text) =>
    set((state) => {
      const currentList = state.messages[agentId] || [];
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Mock simulated responsive agent
      const agentReply: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'agent',
        content: `Executing instruction on Azure VM via Antigravity CLI... Task queued.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      return {
        messages: {
          ...state.messages,
          [agentId]: [...currentList, userMsg, agentReply],
        },
      };
    }),

  resolveActionCard: (agentId, messageId, approved) =>
    set((state) => {
      const list = state.messages[agentId] || [];
      const updated = list.map((m) => {
        if (m.id === messageId && m.actionCard) {
          return {
            ...m,
            content: approved
              ? `Action Approved: ${m.actionCard.title} completed successfully on host.`
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

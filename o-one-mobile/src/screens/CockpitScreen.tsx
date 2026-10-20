import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useAgentStore } from '../store/useAgentStore';
import { ActionCard } from '../components/common/ActionCard';
import { ThoughtTrace } from '../components/common/ThoughtTrace';
import { ChatMessage } from '../types';

export const CockpitScreen: React.FC = () => {
  const { activeAgent } = useAppStore();
  const { messages, resolveActionCard } = useAgentStore();

  const agentMessages = messages[activeAgent.id] || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {agentMessages.map((msg: ChatMessage) => {
        const isUser = msg.sender === 'user';

        if (isUser) {
          return (
            <View key={msg.id} style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{msg.content}</Text>
              </View>
            </View>
          );
        }

        return (
          <View key={msg.id} style={styles.agentRow}>
            {msg.thoughtTrace ? <ThoughtTrace trace={msg.thoughtTrace} /> : null}

            {msg.content ? (
              <View style={styles.agentBubble}>
                <Text style={styles.agentText}>{msg.content}</Text>
              </View>
            ) : null}

            {msg.actionCard ? (
              <ActionCard
                data={msg.actionCard}
                onPrimaryPress={() => resolveActionCard(activeAgent.id, msg.id, true)}
                onSecondaryPress={() => resolveActionCard(activeAgent.id, msg.id, false)}
              />
            ) : null}
          </View>
        );
      })}

      <Text style={styles.timestampDivider}>5:58 PM</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 14,
  },
  userRow: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
  },
  userBubble: {
    backgroundColor: colors.userBubbleBg,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  userText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.userBubbleText,
  },
  agentRow: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    gap: 8,
  },
  agentBubble: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  agentText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  timestampDivider: {
    textAlign: 'center',
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 6,
  },
});

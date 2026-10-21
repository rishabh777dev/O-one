import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sparkles, Terminal, Activity, GitCommit, ShieldAlert } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useAgentStore } from '../store/useAgentStore';
import { ActionCard } from '../components/common/ActionCard';
import { ThoughtTrace } from '../components/common/ThoughtTrace';
import { ChatMessage } from '../types';

export const CockpitScreen: React.FC = () => {
  const { activeAgent } = useAppStore();
  const { messages, resolveActionCard, sendMessage } = useAgentStore();
  const scrollViewRef = useRef<ScrollView>(null);

  if (!activeAgent) return null;

  const agentMessages = messages[activeAgent.id] || [];

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [agentMessages]);

  const handleStarterPrompt = (prompt: string) => {
    sendMessage(activeAgent, prompt);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
    >
      {/* Empty State / Welcome Cockpit */}
      {agentMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.agentAvatarBox}>
            <Sparkles size={24} color={colors.hermesOrange} />
          </View>
          <Text style={styles.emptyTitle}>{activeAgent.name}</Text>
          <Text style={styles.emptyRole}>{activeAgent.role}</Text>

          <View style={styles.engineBadge}>
            <View style={styles.engineDot} />
            <Text style={styles.engineText}>{activeAgent.engine}</Text>
          </View>

          {/* Capability Pills */}
          <View style={styles.capsRow}>
            {activeAgent.capabilities.map((cap) => (
              <View key={cap} style={styles.capPill}>
                <Text style={styles.capText}>{cap}</Text>
              </View>
            ))}
          </View>

          {/* Quick Prompt Starters */}
          <View style={styles.startersBox}>
            <Text style={styles.startersHeader}>Suggested Instructions</Text>

            <TouchableOpacity
              style={styles.starterPill}
              onPress={() => handleStarterPrompt('Check Azure VM telemetry, RAM, and active processes')}
              activeOpacity={0.7}
            >
              <Activity size={14} color={colors.accentEmerald} />
              <Text style={styles.starterText}>Check Azure VM telemetry & RAM</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.starterPill}
              onPress={() => handleStarterPrompt('Audit git status and review recent commits on branch main')}
              activeOpacity={0.7}
            >
              <GitCommit size={14} color="#60A5FA" />
              <Text style={styles.starterText}>Audit git status & branch main</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.starterPill}
              onPress={() => handleStarterPrompt('Run automated test suite via Antigravity CLI')}
              activeOpacity={0.7}
            >
              <Terminal size={14} color={colors.hermesOrange} />
              <Text style={styles.starterText}>Run automated test suite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.starterPill}
              onPress={() => handleStarterPrompt('Query Sentry API for any critical error spikes in past hour')}
              activeOpacity={0.7}
            >
              <ShieldAlert size={14} color={colors.accentRose} />
              <Text style={styles.starterText}>Scan Sentry for recent error spikes</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Message Stream */}
      {agentMessages.map((msg: ChatMessage) => {
        const isUser = msg.sender === 'user';

        if (isUser) {
          return (
            <View key={msg.id} style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{msg.content}</Text>
              </View>
              {msg.timestamp ? (
                <Text style={styles.msgTimeUser}>{msg.timestamp}</Text>
              ) : null}
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
            ) : (
              <View style={styles.generatingBubble}>
                <View style={styles.generatingDot} />
                <Text style={styles.generatingText}>Hermes executing...</Text>
              </View>
            )}

            {msg.actionCard ? (
              <ActionCard
                data={msg.actionCard}
                onPrimaryPress={() => resolveActionCard(activeAgent.id, msg.id, true)}
                onSecondaryPress={() => resolveActionCard(activeAgent.id, msg.id, false)}
              />
            ) : null}

            {msg.timestamp ? (
              <Text style={styles.msgTimeAgent}>{msg.timestamp}</Text>
            ) : null}
          </View>
        );
      })}
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
    paddingTop: 12,
    paddingBottom: 20,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  agentAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#232328',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyRole: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderRadius: 9999,
    marginTop: 2,
  },
  engineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.hermesOrange,
  },
  engineText: {
    fontSize: 11,
    color: colors.hermesOrange,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  capsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  capPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bgCardInner,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderInner,
  },
  capText: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  startersBox: {
    width: '100%',
    maxWidth: 340,
    gap: 8,
    marginTop: 10,
  },
  startersHeader: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  starterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 16,
  },
  starterText: {
    fontSize: 12.5,
    color: '#E5E7EB',
  },
  userRow: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: colors.userBubbleBg,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  userText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.userBubbleText,
  },
  msgTimeUser: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    marginRight: 8,
    fontFamily: 'monospace',
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
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  agentText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  msgTimeAgent: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  generatingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  generatingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentEmerald,
  },
  generatingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Copy,
  Smile,
  Reply,
  CheckSquare,
  Activity,
  GitCommit,
  Terminal,
  ShieldAlert,
  Globe,
  Plus,
  History,
  MessageSquare,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useAgentStore, sanitizeChatMessage } from '../store/useAgentStore';
import { ActionCard } from '../components/common/ActionCard';
import { ThoughtTrace } from '../components/common/ThoughtTrace';
import { CreatureAvatar } from '../components/common/CreatureAvatar';
import { AgentInfoModal } from '../components/common/AgentInfoModal';
import { HermesSessionsModal } from '../components/common/HermesSessionsModal';
import { ChatMessage } from '../types';

interface ThinkingBubbleProps {
  color: string;
}

const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ color }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const textOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Shimmering text loop
    const textLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    textLoop.start();

    // Staggered pulsing dots
    const animateDot = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.25,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, 640 - delay)),
        ])
      );
    };

    const d1 = animateDot(dot1, 0);
    const d2 = animateDot(dot2, 180);
    const d3 = animateDot(dot3, 360);

    d1.start();
    d2.start();
    d3.start();

    return () => {
      textLoop.stop();
      d1.stop();
      d2.stop();
      d3.stop();
    };
  }, [dot1, dot2, dot3, textOpacity]);

  return (
    <View style={styles.thinkingBubble}>
      <View style={styles.thinkingDotsWrap}>
        <Animated.View
          style={[
            styles.pulseDot,
            { backgroundColor: color, opacity: dot1, transform: [{ scale: dot1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseDot,
            { backgroundColor: color, opacity: dot2, transform: [{ scale: dot2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseDot,
            { backgroundColor: color, opacity: dot3, transform: [{ scale: dot3 }] },
          ]}
        />
      </View>
      <Animated.Text style={[styles.thinkingLabel, { opacity: textOpacity }]}>
        Thinking...
      </Animated.Text>
    </View>
  );
};

export const CockpitScreen: React.FC = () => {
  const { activeAgent, setSurface } = useAppStore();
  const { messages, sessions, sessionTitles, sendMessage, startNewSession } = useAgentStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const agentMessages = activeAgent ? messages[activeAgent.id] || [] : [];
  const activeSessionId = activeAgent ? sessions[activeAgent.id] : undefined;
  const activeSessionTitle = activeAgent ? sessionTitles[activeAgent.id] : undefined;

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [agentMessages]);

  if (!activeAgent) return null;

  const agentColor = activeAgent.avatarColor || '#2563EB';

  const handleCopyMessage = (text: string, id: string) => {
    Clipboard.setStringAsync(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleStarterPrompt = (prompt: string) => {
    sendMessage(activeAgent, prompt);
  };

  return (
    <View style={styles.container}>
      {/* Cockpit Custom Header */}
      <View style={styles.header}>
        {/* Left Circular Back Button -> Returns to Home Directory */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSurface('home')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* Center Pill Button -> Avatar + Name + Session Subtitle */}
        <TouchableOpacity
          style={styles.centerPill}
          onPress={() => setShowInfoModal(true)}
          activeOpacity={0.8}
        >
          <CreatureAvatar
            shapeIndex={activeAgent.avatarShape ?? 0}
            color={agentColor}
            size={22}
            showGlow={false}
          />
          <View style={styles.centerNameCol}>
            <Text style={styles.centerPillTitle} numberOfLines={1}>
              {activeAgent.name}
            </Text>
            <TouchableOpacity
              onPress={() => setShowSessionsModal(true)}
              style={styles.headerSessionChip}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <View
                style={[
                  styles.headerSessionDot,
                  { backgroundColor: activeSessionId ? colors.accentEmerald : '#71717A' },
                ]}
              />
              <Text style={styles.headerSessionText} numberOfLines={1}>
                {activeSessionTitle || (activeSessionId ? 'Continuation Chat' : 'New Session')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Right Action Buttons: "+ New Chat" and "Sessions History" */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              Alert.alert(
                'Start New Session?',
                activeSessionTitle
                  ? `Current session "${activeSessionTitle}" is saved in history. Starting fresh will begin a clean conversation.`
                  : 'Start a fresh conversation thread with clean context.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Start New',
                    style: 'default',
                    onPress: () => startNewSession(activeAgent.id),
                  },
                ]
              );
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowSessionsModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <History size={17} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Scroll View */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Empty State / Welcome Cockpit */}
        {agentMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.heroAvatarBox}>
              <CreatureAvatar
                shapeIndex={activeAgent.avatarShape ?? 0}
                color={agentColor}
                size={76}
                showGlow={true}
              />
            </View>

            <Text style={styles.emptyTitle}>{activeAgent.name}</Text>
            <Text style={styles.emptyRole}>{activeAgent.role || 'Autonomous Engineer'}</Text>

            <View style={styles.engineBadge}>
              <View style={[styles.engineDot, { backgroundColor: agentColor }]} />
              <Text style={styles.engineText}>{activeAgent.engineLabel || activeAgent.model}</Text>
            </View>

            {/* Quick Prompt Starters */}
            <View style={styles.startersBox}>
              <Text style={styles.startersHeader}>Suggested Instructions</Text>

              <TouchableOpacity
                style={styles.starterPill}
                onPress={() =>
                  handleStarterPrompt('Check WSL2 Ubuntu Linux kernel, RAM, and active processes')
                }
                activeOpacity={0.7}
              >
                <Activity size={14} color={colors.accentEmerald} />
                <Text style={styles.starterText}>Check Linux kernel telemetry & RAM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.starterPill}
                onPress={() =>
                  handleStarterPrompt('Audit git status and review recent commits in workspace')
                }
                activeOpacity={0.7}
              >
                <GitCommit size={14} color="#60A5FA" />
                <Text style={styles.starterText}>Audit git status & workspace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.starterPill}
                onPress={() =>
                  handleStarterPrompt('Run automated test suite and check for code anomalies')
                }
                activeOpacity={0.7}
              >
                <Terminal size={14} color={colors.hermesOrange} />
                <Text style={styles.starterText}>Run automated test suite</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.starterPill}
                onPress={() =>
                  handleStarterPrompt('Query MCP Hub tools and report active catalog connectors')
                }
                activeOpacity={0.7}
              >
                <ShieldAlert size={14} color={colors.accentRose} />
                <Text style={styles.starterText}>Inspect active MCP tools & connectors</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Message Stream */}
        {agentMessages.map((msg: ChatMessage) => {
          const isUser = msg.sender === 'user';
          const isCopied = copiedMsgId === msg.id;

          if (isUser) {
            return (
              <View key={msg.id} style={styles.userMsgWrapper}>
                {/* User Bubble with dynamic Agent Color */}
                <View
                  style={[
                    styles.userBubble,
                    { backgroundColor: agentColor },
                  ]}
                >
                  <Text style={styles.userText}>{msg.content}</Text>
                </View>

                {/* Micro Action Row */}
                <View style={styles.microActionRowUser}>
                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={() => handleCopyMessage(msg.content, msg.id)}
                    activeOpacity={0.7}
                  >
                    <Copy size={11} color={isCopied ? colors.accentEmerald : '#71717A'} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={() => Alert.alert('Reaction', 'Added 👍 reaction')}
                    activeOpacity={0.7}
                  >
                    <Smile size={11} color="#71717A" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={() => sendMessage(activeAgent, `In reply to: "${msg.content}"`)}
                    activeOpacity={0.7}
                  >
                    <Reply size={11} color="#71717A" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={() => Alert.alert('Selected', 'Message selected')}
                    activeOpacity={0.7}
                  >
                    <CheckSquare size={11} color="#71717A" />
                  </TouchableOpacity>

                  {msg.timestamp ? (
                    <Text style={styles.microTimestamp}>{msg.timestamp}</Text>
                  ) : null}
                </View>
              </View>
            );
          }

          // Agent Message
          const isThinking = msg.isThinking || (!msg.content && !msg.actionCard);

          return (
            <View key={msg.id} style={styles.agentMsgWrapper}>
              <View style={styles.agentHeaderRow}>
                <CreatureAvatar
                  shapeIndex={activeAgent.avatarShape ?? 0}
                  color={agentColor}
                  size={20}
                  showGlow={false}
                />
                <Text style={styles.agentNameLabel}>{activeAgent.name}</Text>
              </View>

              {/* Thought Trace if model reasoned */}
              {msg.thoughtTrace ? (
                <ThoughtTrace
                  trace={msg.thoughtTrace}
                />
              ) : null}

              {/* Action Card if triggered */}
              {msg.actionCard ? (
                <ActionCard
                  data={msg.actionCard}
                  onPrimaryPress={() => {}}
                  onSecondaryPress={() => {}}
                />
              ) : null}

              {/* Thinking animation or Message Content */}
              {isThinking ? (
                <ThinkingBubble color={agentColor} />
              ) : (
                <>
                  <View style={styles.agentBubble}>
                    <Text style={styles.agentText}>{sanitizeChatMessage(msg.content)}</Text>
                  </View>

                  {/* Micro Action Row Underneath */}
                  <View style={styles.microActionRowAgent}>
                    <TouchableOpacity
                      style={styles.microActionBtn}
                      onPress={() => handleCopyMessage(msg.content, msg.id)}
                      activeOpacity={0.7}
                    >
                      <Copy size={11} color={isCopied ? colors.accentEmerald : '#71717A'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.microActionBtn}
                      onPress={() => Alert.alert('Reaction', 'Added ❤️ reaction')}
                      activeOpacity={0.7}
                    >
                      <Smile size={11} color="#71717A" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.microActionBtn}
                      onPress={() => sendMessage(activeAgent, `Explain further:`)}
                      activeOpacity={0.7}
                    >
                      <Reply size={11} color="#71717A" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.microActionBtn}
                      onPress={() => Alert.alert('Selected', 'Message selected')}
                      activeOpacity={0.7}
                    >
                      <CheckSquare size={11} color="#71717A" />
                    </TouchableOpacity>

                    {msg.timestamp ? (
                      <Text style={styles.microTimestamp}>{msg.timestamp}</Text>
                    ) : null}
                  </View>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Agent Info & Configuration Modal Sheet */}
      <AgentInfoModal
        visible={showInfoModal}
        agent={activeAgent}
        onClose={() => setShowInfoModal(false)}
      />

      {/* Hermes Sessions History & New Session Modal */}
      <HermesSessionsModal
        visible={showSessionsModal}
        agentId={activeAgent.id}
        agentColor={agentColor}
        onClose={() => setShowSessionsModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0E',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '56%',
  },
  centerNameCol: {
    flexShrink: 1,
    alignItems: 'flex-start',
  },
  centerPillTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  headerSessionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  headerSessionText: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '500',
    maxWidth: 110,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroAvatarBox: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  emptyRole: {
    fontSize: 13,
    color: '#A1A1AA',
    marginBottom: 10,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16161A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 24,
  },
  engineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  engineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4D4D8',
  },
  startersBox: {
    width: '100%',
    gap: 8,
  },
  startersHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  starterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141418',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  starterText: {
    fontSize: 13,
    color: '#E4E4E7',
    fontWeight: '500',
  },
  userMsgWrapper: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 14,
    color: '#09090B',
    fontWeight: '600',
    lineHeight: 20,
  },
  microActionRowUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    paddingRight: 4,
  },
  microActionRowAgent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingLeft: 4,
  },
  microActionBtn: {
    padding: 3,
  },
  microTimestamp: {
    fontSize: 10,
    color: '#52525B',
    marginLeft: 4,
  },
  agentMsgWrapper: {
    alignItems: 'flex-start',
    marginBottom: 16,
    maxWidth: '92%',
  },
  agentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  agentNameLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  agentBubble: {
    backgroundColor: '#18181D',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  agentText: {
    fontSize: 14,
    color: '#E4E4E7',
    lineHeight: 21,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18181D',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  thinkingDotsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  thinkingLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
    letterSpacing: -0.2,
  },
});

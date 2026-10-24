import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { FolderGit2, ChevronDown, Check, Cpu, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useProjectStore } from '../store/useProjectStore';
import { SessionStrip } from '../components/ide/SessionStrip';
import { CodeDiffCard } from '../components/ide/CodeDiffCard';
import { TerminalView } from '../components/ide/TerminalView';
import { ChatMessage } from '../types';

const availableEngines = [
  { id: 'antigravity', label: 'Antigravity CLI · High', desc: 'Deep code reasoning & multi-file patch generation' },
  { id: 'hermes', label: 'Hermes Agent · Fast', desc: 'Local zero-markup model on host daemon' },
  { id: 'claude', label: 'Claude Code · Med', desc: 'Anthropic agent with standard tool loop' },
  { id: 'codex', label: 'Codex CLI · Med', desc: 'OpenAI coding agent' },
];

export const ProjectIDEScreen: React.FC = () => {
  const { activeProject, openDrawer, selectedEngine, setSelectedEngine } = useAppStore();
  const {
    activeSessionId,
    sessionMessages,
    activeDiff,
    applyDiff,
    rejectDiff,
    sendProjectInstruction,
  } = useProjectStore();

  const [showEngineModal, setShowEngineModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const messages: ChatMessage[] = sessionMessages[activeSessionId] || [];

  // Auto scroll to bottom when session messages update
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleStarterPrompt = (prompt: string) => {
    sendProjectInstruction(activeProject, activeSessionId, prompt, selectedEngine);
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Subheader: Project & Engine Switcher */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          style={styles.projectPill}
          onPress={openDrawer}
          activeOpacity={0.7}
        >
          <FolderGit2 size={13} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.projectName}>{activeProject} / main</Text>
          <ChevronDown size={13} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.enginePill}
          onPress={() => setShowEngineModal(true)}
          activeOpacity={0.7}
        >
          <Cpu size={12} color="#60A5FA" />
          <Text style={styles.engineText} numberOfLines={1}>
            {selectedEngine.split('·')[0].trim()}
          </Text>
          <ChevronDown size={12} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      {/* Session Strip */}
      <SessionStrip />

      {/* Main IDE Scroll Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Messages Stream */}
        {messages.length === 0 ? (
          <View style={styles.emptySessionBox}>
            <Sparkles size={20} color={colors.hermesOrange} />
            <Text style={styles.emptySessionTitle}>Workspace Ready</Text>
            <Text style={styles.emptySessionSub}>
              Send an instruction to modify files, run tests, or create PRs on your Azure VM.
            </Text>

            <View style={styles.quickStarters}>
              <TouchableOpacity
                style={styles.starterBtn}
                onPress={() => handleStarterPrompt('Analyze git status and review recent commits')}
                activeOpacity={0.7}
              >
                <Text style={styles.starterBtnText}>Audit recent commits & status</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.starterBtn}
                onPress={() => handleStarterPrompt('Run project test suite and report failures')}
                activeOpacity={0.7}
              >
                <Text style={styles.starterBtnText}>Run test suite</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          messages.map((msg) => {
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
                {msg.content ? (
                  <View style={styles.agentBubble}>
                    <Text style={styles.agentText}>{msg.content}</Text>
                  </View>
                ) : (
                  <View style={styles.generatingBubble}>
                    <View style={styles.generatingDot} />
                    <Text style={styles.generatingText}>
                      {selectedEngine.split('·')[0].trim()} running on VM...
                    </Text>
                  </View>
                )}
                {msg.timestamp ? (
                  <Text style={styles.msgTimeAgent}>{msg.timestamp}</Text>
                ) : null}
              </View>
            );
          })
        )}

        {/* Staged Code Diff Card */}
        {activeDiff ? (
          <CodeDiffCard diff={activeDiff} onAccept={applyDiff} onReject={rejectDiff} />
        ) : (
          <View style={styles.cleanStateCard}>
            <Text style={styles.cleanStateText}>
              ✓ Working tree clean · All patches synced on Azure VM
            </Text>
          </View>
        )}

        {/* Remote Console View */}
        <TerminalView />
      </ScrollView>

      {/* Engine Switcher Modal */}
      <Modal visible={showEngineModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select AI Coding Engine</Text>
            <Text style={styles.modalSubtitle}>
              Executes directly on your Azure VM via Antigravity ACP
            </Text>

            <View style={styles.engineList}>
              {availableEngines.map((eng) => {
                const isActive = selectedEngine.startsWith(eng.label.split('·')[0].trim());
                return (
                  <TouchableOpacity
                    key={eng.id}
                    style={[styles.engineItem, isActive && styles.engineItemActive]}
                    onPress={() => {
                      setSelectedEngine(eng.label);
                      setShowEngineModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.engineItemLeft}>
                      <Text style={[styles.engineItemTitle, isActive && styles.engineItemTitleActive]}>
                        {eng.label}
                      </Text>
                      <Text style={styles.engineItemDesc}>{eng.desc}</Text>
                    </View>
                    {isActive ? <Check size={16} color="#60A5FA" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowEngineModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    gap: 8,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  projectName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enginePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E2530',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  engineText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#60A5FA',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  emptySessionBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  emptySessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  emptySessionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  quickStarters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  starterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bgCardInner,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.borderInner,
  },
  starterBtnText: {
    fontSize: 11.5,
    color: '#93C5FD',
  },
  userRow: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: colors.userBubbleBg,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    marginTop: 2,
    marginRight: 6,
    fontFamily: 'monospace',
  },
  agentRow: {
    alignSelf: 'flex-start',
    maxWidth: '94%',
    gap: 6,
  },
  agentBubble: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  agentText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  msgTimeAgent: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
    marginLeft: 6,
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
    backgroundColor: '#60A5FA',
  },
  generatingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  cleanStateCard: {
    padding: 14,
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    marginVertical: 4,
  },
  cleanStateText: {
    fontSize: 12,
    color: colors.accentEmerald,
    fontFamily: 'monospace',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  engineList: {
    gap: 8,
    marginTop: 4,
  },
  engineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.bgCardInner,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderInner,
  },
  engineItemActive: {
    borderColor: 'rgba(96, 165, 250, 0.4)',
    backgroundColor: '#1E2530',
  },
  engineItemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  engineItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  engineItemTitleActive: {
    color: '#60A5FA',
  },
  engineItemDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    height: 38,
    borderRadius: 9999,
    backgroundColor: colors.btnPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.btnPrimaryText,
  },
});

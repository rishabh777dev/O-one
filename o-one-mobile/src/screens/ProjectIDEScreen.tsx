import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FolderGit2, ChevronDown } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useProjectStore } from '../store/useProjectStore';
import { SessionStrip } from '../components/ide/SessionStrip';
import { CodeDiffCard } from '../components/ide/CodeDiffCard';
import { TerminalView } from '../components/ide/TerminalView';

const engines = [
  'Antigravity CLI · High',
  'Claude Code · Med',
  'Codex CLI · Med',
  'OpenCode · High',
];

export const ProjectIDEScreen: React.FC = () => {
  const { activeProject, openDrawer, selectedEngine, setSelectedEngine } = useAppStore();
  const { activeDiff, applyDiff, rejectDiff } = useProjectStore();

  const handleCycleEngine = () => {
    const currentIdx = engines.indexOf(selectedEngine);
    const nextIdx = (currentIdx + 1) % engines.length;
    setSelectedEngine(engines[nextIdx]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Subheader: Project & Engine Switcher */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.projectPill} onPress={openDrawer} activeOpacity={0.7}>
          <FolderGit2 size={13} color="#FFFFFF" />
          <Text style={styles.projectName}>{activeProject} / main</Text>
          <ChevronDown size={13} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.enginePill}
          onPress={handleCycleEngine}
          activeOpacity={0.7}
        >
          <Text style={styles.engineText}>{selectedEngine}</Text>
        </TouchableOpacity>
      </View>

      {/* Session Strip */}
      <SessionStrip />

      {/* Agent Analysis Message */}
      <View style={styles.agentMsgRow}>
        <View style={styles.agentBubble}>
          <Text style={styles.agentText}>
            I analyzed `src/auth/jwt.ts` on your Azure VM. Added a 30-second clock tolerance window
            so concurrent mobile token refreshes don't drop sessions:
          </Text>
        </View>
      </View>

      {/* Staged Code Diff Card */}
      {activeDiff ? (
        <CodeDiffCard diff={activeDiff} onAccept={applyDiff} onReject={rejectDiff} />
      ) : (
        <View style={styles.cleanStateCard}>
          <Text style={styles.cleanStateText}>
            ✓ Working tree clean. All patches applied on Azure VM workspace.
          </Text>
        </View>
      )}

      {/* Remote Console View */}
      <TerminalView />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  content: {
    paddingBottom: 24,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    backgroundColor: '#242429',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  engineText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#60A5FA',
  },
  agentMsgRow: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  agentBubble: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 22,
    padding: 14,
  },
  agentText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  cleanStateCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  cleanStateText: {
    fontSize: 12.5,
    color: colors.accentEmerald,
    fontFamily: 'monospace',
  },
});

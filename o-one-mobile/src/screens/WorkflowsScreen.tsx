import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Play, Plus, X, CheckCircle2, Clock } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { WorkflowItem, WorkflowStep } from '../types';

const defaultWorkflows: WorkflowItem[] = [
  {
    id: 'wf-1',
    title: 'Autonomous Bug Triage & Auto-PR',
    badge: 'Active · Webhook',
    steps: [
      { id: 's1', title: '1. Trigger: Sentry Alert', agentOrTool: 'HTTP Webhook', type: 'trigger' },
      { id: 's2', title: '2. Support Agent: Trace Analysis', agentOrTool: 'Hermes 3', type: 'analysis' },
      { id: 's3', title: '3. Antigravity CLI: Fix & Test', agentOrTool: 'Azure VM', type: 'code' },
      { id: 's4', title: '4. Mobile Push: Approval Gate', agentOrTool: 'Human Gate', type: 'gate' },
    ],
  },
  {
    id: 'wf-2',
    title: 'Daily Cloud Infrastructure Audit',
    badge: '08:00 UTC · Scheduled',
    steps: [
      { id: 's5', title: '1. DevOps Sentinel: VM Health & Tailscale', agentOrTool: 'Azure Monitor', type: 'analysis' },
      { id: 's6', title: '2. Hermes: Generate Morning Briefing', agentOrTool: 'Telegram / Push', type: 'gate' },
    ],
  },
];

export const WorkflowsScreen: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(defaultWorkflows);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleRunWorkflow = (id: string) => {
    setRunningId(id);
    setTimeout(() => {
      setRunningId(null);
    }, 2500);
  };

  const handleCreateWorkflow = () => {
    if (!newTitle.trim()) return;
    const newWf: WorkflowItem = {
      id: `wf-${Date.now()}`,
      title: newTitle.trim(),
      badge: 'Active · On-Demand',
      steps: [
        { id: `s-${Date.now()}-1`, title: '1. Trigger: Manual dispatch', agentOrTool: 'Mobile Push', type: 'trigger' },
        { id: `s-${Date.now()}-2`, title: '2. Hermes: Task analysis', agentOrTool: 'Hermes 3', type: 'analysis' },
        { id: `s-${Date.now()}-3`, title: '3. Antigravity CLI: Workspace execution', agentOrTool: 'Azure VM', type: 'code' },
      ],
    };
    setWorkflows([newWf, ...workflows]);
    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Visual Workflows & Pipelines</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Plus size={13} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.addBtnText}>New Pipeline</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {workflows.map((wf) => {
          const isRunning = runningId === wf.id;
          return (
            <View key={wf.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardTitle}>{wf.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{wf.badge}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.runBtn, isRunning && styles.runBtnRunning]}
                  onPress={() => handleRunWorkflow(wf.id)}
                  activeOpacity={0.8}
                  disabled={isRunning}
                >
                  <Play size={12} color={isRunning ? '#000000' : '#FFFFFF'} fill={isRunning ? '#000000' : 'none'} />
                  <Text style={[styles.runBtnText, isRunning && styles.runBtnTextRunning]}>
                    {isRunning ? 'Running...' : 'Run'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.stepsContainer}>
                {wf.steps.map((step: WorkflowStep) => (
                  <View key={step.id} style={styles.stepItem}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text
                      style={[
                        styles.stepTool,
                        step.type === 'gate' && { color: colors.accentEmerald },
                      ]}
                    >
                      {step.agentOrTool}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Workflow Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Autonomous Pipeline</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Chains triggers, Hermes reasoning, Antigravity CLI, and mobile gates
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Pipeline Name (e.g. Sentry Crash Fixer)"
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalPrimary}
                onPress={handleCreateWorkflow}
                activeOpacity={0.8}
              >
                <Text style={styles.btnModalPrimaryText}>Create Pipeline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  topBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#27272D',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  runBtnRunning: {
    backgroundColor: '#FFFFFF',
  },
  runBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  runBtnTextRunning: {
    color: '#000000',
  },
  stepsContainer: {
    gap: 7,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCardInner,
    borderWidth: 1,
    borderColor: colors.borderInner,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stepTitle: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  stepTool: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
  },
  modalInput: {
    height: 40,
    backgroundColor: colors.bgCardInner,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInner,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnModalPrimary: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    backgroundColor: colors.btnPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnModalPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.btnPrimaryText,
  },
  btnModalCancel: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    backgroundColor: colors.bgCardInner,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnModalCancelText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

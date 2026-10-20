import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { WorkflowItem, WorkflowStep } from '../types';

const defaultWorkflows: WorkflowItem[] = [
  {
    id: 'wf-1',
    title: 'Autonomous Bug Triage & Auto-PR',
    badge: 'Active · Webhook',
    steps: [
      { id: 's1', title: '1. Trigger: Sentry Alert', agentOrTool: 'HTTP', type: 'trigger' },
      { id: 's2', title: '2. Support Agent: Trace Analysis', agentOrTool: 'Hermes', type: 'analysis' },
      { id: 's3', title: '3. Antigravity CLI: Fix & Test', agentOrTool: 'Azure VM', type: 'code' },
      { id: 's4', title: '4. Mobile Push: Approval Gate', agentOrTool: 'Gate', type: 'gate' },
    ],
  },
  {
    id: 'wf-2',
    title: 'Daily Cloud Infrastructure Check',
    badge: '08:00 UTC · Daily',
    steps: [
      { id: 's5', title: '1. DevOps Sentinel: VM Health', agentOrTool: 'Tailscale', type: 'analysis' },
      { id: 's6', title: '2. Hermes: Generate Morning Brief', agentOrTool: 'Summary', type: 'gate' },
    ],
  },
];

export const WorkflowsScreen: React.FC = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {defaultWorkflows.map((wf: WorkflowItem) => (
        <View key={wf.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{wf.title}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wf.badge}</Text>
            </View>
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
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
  },
  stepsContainer: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCardInner,
    borderWidth: 1,
    borderColor: colors.borderInner,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stepTitle: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  stepTool: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
});

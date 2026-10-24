import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Cpu, Zap, Brain, ChevronDown, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { Agent } from '../../types';
import { rpcClient } from '../../services/rpcClient';

interface ModelSettingsModalProps {
  visible: boolean;
  agent?: Agent | null;
  onClose: () => void;
  onSave: (model: string, reasoning: 'High' | 'Med' | 'Low', engineLabel: string) => void;
}

export function formatProviderName(raw: string): string {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('openai') || lower.includes('chatgpt') || lower.includes('codex')) {
    return 'OpenAI';
  }
  if (lower.includes('antigravity')) {
    return 'Antigravity';
  }
  if (lower.includes('grok') || lower.includes('xai')) {
    return 'xAI Grok';
  }
  if (lower.includes('gemini') || lower.includes('google')) {
    return 'Google Gemini';
  }
  if (lower.includes('claude') || lower.includes('anthropic')) {
    return 'Anthropic Claude';
  }
  if (lower.includes('deepseek')) {
    return 'DeepSeek';
  }
  if (lower.includes('mistral')) {
    return 'Mistral AI';
  }
  if (lower.includes('groq')) {
    return 'Groq LPUs';
  }
  if (lower.includes('nvidia')) {
    return 'NVIDIA NIM';
  }
  return raw;
}

const PROVIDER_MODELS: {
  provider: string;
  engine: string;
  isCurrent?: boolean;
  models: { id: string; name: string; desc: string }[];
}[] = [
  {
    provider: 'OpenAI',
    engine: 'hermes',
    isCurrent: true,
    models: [
      {
        id: 'gpt-5.6-luna',
        name: 'GPT-5.6 Luna (Active Codex)',
        desc: 'Hermes agent running via ChatGPT / Codex Subscription',
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o (Codex)',
        desc: 'Fast multimodal code and tool reasoning',
      },
      {
        id: 'gpt-6-luna',
        name: 'GPT-6 Luna',
        desc: 'Frontier reasoning model with extended context',
      },
    ],
  },
  {
    provider: 'Antigravity',
    engine: 'antigravity',
    isCurrent: false,
    models: [
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro (Antigravity)',
        desc: 'Autonomous multi-file editing, git branches & planning',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        desc: 'Sub-second tool latency and instant patches',
      },
    ],
  },
  {
    provider: 'DeepSeek',
    engine: 'deepseek',
    isCurrent: false,
    models: [
      {
        id: 'deepseek-ai/DeepSeek-V3',
        name: 'DeepSeek-V3',
        desc: '671B MoE architecture with exceptional code ability',
      },
      {
        id: 'deepseek-ai/DeepSeek-R1',
        name: 'DeepSeek-R1 (Reasoning)',
        desc: 'Chain-of-thought mathematical and algorithmic synthesis',
      },
    ],
  },
  {
    provider: 'Anthropic Claude',
    engine: 'claude',
    isCurrent: false,
    models: [
      {
        id: 'claude-3-7-sonnet',
        name: 'Claude 3.7 Sonnet',
        desc: 'Hybrid reasoning and deep codebase exploration',
      },
    ],
  },
];

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  visible,
  agent,
  onClose,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [providerGroups, setProviderGroups] = useState(PROVIDER_MODELS);
  const [selectedModel, setSelectedModel] = useState(agent?.model || 'gpt-5.6-luna');
  const [reasoningLevel, setReasoningLevel] = useState<'High' | 'Med' | 'Low'>(
    agent?.reasoningLevel || 'High'
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (providerKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [providerKey]: !prev[providerKey],
    }));
  };

  useEffect(() => {
    if (agent) {
      if (agent.model) setSelectedModel(agent.model);
      if (agent.reasoningLevel) setReasoningLevel(agent.reasoningLevel);
    }
  }, [agent]);

  useEffect(() => {
    if (visible) {
      rpcClient.send('models.list', {}, (res) => {
        if (res.result && Array.isArray(res.result) && res.result.length > 0) {
          // Normalize names and prioritize OpenAI & Antigravity at the top
          const list = res.result.map((g: any) => ({
            ...g,
            cleanProvider: formatProviderName(g.provider),
          }));

          list.sort((a: any, b: any) => {
            const getRank = (item: any) => {
              if (item.cleanProvider === 'OpenAI') return 0;
              if (item.cleanProvider === 'Antigravity') return 1;
              if (item.isCurrent) return 2;
              return 3;
            };
            return getRank(a) - getRank(b);
          });

          setProviderGroups(list);

          // By default, expand OpenAI, Antigravity, and any provider with selectedModel.
          // Other secondary providers start collapsed to keep UI clean.
          const initialCollapsed: Record<string, boolean> = {};
          list.forEach((g: any) => {
            const hasSelected = g.models?.some((m: any) => m.id === selectedModel);
            const isPriority =
              g.cleanProvider === 'OpenAI' ||
              g.cleanProvider === 'Antigravity' ||
              hasSelected ||
              g.isCurrent;
            initialCollapsed[g.provider] = !isPriority;
          });
          setCollapsedGroups(initialCollapsed);
        }
      });
    }
  }, [visible, selectedModel]);

  const handleSave = () => {
    // Determine provider label dynamically
    let label = 'Hermes Agent';
    for (const group of providerGroups) {
      if (group.models.some((m) => m.id === selectedModel)) {
        label = formatProviderName(group.provider);
        break;
      }
    }
    onSave(selectedModel, reasoningLevel, label);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Model Settings</Text>
          <TouchableOpacity
            style={[styles.circleBtn, styles.checkBtn]}
            onPress={handleSave}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Check size={18} color="#09090B" strokeWidth={2.6} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Reasoning Effort Selector */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Brain size={15} color={colors.hermesOrange} />
              <Text style={styles.sectionTitle}>REASONING EFFORT</Text>
            </View>
            <View style={styles.reasoningRow}>
              {(['High', 'Med', 'Low'] as const).map((level) => {
                const isSelected = reasoningLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[styles.reasoningBtn, isSelected && styles.reasoningBtnSelected]}
                    onPress={() => setReasoningLevel(level)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.reasoningBtnText,
                        isSelected && styles.reasoningBtnTextSelected,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Model Catalog by Provider */}
          {providerGroups.map((group) => {
            const displayTitle = formatProviderName(group.provider);
            const isCollapsed = !!collapsedGroups[group.provider];
            const hasSelected = group.models.some((m) => m.id === selectedModel);

            return (
              <View key={group.provider} style={styles.section}>
                {/* Collapsible Provider Header Row */}
                <TouchableOpacity
                  style={styles.groupHeaderRow}
                  onPress={() => toggleGroup(group.provider)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={styles.groupHeaderLeft}>
                    <Text style={styles.groupHeader}>{displayTitle.toUpperCase()}</Text>
                    {isCollapsed ? (
                      <ChevronRight size={14} color="#71717A" strokeWidth={2.4} />
                    ) : (
                      <ChevronDown size={14} color="#A1A1AA" strokeWidth={2.4} />
                    )}
                    {group.isCurrent && (
                      <View style={styles.activePill}>
                        <Text style={styles.activePillText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>

                  {isCollapsed && hasSelected && (
                    <View style={styles.selectedIndicatorPill}>
                      <Check size={11} color="#38BDF8" strokeWidth={2.8} />
                      <Text style={styles.selectedIndicatorText}>Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Models in Group (Rendered when expanded) */}
                {!isCollapsed && (
                  <View style={styles.groupCard}>
                    {group.models.map((m, idx) => {
                      const isSelected = selectedModel === m.id;
                      const isLast = idx === group.models.length - 1;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.modelRow, !isLast && styles.modelRowBorder]}
                          onPress={() => setSelectedModel(m.id)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[styles.modelName, isSelected && styles.modelNameSelected]}
                            >
                              {m.name}
                            </Text>
                            <Text style={styles.modelDesc}>{m.desc}</Text>
                          </View>
                          {isSelected && (
                            <View style={styles.checkIconBox}>
                              <Check size={16} color={colors.accentEmerald} strokeWidth={2.4} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D10',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtn: {
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.8,
  },
  reasoningRow: {
    flexDirection: 'row',
    backgroundColor: '#16161A',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  reasoningBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  reasoningBtnSelected: {
    backgroundColor: '#27272E',
  },
  reasoningBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  reasoningBtnTextSelected: {
    color: '#FFFFFF',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E4E4E7',
    letterSpacing: 0.8,
  },
  activePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  selectedIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38BDF8',
  },
  groupCard: {
    backgroundColor: '#16161A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  modelRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E4E4E7',
    marginBottom: 2,
  },
  modelNameSelected: {
    color: '#FFFFFF',
  },
  modelDesc: {
    fontSize: 12,
    color: '#71717A',
    lineHeight: 16,
  },
  checkIconBox: {
    marginLeft: 10,
  },
});

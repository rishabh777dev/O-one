import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Shuffle, Sparkles, Cpu, Layers } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { CreatureAvatar, CREATURE_COLORS } from './CreatureAvatar';
import { useAppStore } from '../../store/useAppStore';
import { Agent, AgentEngine } from '../../types';
import { rpcClient } from '../../services/rpcClient';

const { width } = Dimensions.get('window');

const COLOR_PALETTE = [
  '#2563EB', // Blue (Steve)
  '#EA580C', // Orange (Roger)
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

const ENGINE_OPTIONS: { id: AgentEngine; label: string; model: string; badge: string }[] = [
  {
    id: 'hermes',
    label: 'Nous Hermes 3 (Codex / Local)',
    model: 'gpt-5.6-luna',
    badge: 'Codex / Local',
  },
  {
    id: 'antigravity',
    label: 'Antigravity CLI ACP',
    model: 'gemini-2.5-pro',
    badge: 'Autonomous Multi-file',
  },
  {
    id: 'claude',
    label: 'Claude Code',
    model: 'claude-3-7-sonnet',
    badge: 'Cloud Reasoner',
  },
  {
    id: 'codex',
    label: 'OpenAI Codex',
    model: 'gpt-5.6-luna',
    badge: 'High Reasoning',
  },
];

interface CreateAgentModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { addAgent } = useAppStore();

  const [shapeIndex, setShapeIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [instructions, setInstructions] = useState(
    'You are an autonomous AI software engineer. Analyze code, run terminal commands, execute git diffs, and write clean production code.'
  );
  const [engineOptions, setEngineOptions] = useState(ENGINE_OPTIONS);
  const [selectedEngine, setSelectedEngine] = useState<AgentEngine>('hermes');
  const [selectedModel, setSelectedModel] = useState('gpt-5.6-luna');

  // Dynamically load real host models on open
  useEffect(() => {
    if (visible) {
      rpcClient.send('models.list', {}, (res) => {
        if (res.result && Array.isArray(res.result) && res.result.length > 0) {
          const dynamicOptions = res.result.map((group: any) => {
            const firstModel = group.models?.[0]?.id || 'gpt-5.6-luna';
            let badge = 'Active Host';
            if (group.engine === 'hermes') badge = 'Codex / Local';
            else if (group.engine === 'antigravity') badge = 'Autonomous Multi-file';
            else if (group.engine === 'claude') badge = 'Cloud Reasoner';
            else if (group.engine === 'deepseek') badge = 'DeepSeek MoE';

            return {
              id: (group.engine as AgentEngine) || 'hermes',
              label: group.provider,
              model: firstModel,
              badge,
            };
          });
          setEngineOptions(dynamicOptions);
          if (dynamicOptions.length > 0) {
            setSelectedEngine(dynamicOptions[0].id);
            setSelectedModel(dynamicOptions[0].model);
          }
        }
      });
    }
  }, [visible]);

  // Randomize creature shape and color
  const handleShuffle = () => {
    const nextShape = Math.floor(Math.random() * 12);
    const nextColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    setShapeIndex(nextShape);
    setSelectedColor(nextColor);
  };

  const handleCreate = () => {
    const finalName = name.trim() || `Agent-${Math.floor(100 + Math.random() * 900)}`;
    const finalRole = role.trim() || 'Software Engineer';
    const engineCfg = engineOptions.find((e) => e.id === selectedEngine) || engineOptions[0];

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: finalName,
      role: finalRole,
      systemPrompt: instructions.trim(),
      instructions: instructions.trim(),
      engine: selectedEngine,
      engineLabel: engineCfg?.label || 'Nous Hermes 3',
      model: selectedModel || engineCfg?.model || 'gpt-5.6-luna',
      workspacePath: 'D:\\project\\O one',
      status: 'ready',
      capabilities: ['Terminal', 'Code Diff', 'MCP Tools'],
      mcpServers: [],
      createdAt: new Date().toISOString(),
      avatarShape: shapeIndex,
      avatarColor: selectedColor,
      reasoningLevel: 'High',
      notifications: true,
    };

    addAgent(newAgent);
    onClose();
    // Reset state
    setName('');
    setRole('');
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
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Agent</Text>

          <TouchableOpacity
            style={[styles.circleBtn, styles.checkBtn]}
            onPress={handleCreate}
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Avatar with Radial Glow */}
          <View style={styles.heroSection}>
            <View style={styles.avatarWrapper}>
              <CreatureAvatar
                shapeIndex={shapeIndex}
                color={selectedColor}
                size={96}
                showGlow={true}
              />
            </View>

            {/* Shuffle Button */}
            <TouchableOpacity
              style={styles.shuffleBtn}
              onPress={handleShuffle}
              activeOpacity={0.75}
            >
              <Shuffle size={14} color="#FFFFFF" />
              <Text style={styles.shuffleText}>Shuffle</Text>
            </TouchableOpacity>
          </View>

          {/* 12 Creature Shapes Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CREATURE SHAPE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shapesRow}
            >
              {Array.from({ length: 12 }).map((_, idx) => {
                const isSelected = shapeIndex === idx;
                return (
                  <TouchableOpacity
                    key={`shape-${idx}`}
                    style={[styles.shapeItem, isSelected && styles.shapeItemSelected]}
                    onPress={() => setShapeIndex(idx)}
                    activeOpacity={0.7}
                  >
                    <CreatureAvatar
                      shapeIndex={idx}
                      color={isSelected ? selectedColor : '#71717A'}
                      size={36}
                      showGlow={false}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Color Palette */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COLOR PALETTE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorsRow}
            >
              {COLOR_PALETTE.map((colorHex) => {
                const isSelected = selectedColor === colorHex;
                return (
                  <TouchableOpacity
                    key={colorHex}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: colorHex },
                      isSelected && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setSelectedColor(colorHex)}
                    activeOpacity={0.8}
                  >
                    {isSelected && <View style={styles.colorCheckDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Identity & Instructions Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>What should this agent help with?</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Steve, Nova, Lead Architect"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Title / Role</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Full-Stack Engineer, Bug Triager"
                placeholderTextColor={colors.textMuted}
                value={role}
                onChangeText={setRole}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe instructions, behavioral tone, workflows..."
                placeholderTextColor={colors.textMuted}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Engine & Model Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Engine & Provider</Text>
              <View style={styles.engineGrid}>
                {engineOptions.map((eng) => {
                  const isSelected = selectedEngine === eng.id;
                  return (
                    <TouchableOpacity
                      key={`${eng.id}-${eng.model}`}
                      style={[styles.engineCard, isSelected && styles.engineCardSelected]}
                      onPress={() => {
                        setSelectedEngine(eng.id);
                        setSelectedModel(eng.model);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.engineHeaderRow}>
                        <Text
                          style={[styles.engineTitle, isSelected && styles.engineTitleSelected]}
                        >
                          {eng.label}
                        </Text>
                        <Text style={styles.engineBadge}>{eng.badge}</Text>
                      </View>
                      <Text style={styles.engineModelText}>{eng.model}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
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
    letterSpacing: -0.3,
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
    padding: 18,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 18,
  },
  avatarWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C20',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shuffleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  shapesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  shapeItem: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  shapeItemSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#27272A',
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  colorCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  card: {
    backgroundColor: '#16161A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginTop: 4,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E1E24',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  engineGrid: {
    gap: 8,
  },
  engineCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  engineCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#272730',
  },
  engineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  engineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E4E4E7',
  },
  engineTitleSelected: {
    color: '#FFFFFF',
  },
  engineBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.hermesOrange,
  },
  engineModelText: {
    fontSize: 11,
    color: '#71717A',
    fontFamily: 'monospace',
  },
});

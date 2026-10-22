import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { CreatureAvatar } from './CreatureAvatar';
import { ModelSettingsModal } from './ModelSettingsModal';
import { useAppStore } from '../../store/useAppStore';
import { Agent } from '../../types';

interface AgentInfoModalProps {
  visible: boolean;
  agent?: Agent | null;
  onClose: () => void;
}

export const AgentInfoModal: React.FC<AgentInfoModalProps> = ({
  visible,
  agent,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { updateAgent, deleteAgent, setSurface } = useAppStore();

  const [name, setName] = useState(agent?.name || '');
  const [role, setRole] = useState(agent?.role || '');
  const [instructions, setInstructions] = useState(
    agent?.instructions || agent?.systemPrompt || ''
  );
  const [shapeIndex, setShapeIndex] = useState(agent?.avatarShape ?? 0);
  const [avatarColor, setAvatarColor] = useState(agent?.avatarColor ?? '#2563EB');
  const [isFocusedInstructions, setIsFocusedInstructions] = useState(false);

  // Sub-modals matching dense_015, dense_025, dense_030
  const [showModelModal, setShowModelModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  // Permissions state (matching dense_025)
  const [autoApprove, setAutoApprove] = useState(true);
  const [computerUse, setComputerUse] = useState(true);
  const [localScripts, setLocalScripts] = useState(false);

  // Usage tab filter (matching dense_030)
  const [usagePeriod, setUsagePeriod] = useState<'7' | '30' | '90' | 'year' | 'custom'>('30');

  useEffect(() => {
    if (agent) {
      setName(agent.name || '');
      setRole(agent.role || '');
      setInstructions(agent.instructions || agent.systemPrompt || '');
      setShapeIndex(agent.avatarShape ?? 0);
      setAvatarColor(agent.avatarColor ?? '#2563EB');
    }
  }, [agent, visible]);

  if (!agent) return null;

  const handleSave = () => {
    const updated: Agent = {
      ...agent,
      name: name.trim() || agent.name,
      role: role.trim() || agent.role,
      systemPrompt: instructions.trim(),
      instructions: instructions.trim(),
      avatarShape: shapeIndex,
      avatarColor: avatarColor,
    };
    updateAgent(updated);
    onClose();
  };

  const handleCycleShape = () => {
    setShapeIndex((prev) => (prev + 1) % 12);
  };

  const handleModelSaved = (model: string, reasoning: 'High' | 'Med' | 'Low', engineLabel: string) => {
    const updated: Agent = {
      ...agent,
      model,
      reasoningLevel: reasoning,
      engineLabel,
    };
    updateAgent(updated);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Agent',
      `Are you sure you want to delete "${agent.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAgent(agent.id);
            onClose();
          },
        },
      ]
    );
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
        {/* Header (Matching dense_015 & dense_020) */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Info</Text>

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={handleSave}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Check size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Avatar with Circular Pencil Badge (Matching dense_015) */}
          <View style={styles.heroSection}>
            <TouchableOpacity
              style={styles.avatarTouchBox}
              onPress={handleCycleShape}
              activeOpacity={0.85}
            >
              <CreatureAvatar
                shapeIndex={shapeIndex}
                color={avatarColor}
                size={96}
                showGlow={false}
              />
              <View style={styles.pencilBadge}>
                <Pencil size={15} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Field: Name (Matching dense_015) */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.cardInputBox}>
              <TextInput
                style={styles.cardTextInput}
                value={name}
                onChangeText={setName}
                placeholder="Agent Name"
                placeholderTextColor="#71717A"
              />
            </View>
          </View>

          {/* Field: Title (Matching dense_015) */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Title</Text>
            <View style={styles.cardInputBox}>
              <TextInput
                style={styles.cardTextInput}
                value={role}
                onChangeText={setRole}
                placeholder="The Captain"
                placeholderTextColor="#71717A"
              />
            </View>
          </View>

          {/* Field: Instructions (Matching dense_015) */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Instructions</Text>
            <View
              style={[
                styles.cardInputBox,
                styles.cardTextAreaBox,
                isFocusedInstructions && styles.cardInputFocused,
              ]}
            >
              <TextInput
                style={styles.cardTextAreaInput}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="General-purpose assistant..."
                placeholderTextColor="#71717A"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={() => setIsFocusedInstructions(true)}
                onBlur={() => setIsFocusedInstructions(false)}
              />
            </View>
          </View>

          {/* Section: Brain (Matching dense_020) */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Brain</Text>
            <TouchableOpacity
              style={styles.cardRow}
              onPress={() => setShowModelModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.cardRowTextCol}>
                <Text style={styles.cardRowTitle}>Model</Text>
                <Text style={styles.cardRowSubtitle}>{agent.model || 'gpt-5.6-luna'}</Text>
              </View>
              <ChevronRight size={18} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Section: Knows (Matching dense_020) */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Knows</Text>
            <TouchableOpacity
              style={styles.cardRow}
              onPress={() => Alert.alert('Memories', 'Vector memory and learned patterns on host.')}
              activeOpacity={0.7}
            >
              <Text style={styles.cardRowTitle}>Memories</Text>
              <ChevronRight size={18} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Section: Permissions (Matching dense_025) */}
          <View style={styles.fieldSection}>
            <TouchableOpacity
              style={styles.cardRow}
              onPress={() => setShowPermissionsModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardRowTitle}>Permissions</Text>
              <ChevronRight size={18} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Section: Usage (Matching dense_030) */}
          <View style={styles.fieldSection}>
            <TouchableOpacity
              style={styles.cardRow}
              onPress={() => setShowUsageModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardRowTitle}>Usage</Text>
              <ChevronRight size={18} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteCard}
            onPress={handleDelete}
            activeOpacity={0.75}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.deleteText}>Delete Agent</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 1. Model Settings Modal */}
        <ModelSettingsModal
          visible={showModelModal}
          agent={agent}
          onClose={() => setShowModelModal(false)}
          onSave={handleModelSaved}
        />

        {/* 2. Permissions Sub-Modal (Matching dense_025) */}
        <Modal
          visible={showPermissionsModal}
          animationType="slide"
          onRequestClose={() => setShowPermissionsModal(false)}
        >
          <View
            style={[
              styles.container,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.iconCircleBtn}
                onPress={() => setShowPermissionsModal(false)}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Permissions</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.sectionHeading}>Access</Text>

              {/* Group 1 */}
              <View style={styles.permissionCard}>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionTitle}>Agent access</Text>
                  <View style={styles.accessDropdownPill}>
                    <Text style={styles.accessDropdownText}>Full access</Text>
                    <ChevronDown size={14} color="#9CA3AF" />
                  </View>
                </View>

                <View style={styles.permissionDivider} />

                <View style={styles.permissionRow}>
                  <Text style={styles.permissionTitle}>Auto approve</Text>
                  <Switch
                    value={autoApprove}
                    onValueChange={setAutoApprove}
                    trackColor={{ false: '#27272A', true: '#38BDF8' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
              <Text style={styles.permissionFootnote}>
                The host answers this agent's approvals by itself.
              </Text>

              {/* Group 2 */}
              <View style={[styles.permissionCard, { marginTop: 16 }]}>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionTitle}>Computer Use</Text>
                  <Switch
                    value={computerUse}
                    onValueChange={setComputerUse}
                    trackColor={{ false: '#27272A', true: '#38BDF8' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
              <Text style={styles.permissionFootnote}>
                Let this agent control apps on the host computer.
              </Text>

              {/* Group 3 */}
              <View style={[styles.permissionCard, { marginTop: 16 }]}>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionTitle}>Local scripts</Text>
                  <Switch
                    value={localScripts}
                    onValueChange={setLocalScripts}
                    trackColor={{ false: '#27272A', true: '#38BDF8' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
              <Text style={styles.permissionFootnote}>
                Let scripts on the host send messages, run routines, answer questions, and accept or decline approvals
              </Text>
            </ScrollView>
          </View>
        </Modal>

        {/* 3. Usage Sub-Modal (Matching dense_030) */}
        <Modal
          visible={showUsageModal}
          animationType="slide"
          onRequestClose={() => setShowUsageModal(false)}
        >
          <View
            style={[
              styles.container,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.iconCircleBtn}
                onPress={() => setShowUsageModal(false)}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Usage</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {/* Period Tabs Filter (Matching dense_030) */}
              <View style={styles.periodTabsRow}>
                {(['7', '30', '90', 'year', 'custom'] as const).map((tab) => {
                  const isActive = usagePeriod === tab;
                  const label =
                    tab === '7'
                      ? '7 days'
                      : tab === '30'
                      ? '30 days'
                      : tab === '90'
                      ? '90 days'
                      : tab === 'year'
                      ? '1 year'
                      : 'Custom';

                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.periodTab, isActive && styles.periodTabActive]}
                      onPress={() => setUsagePeriod(tab)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.periodTabText,
                          isActive && styles.periodTabTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionHeading}>Usage</Text>

              <View style={styles.usageCard}>
                <Text style={styles.usageLoadingText}>Loading usage...</Text>
              </View>
            </ScrollView>
          </View>
        </Modal>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarTouchBox: {
    width: 96,
    height: 96,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#0D0D10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  cardInputBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cardTextAreaBox: {
    height: 96,
    paddingVertical: 12,
  },
  cardInputFocused: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  cardTextInput: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 0,
  },
  cardTextAreaInput: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    paddingVertical: 0,
  },
  cardRow: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRowTextCol: {
    flex: 1,
  },
  cardRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardRowSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  deleteCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  sectionHeading: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 12,
    marginBottom: 8,
  },
  permissionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  permissionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accessDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accessDropdownText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  permissionFootnote: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  periodTabsRow: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  periodTabActive: {
    backgroundColor: '#2C2C2E',
  },
  periodTabText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  usageCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  usageLoadingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Mic, ArrowUp, Terminal, FileCode, CheckCircle2, Trash2, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { useAgentStore } from '../../store/useAgentStore';
import { useProjectStore } from '../../store/useProjectStore';

export const InputBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  const { currentSurface, activeAgent, activeProject, selectedEngine } = useAppStore();
  const { sendMessage } = useAgentStore();
  const { sendProjectInstruction, activeSessionId } = useProjectStore();

  let placeholder = activeAgent ? `Ask ${activeAgent.name}` : 'Ask agent...';
  if (currentSurface === 'ide') {
    placeholder = `Instruct Antigravity on ${activeProject}...`;
  } else if (currentSurface === 'workflows') {
    placeholder = 'Trigger or configure workflow...';
  } else if (currentSurface === 'marketplace') {
    placeholder = 'Search MCP tools & connectors...';
  }

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    if (currentSurface === 'ide') {
      sendProjectInstruction(activeProject, activeSessionId, text, selectedEngine);
    } else if (activeAgent) {
      sendMessage(activeAgent, text);
    }

    setInputText('');
  };

  const handleQuickAction = (actionText: string) => {
    setShowQuickActions(false);
    if (currentSurface === 'ide') {
      sendProjectInstruction(activeProject, activeSessionId, actionText, selectedEngine);
    } else if (activeAgent) {
      sendMessage(activeAgent, actionText);
    }
  };

  const hasContent = inputText.trim().length > 0;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
      {/* Unified Capsule Pill matching dense_010 */}
      <View style={styles.inputCapsule}>
        {/* Plus Action Button inside Capsule */}
        <TouchableOpacity
          style={styles.plusBtn}
          onPress={() => setShowQuickActions(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Quick Actions"
        >
          <Plus size={20} color="#9CA3AF" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* Input Pill Field */}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#71717A"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
        />

        {/* Dynamic Send / Mic Action Button */}
        {hasContent ? (
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            activeOpacity={0.8}
            accessibilityLabel="Send message"
          >
            <ArrowUp size={16} color="#000000" strokeWidth={2.6} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micBtn}
            onPress={() => Alert.alert('Hermes Voice', 'Listening for voice prompt...')}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Voice Input"
          >
            <Mic size={20} color="#9CA3AF" strokeWidth={2.2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Action Modal */}
      <Modal visible={showQuickActions} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Actions & Tools</Text>
              <TouchableOpacity
                onPress={() => setShowQuickActions(false)}
                style={styles.modalCloseBtn}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleQuickAction('Run test suite on Azure VM and check for regressions')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <CheckCircle2 size={16} color={colors.accentEmerald} />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionTitle}>Run Test Suite</Text>
                <Text style={styles.actionSub}>Execute test runner on VM workspace</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleQuickAction('Review recent git diff and generate PR summary')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <FileCode size={16} color="#60A5FA" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionTitle}>Audit Git Diff</Text>
                <Text style={styles.actionSub}>Inspect unstaged changes and patch safety</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleQuickAction('Diagnose host system: memory, CPU, and disk usage')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                <Terminal size={16} color={colors.hermesOrange} />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionTitle}>Host Health Check</Text>
                <Text style={styles.actionSub}>Query CPU load, RAM usage, and active PIDs</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#0C0C0E',
    zIndex: 30,
  },
  inputCapsule: {
    height: 52,
    backgroundColor: '#1C1C1E',
    borderRadius: 26,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plusBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCircleBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.bgCardInner,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderInner,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextBox: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Mic,
  ArrowUp,
  Terminal,
  FileCode,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  Command,
  AtSign,
  Gauge,
  Cpu,
  BookOpen,
  FolderGit2,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { useAgentStore } from '../../store/useAgentStore';
import { useProjectStore } from '../../store/useProjectStore';
import { rpcClient } from '../../services/rpcClient';

interface SlashItem {
  command: string;
  name: string;
  desc: string;
}

interface DirectiveItem {
  directive: string;
  name: string;
  desc: string;
}

const DEFAULT_SLASH_COMMANDS: SlashItem[] = [
  { command: '/review', name: 'Audit & Review', desc: 'Audit unstaged git diff and verify code quality' },
  { command: '/refine', name: 'Refine Memory', desc: 'Refine skills and persistent background memories' },
  { command: '/context', name: 'Context Breakdown', desc: 'Inspect live token usage and context window gauge' },
  { command: '/tools', name: 'Tools & MCP', desc: 'List active tools, MCP capabilities, and integrations' },
  { command: '/help', name: 'Help & Commands', desc: 'Show all available Hermes Agent commands' },
  { command: '/density', name: 'Display Density', desc: 'Toggle compact cockpit display mode' },
  { command: '/details', name: 'Detail Visibility', desc: 'Toggle agent reasoning and thought details' },
  { command: '/logs', name: 'Agent Logs', desc: 'Stream recent activity and execution logs' },
];

const DEFAULT_DIRECTIVES: DirectiveItem[] = [
  { directive: '@diff', name: 'Git Diff', desc: 'Attach current working tree diff' },
  { directive: '@staged', name: 'Staged Diff', desc: 'Attach staged git changes' },
  { directive: '@file:', name: 'Attach File', desc: 'Attach a file from the workspace' },
  { directive: '@folder:', name: 'Attach Folder', desc: 'Attach a folder from the workspace' },
  { directive: '@git:', name: 'Git Log', desc: 'Attach recent git commit history' },
];

export const InputBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [slashCommands, setSlashCommands] = useState<SlashItem[]>(DEFAULT_SLASH_COMMANDS);
  const [directives, setDirectives] = useState<DirectiveItem[]>(DEFAULT_DIRECTIVES);

  const { currentSurface, activeAgent, activeProject, selectedEngine } = useAppStore();
  const { sendMessage } = useAgentStore();
  const { sendProjectInstruction, activeSessionId } = useProjectStore();

  // Load real slash commands & directives from host daemon
  useEffect(() => {
    rpcClient.send('slash.list', {}, (res) => {
      if (res.result) {
        if (Array.isArray(res.result.commands)) setSlashCommands(res.result.commands);
        if (Array.isArray(res.result.directives)) setDirectives(res.result.directives);
      }
    });
  }, []);

  let placeholder = activeAgent ? `Ask ${activeAgent.name} (type / for commands)` : 'Ask agent...';
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

  const handleSelectSlash = (cmd: string) => {
    setInputText(`${cmd} `);
  };

  const handleSelectDirective = (dir: string) => {
    setInputText((prev) => {
      if (!prev || prev === '@') return `${dir} `;
      return `${prev} ${dir} `;
    });
  };

  const hasContent = inputText.trim().length > 0;
  const isTypingSlash = inputText.startsWith('/') && !inputText.includes(' ');
  const isTypingDirective =
    (inputText === '@' || inputText.endsWith(' @')) && !inputText.endsWith(':');

  // Filter slash commands based on typed prefix
  const filteredSlash = isTypingSlash
    ? slashCommands.filter((s) => s.command.toLowerCase().startsWith(inputText.toLowerCase()))
    : [];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
      {/* Floating Slash Commands Suggestion Tray */}
      {isTypingSlash && filteredSlash.length > 0 && (
        <View style={styles.autocompleteTray}>
          <View style={styles.autocompleteHeader}>
            <Command size={12} color="#38BDF8" />
            <Text style={styles.autocompleteHeaderText}>HERMES SLASH COMMANDS</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.autocompleteScroll}
          >
            {filteredSlash.map((s) => (
              <TouchableOpacity
                key={s.command}
                style={styles.autocompletePill}
                onPress={() => handleSelectSlash(s.command)}
                activeOpacity={0.7}
              >
                <Text style={styles.autocompleteCommandText}>{s.command}</Text>
                <Text style={styles.autocompleteDescText} numberOfLines={1}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Floating Directive (@) Suggestion Tray */}
      {isTypingDirective && (
        <View style={styles.autocompleteTray}>
          <View style={styles.autocompleteHeader}>
            <AtSign size={12} color="#10B981" />
            <Text style={[styles.autocompleteHeaderText, { color: '#10B981' }]}>
              WORKSPACE CONTEXT DIRECTIVES
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.autocompleteScroll}
          >
            {directives.map((d) => (
              <TouchableOpacity
                key={d.directive}
                style={styles.autocompletePill}
                onPress={() => handleSelectDirective(d.directive)}
                activeOpacity={0.7}
              >
                <Text style={[styles.autocompleteCommandText, { color: '#10B981' }]}>
                  {d.directive}
                </Text>
                <Text style={styles.autocompleteDescText} numberOfLines={1}>
                  {d.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
          autoCapitalize="none"
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
              onPress={() => handleQuickAction('/review')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <FileCode size={16} color="#38BDF8" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionTitle}>Audit Git Diff (/review)</Text>
                <Text style={styles.actionSub}>Audit unstaged diff and verify patch quality</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleQuickAction('/context')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Gauge size={16} color="#10B981" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionTitle}>Context & Token Usage (/context)</Text>
                <Text style={styles.actionSub}>Inspect model context window & active tokens</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleQuickAction('/tools')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Cpu size={16} color="#A855F7" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionTitle}>Active Tools & MCP (/tools)</Text>
                <Text style={styles.actionSub}>Check enabled MCP servers and capabilities</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleQuickAction('/logs')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                <Terminal size={16} color={colors.hermesOrange} />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionTitle}>Agent Activity Logs (/logs)</Text>
                <Text style={styles.actionSub}>Follow real-time telemetry and gateway logs</Text>
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
  autocompleteTray: {
    marginBottom: 8,
    backgroundColor: '#16161A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  autocompleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  autocompleteHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.6,
  },
  autocompleteScroll: {
    gap: 8,
    paddingRight: 8,
  },
  autocompletePill: {
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'flex-start',
    minWidth: 90,
  },
  autocompleteCommandText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  autocompleteDescText: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: '500',
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

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Terminal, Send, Trash2, Shield, Play } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { rpcClient } from '../services/rpcClient';
import { TerminalLog } from '../types';

type ShellType = 'wsl' | 'powershell' | 'cmd';

const PRESET_COMMANDS = [
  { label: 'uname -a (Kernel)', cmd: 'uname -a', shell: 'wsl' as ShellType },
  { label: 'Ubuntu Version', cmd: 'cat /etc/os-release | grep PRETTY_NAME', shell: 'wsl' as ShellType },
  { label: 'Active Processes', cmd: 'ps aux | head -n 12', shell: 'wsl' as ShellType },
  { label: 'Install MCP Tool', cmd: 'npm install -g @modelcontextprotocol/server-postgres', shell: 'powershell' as ShellType },
  { label: 'Hermes Status', cmd: 'hermes status', shell: 'powershell' as ShellType },
  { label: 'Git Status', cmd: 'git status -s', shell: 'powershell' as ShellType },
];

export const TerminalScreen: React.FC = () => {
  const [shellType, setShellType] = useState<ShellType>('wsl');
  const [commandInput, setCommandInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      type: 'info',
      content: 'Linux Kernel & Host Terminal connected.',
      timestamp: 'system',
    },
    {
      id: 'init-2',
      type: 'info',
      content: 'Select [WSL2 Ubuntu 24.04] for direct Linux kernel execution or [PowerShell] for host commands.',
      timestamp: 'system',
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  const handleRunCommand = (cmdToRun?: string) => {
    const rawCmd = cmdToRun !== undefined ? cmdToRun : commandInput;
    const cmd = rawCmd.trim();
    if (!cmd || isRunning) return;

    const inputLog: TerminalLog = {
      id: `log-${Date.now()}`,
      type: 'input',
      content: `${shellType === 'wsl' ? 'rishi@ubuntu:~$' : 'PS>'} ${cmd}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setLogs((prev) => [...prev, inputLog]);
    setCommandInput('');
    setIsRunning(true);

    rpcClient.send('terminal.execute', { command: cmd, shellType }, (res) => {
      if (res.type === 'stdout' && res.data) {
        setLogs((prev) => [
          ...prev,
          {
            id: `out-${Date.now()}-${Math.random()}`,
            type: 'stdout',
            content: res.data.trimEnd(),
            timestamp: '',
          },
        ]);
      } else if (res.type === 'stderr' && res.data) {
        setLogs((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}-${Math.random()}`,
            type: 'stderr',
            content: res.data.trimEnd(),
            timestamp: '',
          },
        ]);
      } else if (res.type === 'done' || res.result) {
        setIsRunning(false);
      }
    });
  };

  const handleClear = () => {
    setLogs([
      {
        id: `clear-${Date.now()}`,
        type: 'info',
        content: 'Terminal buffer cleared.',
        timestamp: 'system',
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Shell Selector Bar */}
      <View style={styles.shellBar}>
        <View style={styles.shellSelector}>
          <TouchableOpacity
            style={[styles.shellTab, shellType === 'wsl' && styles.shellTabActive]}
            onPress={() => setShellType('wsl')}
            activeOpacity={0.7}
          >
            <Text style={[styles.shellTabText, shellType === 'wsl' && styles.shellTabTextActive]}>
              🐧 Ubuntu 24.04 (WSL2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shellTab, shellType === 'powershell' && styles.shellTabActive]}
            onPress={() => setShellType('powershell')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.shellTabText,
                shellType === 'powershell' && styles.shellTabTextActive,
              ]}
            >
              💻 PowerShell
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
          <Trash2 size={13} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Quick Command Presets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsBar}
      >
        {PRESET_COMMANDS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.presetChip}
            onPress={() => {
              setShellType(item.shell);
              handleRunCommand(item.cmd);
            }}
            activeOpacity={0.7}
          >
            <Play size={10} color={colors.accentEmerald} />
            <Text style={styles.presetText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Terminal Output Log Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.terminalBody}
        contentContainerStyle={styles.terminalContent}
        showsVerticalScrollIndicator={true}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {logs.map((log) => {
          if (log.type === 'input') {
            return (
              <View key={log.id} style={styles.inputLineBox}>
                <Text style={styles.inputPromptText}>{log.content}</Text>
              </View>
            );
          }
          if (log.type === 'info') {
            return (
              <Text key={log.id} style={styles.infoLineText}>
                [info] {log.content}
              </Text>
            );
          }
          if (log.type === 'stderr') {
            return (
              <Text key={log.id} style={styles.errLineText}>
                {log.content}
              </Text>
            );
          }
          return (
            <Text key={log.id} style={styles.stdoutLineText}>
              {log.content}
            </Text>
          );
        })}

        {isRunning && (
          <View style={styles.runningIndicator}>
            <View style={styles.runningDot} />
            <Text style={styles.runningText}>Executing command...</Text>
          </View>
        )}
      </ScrollView>

      {/* Command Input Bar */}
      <View style={styles.commandInputRow}>
        <View style={styles.promptBadge}>
          <Text style={styles.promptBadgeText}>
            {shellType === 'wsl' ? 'linux$' : 'PS>'}
          </Text>
        </View>

        <TextInput
          style={styles.commandTextInput}
          placeholder={
            shellType === 'wsl'
              ? 'Run Linux command (e.g. apt, python, uname)...'
              : 'Run host command (e.g. npm, git, hermes)...'
          }
          placeholderTextColor={colors.textMuted}
          value={commandInput}
          onChangeText={setCommandInput}
          onSubmitEditing={() => handleRunCommand()}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[styles.sendBtn, !commandInput.trim() && styles.sendBtnDisabled]}
          onPress={() => handleRunCommand()}
          disabled={!commandInput.trim() || isRunning}
          activeOpacity={0.8}
        >
          <Send size={14} color={commandInput.trim() ? '#000000' : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D10',
  },
  shellBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#141418',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  shellSelector: {
    flexDirection: 'row',
    backgroundColor: '#1E1E24',
    borderRadius: 8,
    padding: 2,
    gap: 4,
  },
  shellTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  shellTabActive: {
    backgroundColor: '#2D2D38',
  },
  shellTabText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  shellTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E24',
  },
  presetsBar: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: '#111115',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  presetText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  terminalBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  terminalContent: {
    gap: 3,
    paddingBottom: 20,
  },
  inputLineBox: {
    marginTop: 6,
    marginBottom: 2,
  },
  inputPromptText: {
    fontSize: 11.5,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
    fontWeight: '700',
  },
  infoLineText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#60A5FA',
    lineHeight: 16,
  },
  stdoutLineText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#E2E8F0',
    lineHeight: 16,
  },
  errLineText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#F87171',
    lineHeight: 16,
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  runningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentEmerald,
  },
  runningText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  commandInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#141418',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  promptBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#22222A',
  },
  promptBadgeText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
    fontWeight: '700',
  },
  commandTextInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#1E1E24',
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'monospace',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#2A2A33',
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Trash2,
  Layers,
  Sparkles,
  Smartphone,
  Play,
  X,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  SquareCode,
  ShieldAlert,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { rpcClient } from '../services/rpcClient';
import { useAppStore } from '../store/useAppStore';
import { TerminalLog } from '../types';

type ShellType = 'phone' | 'wsl' | 'powershell' | 'cmd';

interface QuickToolItem {
  id: string;
  category: 'phone' | 'ai' | 'diag';
  title: string;
  desc: string;
  cmd: string;
  shell: ShellType;
  badge: string;
}

const COMMON_COMPLETIONS = [
  'detect-engines',
  'pkg update -y',
  'pkg install -y nodejs python git',
  'npm install -g @anthropic-ai/claude-code',
  'pip install hermes-agent',
  'node -v',
  'python3 -V',
  'uname -a',
  'clear',
  'git status',
  'git diff',
  'ls -la',
  'claude',
  'hermes',
  'ollama',
];

const QUICK_TOOLS: QuickToolItem[] = [
  {
    id: 'phone-toolchain',
    category: 'phone',
    title: 'Install Phone Toolchain (Node.js, Python, Git)',
    desc: 'Installs full Linux developer runtimes inside Android phone Termux userland.',
    cmd: 'pkg install -y nodejs python git',
    shell: 'phone',
    badge: 'Recommended for Phone',
  },
  {
    id: 'phone-update',
    category: 'phone',
    title: 'Update Phone Package Repositories',
    desc: 'Refreshes Termux package indices to ensure latest dependencies.',
    cmd: 'pkg update -y',
    shell: 'phone',
    badge: 'Maintenance',
  },
  {
    id: 'install-claude',
    category: 'ai',
    title: 'Install Claude Code CLI',
    desc: 'Anthropic agentic CLI for codebase navigation, tool execution, and code generation.',
    cmd: 'npm install -g @anthropic-ai/claude-code',
    shell: 'powershell',
    badge: 'AI Engine',
  },
  {
    id: 'install-hermes',
    category: 'ai',
    title: 'Install Nous Hermes Agent CLI',
    desc: 'Autonomous multi-step coding agent supporting local and remote inference.',
    cmd: 'pip install hermes-agent',
    shell: 'wsl',
    badge: 'AI Engine',
  },
  {
    id: 'install-ollama',
    category: 'ai',
    title: 'Install Ollama Local LLM',
    desc: 'Run local open-weight models (Llama 3, DeepSeek, Qwen) completely offline.',
    cmd: 'curl -fsSL https://ollama.com/install.sh | sh',
    shell: 'wsl',
    badge: 'Offline LLM',
  },
  {
    id: 'detect-clis',
    category: 'diag',
    title: 'Scan & Detect Installed Engines',
    desc: 'Scans system PATH for Hermes, Claude, Ollama, Node & Python and verifies paths.',
    cmd: 'detect-engines',
    shell: 'phone',
    badge: 'Diagnostics',
  },
  {
    id: 'kernel-uname',
    category: 'diag',
    title: 'Check Kernel & Architecture',
    desc: 'Displays the active Linux kernel version, system architecture, and OS build.',
    cmd: 'uname -a',
    shell: 'wsl',
    badge: 'Kernel',
  },
];

export const TerminalScreen: React.FC = () => {
  const {
    setSurface,
    openDrawer,
    terminalInitialCommand,
    terminalInitialShell,
    clearTerminalInitialCommand,
  } = useAppStore();

  const [shellType, setShellType] = useState<ShellType>('wsl');
  const [commandInput, setCommandInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Termux Keyboard Controls State
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'detect-engines',
    'node -v',
    'python3 -V || python -V',
    'uname -a',
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [draftInput, setDraftInput] = useState<string>('');

  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'init-header',
      type: 'info',
      content:
        '┌────────────────────────────────────────────────────────┐\n' +
        '│  O-One Termux Terminal Console                         │\n' +
        '│  Full shell session with keyboard shortcuts & history  │\n' +
        '│  Tap any command below or use Termux keys: TAB, ▲, ▼   │\n' +
        '└────────────────────────────────────────────────────────┘',
      timestamp: 'system',
    },
    {
      id: 'init-ready',
      type: 'info',
      content: 'Terminal ready. Type commands directly or use the Termux shortcuts bar.',
      timestamp: 'system',
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-scroll on new logs
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  // Handle incoming command from other screens (e.g. CreateAgentModal or Project)
  useEffect(() => {
    if (terminalInitialCommand) {
      const initialCmd = terminalInitialCommand;
      const initialSh = terminalInitialShell || 'wsl';
      setShellType(initialSh);
      setCommandInput(initialCmd);
      clearTerminalInitialCommand();
      setTimeout(() => {
        handleRunCommand(initialCmd, initialSh);
      }, 200);
    }
  }, [terminalInitialCommand, terminalInitialShell]);

  // -------------------------------------------------------------
  // COMMAND EXECUTION
  // -------------------------------------------------------------
  const handleRunCommand = (cmdToRun?: string, explicitShell?: ShellType) => {
    const rawCmd = cmdToRun !== undefined ? cmdToRun : commandInput;
    const cmd = rawCmd.trim();
    if (!cmd || isRunning) return;

    // Reset history browsing state & record command in history
    setCommandHistory((prev) => (prev[prev.length - 1] === cmd ? prev : [...prev, cmd]));
    setHistoryIndex(-1);
    setDraftInput('');

    // Handle 'clear' command directly
    if (cmd === 'clear') {
      handleClear();
      setCommandInput('');
      return;
    }

    const currentShell = explicitShell || shellType;

    // Special command: detect-engines
    if (cmd === 'detect-engines') {
      const inputLog: TerminalLog = {
        id: `log-${Date.now()}`,
        type: 'input',
        content: `Checking installed CLI engines in PATH...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setLogs((prev) => [...prev, inputLog]);
      setIsRunning(true);
      rpcClient.send('tools.detectCLIs', {}, (res) => {
        setIsRunning(false);
        if (res.result && Array.isArray(res.result)) {
          const lines = res.result.map((cli: any) =>
            cli.installed
              ? `  [✓ INSTALLED] ${cli.name} -> ${cli.path}`
              : `  [✗ MISSING]   ${cli.name} -> To install: ${cli.installCmd}`
          );
          setLogs((prev) => [
            ...prev,
            {
              id: `cli-${Date.now()}`,
              type: 'info',
              content: `Engine Detection Report:\n${lines.join('\n')}`,
              timestamp: '',
            },
          ]);
        }
      });
      setCommandInput('');
      return;
    }

    const promptPrefix =
      currentShell === 'phone'
        ? 'phone:~$ '
        : currentShell === 'wsl'
        ? 'ubuntu:~$ '
        : 'PS> ';

    const inputLog: TerminalLog = {
      id: `log-${Date.now()}`,
      type: 'input',
      content: `${promptPrefix}${cmd}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setLogs((prev) => [...prev, inputLog]);
    setCommandInput('');
    setIsRunning(true);

    rpcClient.send('terminal.execute', { command: cmd, shellType: currentShell }, (res) => {
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

  // -------------------------------------------------------------
  // SIGINT / CTRL+C KILL PROCESS
  // -------------------------------------------------------------
  const handleCtrlC = () => {
    if (isRunning) {
      rpcClient.send('terminal.kill', {}, () => {});
      setLogs((prev) => [
        ...prev,
        {
          id: `abort-${Date.now()}`,
          type: 'stderr',
          content: '^C',
          timestamp: '',
        },
      ]);
      setIsRunning(false);
    } else if (commandInput) {
      setLogs((prev) => [
        ...prev,
        {
          id: `int-${Date.now()}`,
          type: 'input',
          content: `${shellType === 'phone' ? 'phone:~$ ' : shellType === 'wsl' ? 'ubuntu:~$ ' : 'PS> '}${commandInput}^C`,
          timestamp: '',
        },
      ]);
      setCommandInput('');
    }
    setCtrlActive(false);
    setHistoryIndex(-1);
  };

  // -------------------------------------------------------------
  // TERMUX SHORTCUT KEYS HANDLERS
  // -------------------------------------------------------------
  const handleHistoryUp = () => {
    if (commandHistory.length === 0) return;
    if (historyIndex === -1) {
      setDraftInput(commandInput);
      const nextIdx = commandHistory.length - 1;
      setHistoryIndex(nextIdx);
      setCommandInput(commandHistory[nextIdx]);
    } else if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setCommandInput(commandHistory[nextIdx]);
    }
  };

  const handleHistoryDown = () => {
    if (historyIndex === -1) return;
    if (historyIndex < commandHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setCommandInput(commandHistory[nextIdx]);
    } else {
      setHistoryIndex(-1);
      setCommandInput(draftInput);
    }
  };

  const handleTab = () => {
    const trimmed = commandInput.trim();
    if (!trimmed) {
      setCommandInput((prev) => prev + '  ');
      return;
    }
    const match = COMMON_COMPLETIONS.find((c) => c.startsWith(trimmed));
    if (match) {
      setCommandInput(match + ' ');
    } else {
      setCommandInput((prev) => prev + ' ');
    }
  };

  const handleInsertChar = (ch: string) => {
    setCommandInput((prev) => prev + ch);
    inputRef.current?.focus();
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

  const handleRunTool = (tool: QuickToolItem) => {
    setIsGuideModalOpen(false);
    setShellType(tool.shell);
    setTimeout(() => {
      handleRunCommand(tool.cmd, tool.shell);
    }, 150);
  };

  const getShellSubtitle = () => {
    switch (shellType) {
      case 'phone':
        return 'Phone Linux (Termux)';
      case 'wsl':
        return 'WSL2 Ubuntu 24.04';
      case 'powershell':
        return 'Windows PowerShell';
      default:
        return 'Shell Active';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setSurface('home')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitleText}>Terminal</Text>
          <Text style={styles.headerSubText}>{getShellSubtitle()}</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setIsGuideModalOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Sparkles size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleClear}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={openDrawer}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Layers size={17} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Shell Segmented Selector */}
      <View style={styles.shellBar}>
        <View style={styles.shellSelector}>
          <TouchableOpacity
            style={[styles.shellTab, shellType === 'phone' && styles.shellTabActive]}
            onPress={() => setShellType('phone')}
            activeOpacity={0.7}
          >
            <Text style={[styles.shellTabText, shellType === 'phone' && styles.shellTabTextActive]}>
              Phone (Termux)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shellTab, shellType === 'wsl' && styles.shellTabActive]}
            onPress={() => setShellType('wsl')}
            activeOpacity={0.7}
          >
            <Text style={[styles.shellTabText, shellType === 'wsl' && styles.shellTabTextActive]}>
              Linux (WSL2)
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
              PowerShell
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Direct Termux AMOLED Black Screen (Tap anywhere to focus prompt) */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.terminalBodyTouch}
        onPress={() => inputRef.current?.focus()}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.terminalBody}
          contentContainerStyle={styles.terminalContent}
          showsVerticalScrollIndicator={true}
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
                  {log.content}
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
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.runningText}>Executing in background...</Text>
              <TouchableOpacity style={styles.killPillBtn} onPress={handleCtrlC} activeOpacity={0.7}>
                <Text style={styles.killPillText}>^C Stop</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Integrated Prompt Line right at bottom of console */}
          <View style={styles.inlinePromptLine}>
            <Text style={styles.inlinePromptText}>
              {shellType === 'phone' ? 'phone:~$ ' : shellType === 'wsl' ? 'ubuntu:~$ ' : 'PS> '}
            </Text>
            <TextInput
              ref={inputRef}
              style={styles.inlineTextInput}
              value={commandInput}
              onChangeText={(text) => {
                // If CTRL was toggled on and user types 'c' or 'C', trigger SIGINT
                if (ctrlActive && (text.endsWith('c') || text.endsWith('C'))) {
                  handleCtrlC();
                  return;
                }
                setCommandInput(text);
              }}
              onSubmitEditing={() => handleRunCommand()}
              placeholder={isRunning ? 'Command running... (^C to stop)' : 'type command...'}
              placeholderTextColor="#4B5563"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              blurOnSubmit={false}
            />
          </View>
        </ScrollView>
      </TouchableOpacity>

      {/* Micro Quick-Action Chips Strip */}
      <View style={styles.quickChipsStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsContent}
        >
          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => handleRunCommand('detect-engines')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>detect-engines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => {
              setShellType('phone');
              handleRunCommand('pkg update -y', 'phone');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>pkg update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => handleRunCommand('node -v')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>node -v</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => handleRunCommand('python3 -V || python -V')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>python -V</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => {
              setShellType('wsl');
              handleRunCommand('uname -a', 'wsl');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>uname -a</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => handleRunCommand('clear')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => setIsGuideModalOpen(true)}
            activeOpacity={0.7}
          >
            <Sparkles size={11} color="#A1A1AA" />
            <Text style={styles.quickChipText}>Guide</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ============================================================== */}
      {/* THE ICONIC TERMUX ACCESSORY KEYS TOOLBAR (Above Mobile Keyboard) */}
      {/* ============================================================== */}
      <View style={styles.termuxBar}>
        {/* ESC Key */}
        <TouchableOpacity
          style={styles.termuxKey}
          onPress={() => {
            setCommandInput('');
            setHistoryIndex(-1);
            setCtrlActive(false);
          }}
          activeOpacity={0.6}
        >
          <Text style={styles.termuxKeyText}>ESC</Text>
        </TouchableOpacity>

        {/* TAB Key (Autocomplete) */}
        <TouchableOpacity style={styles.termuxKey} onPress={handleTab} activeOpacity={0.6}>
          <Text style={styles.termuxKeyText}>TAB</Text>
        </TouchableOpacity>

        {/* CTRL Key (Toggle or Kill) */}
        <TouchableOpacity
          style={[styles.termuxKey, ctrlActive && styles.termuxKeyActive]}
          onPress={() => {
            if (isRunning) {
              handleCtrlC();
            } else {
              setCtrlActive(!ctrlActive);
            }
          }}
          activeOpacity={0.6}
        >
          <Text style={[styles.termuxKeyText, ctrlActive && styles.termuxKeyTextActive]}>
            {isRunning ? '^C' : 'CTRL'}
          </Text>
        </TouchableOpacity>

        {/* ALT Key */}
        <TouchableOpacity
          style={[styles.termuxKey, altActive && styles.termuxKeyActive]}
          onPress={() => setAltActive(!altActive)}
          activeOpacity={0.6}
        >
          <Text style={[styles.termuxKeyText, altActive && styles.termuxKeyTextActive]}>ALT</Text>
        </TouchableOpacity>

        {/* Dash (-) */}
        <TouchableOpacity
          style={styles.termuxKey}
          onPress={() => handleInsertChar('-')}
          activeOpacity={0.6}
        >
          <Text style={styles.termuxKeyText}>-</Text>
        </TouchableOpacity>

        {/* Slash (/) */}
        <TouchableOpacity
          style={styles.termuxKey}
          onPress={() => handleInsertChar('/')}
          activeOpacity={0.6}
        >
          <Text style={styles.termuxKeyText}>/</Text>
        </TouchableOpacity>

        {/* Pipe (|) */}
        <TouchableOpacity
          style={styles.termuxKey}
          onPress={() => handleInsertChar(' | ')}
          activeOpacity={0.6}
        >
          <Text style={styles.termuxKeyText}>|</Text>
        </TouchableOpacity>

        {/* Tilde (~) */}
        <TouchableOpacity
          style={styles.termuxKey}
          onPress={() => handleInsertChar('~')}
          activeOpacity={0.6}
        >
          <Text style={styles.termuxKeyText}>~</Text>
        </TouchableOpacity>

        {/* History UP (▲) */}
        <TouchableOpacity style={styles.termuxKey} onPress={handleHistoryUp} activeOpacity={0.6}>
          <ArrowUp size={13} color="#D1D1D6" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* History DOWN (▼) */}
        <TouchableOpacity style={styles.termuxKey} onPress={handleHistoryDown} activeOpacity={0.6}>
          <ArrowDown size={13} color="#D1D1D6" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* Enter Key (↵) */}
        <TouchableOpacity
          style={[styles.termuxKey, styles.termuxKeyEnter]}
          onPress={() => handleRunCommand()}
          activeOpacity={0.7}
        >
          <CornerDownLeft size={13} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* ============================================================== */}
      {/* CLI Engines & Package Installer Guide Modal                    */}
      {/* ============================================================== */}
      <Modal
        visible={isGuideModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsGuideModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <View style={styles.modalTitleRow}>
                  <Sparkles size={18} color="#FFFFFF" />
                  <Text style={styles.modalTitle}>CLI Engines & Packages</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  1-Click commands to install runtimes & agent engines
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsGuideModalOpen(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollBody}>
              {/* Architecture Explanation Card */}
              <View style={styles.architectureCard}>
                <Smartphone size={18} color="#D1D1D6" />
                <View style={styles.architectureTextBox}>
                  <Text style={styles.architectureTitle}>How Phone Linux Works</Text>
                  <Text style={styles.architectureDesc}>
                    Android uses the Linux kernel. Developer tools and AI CLIs run in the Termux Linux
                    userland without root. Installing Node.js, Python, and Git gives your phone a full
                    command-line development engine.
                  </Text>
                </View>
              </View>

              {/* Tool Categories */}
              <Text style={styles.sectionHeading}>📱 Phone Environment (Android)</Text>
              {QUICK_TOOLS.filter((t) => t.category === 'phone').map((tool) => (
                <View key={tool.id} style={styles.toolCard}>
                  <View style={styles.toolCardHeader}>
                    <Text style={styles.toolCardTitle}>{tool.title}</Text>
                    <View style={styles.toolBadge}>
                      <Text style={styles.toolBadgeText}>{tool.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.toolCardDesc}>{tool.desc}</Text>
                  <View style={styles.toolCmdBox}>
                    <Text style={styles.toolCmdText}>{tool.cmd}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.toolRunBtn}
                    onPress={() => handleRunTool(tool)}
                    activeOpacity={0.7}
                  >
                    <Play size={12} color="#000000" fill="#000000" />
                    <Text style={styles.toolRunBtnText}>Run in Terminal</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.sectionHeading}>🤖 AI Agent CLI Engines</Text>
              {QUICK_TOOLS.filter((t) => t.category === 'ai').map((tool) => (
                <View key={tool.id} style={styles.toolCard}>
                  <View style={styles.toolCardHeader}>
                    <Text style={styles.toolCardTitle}>{tool.title}</Text>
                    <View style={styles.toolBadge}>
                      <Text style={styles.toolBadgeText}>{tool.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.toolCardDesc}>{tool.desc}</Text>
                  <View style={styles.toolCmdBox}>
                    <Text style={styles.toolCmdText}>{tool.cmd}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.toolRunBtn}
                    onPress={() => handleRunTool(tool)}
                    activeOpacity={0.7}
                  >
                    <Play size={12} color="#000000" fill="#000000" />
                    <Text style={styles.toolRunBtnText}>Run in Terminal</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.sectionHeading}>🔍 Diagnostics & Kernel</Text>
              {QUICK_TOOLS.filter((t) => t.category === 'diag').map((tool) => (
                <View key={tool.id} style={styles.toolCard}>
                  <View style={styles.toolCardHeader}>
                    <Text style={styles.toolCardTitle}>{tool.title}</Text>
                    <View style={styles.toolBadge}>
                      <Text style={styles.toolBadgeText}>{tool.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.toolCardDesc}>{tool.desc}</Text>
                  <View style={styles.toolCmdBox}>
                    <Text style={styles.toolCmdText}>{tool.cmd}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.toolRunBtn}
                    onPress={() => handleRunTool(tool)}
                    activeOpacity={0.7}
                  >
                    <Play size={12} color="#000000" fill="#000000" />
                    <Text style={styles.toolRunBtnText}>Run in Terminal</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0C0C0E',
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shellBar: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#0C0C0E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    flexGrow: 0,
  },
  shellSelector: {
    flexDirection: 'row',
    backgroundColor: '#181820',
    borderRadius: 8,
    padding: 2,
    gap: 4,
  },
  shellTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shellTabActive: {
    backgroundColor: '#272733',
  },
  shellTabText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  shellTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  terminalBodyTouch: {
    flex: 1,
    backgroundColor: '#000000',
  },
  terminalBody: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  terminalContent: {
    gap: 2,
    paddingBottom: 20,
  },
  inputLineBox: {
    marginTop: 6,
    marginBottom: 2,
  },
  inputPromptText: {
    fontSize: 12.5,
    fontFamily: 'monospace',
    color: '#22C55E',
    fontWeight: '700',
    lineHeight: 18,
  },
  infoLineText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#38BDF8',
    lineHeight: 16,
  },
  stdoutLineText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#F1F5F9',
    lineHeight: 18,
  },
  errLineText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#EF4444',
    lineHeight: 18,
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 4,
  },
  runningText: {
    fontSize: 11.5,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  killPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#272730',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  killPillText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: '#EF4444',
    fontWeight: '700',
  },
  inlinePromptLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 24,
  },
  inlinePromptText: {
    fontSize: 12.5,
    fontFamily: 'monospace',
    color: '#22C55E',
    fontWeight: '700',
  },
  inlineTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'monospace',
    padding: 0,
    margin: 0,
  },
  quickChipsStrip: {
    height: 32,
    maxHeight: 32,
    flexGrow: 0,
    backgroundColor: '#0C0C0E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickChipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
    height: 32,
  },
  quickChip: {
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 5,
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickChipText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    fontWeight: '500',
  },
  termuxBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: '#0C0C0E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  termuxKey: {
    flex: 1,
    height: 32,
    backgroundColor: '#1E1E26',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  termuxKeyActive: {
    backgroundColor: '#323242',
    borderColor: '#FFFFFF',
  },
  termuxKeyEnter: {
    backgroundColor: '#272738',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  termuxKeyText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#D1D1D6',
    fontWeight: '700',
  },
  termuxKeyTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '82%',
    backgroundColor: '#111116',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollBody: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  architectureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#16161C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  architectureTextBox: {
    flex: 1,
  },
  architectureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  architectureDesc: {
    fontSize: 11.5,
    color: '#D1D5DB',
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toolCard: {
    backgroundColor: '#181820',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  toolCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  toolBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#262633',
  },
  toolBadgeText: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  toolCardDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
  },
  toolCmdBox: {
    backgroundColor: '#0D0D12',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  toolCmdText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#D1D1D6',
  },
  toolRunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 7,
  },
  toolRunBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
});

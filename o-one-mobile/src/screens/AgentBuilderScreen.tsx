import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Sparkles, Cpu, Layers, Folder, Check, Terminal, Shield } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { Agent, AgentEngine, MCPServerItem } from '../types';
import { rpcClient } from '../services/rpcClient';

const ENGINE_OPTIONS: { id: AgentEngine; label: string; desc: string; badge: string }[] = [
  {
    id: 'hermes',
    label: 'Nous Hermes 3',
    desc: 'Local streaming agent with native tool-calling & reasoning',
    badge: 'Fast · Local',
  },
  {
    id: 'antigravity',
    label: 'Antigravity CLI',
    desc: 'Autonomous multi-file planning, git diffs & code reasoning',
    badge: 'High · Agentic',
  },
  {
    id: 'claude',
    label: 'Claude Code',
    desc: 'Anthropic agent with standard tool execution loop',
    badge: 'Med · Cloud',
  },
  {
    id: 'codex',
    label: 'OpenAI Codex',
    desc: 'Reasoning agent for algorithmic logic & architecture',
    badge: 'Med · Cloud',
  },
  {
    id: 'linux_shell',
    label: 'Linux Kernel Shell',
    desc: 'Direct execution in Ubuntu 24.04 WSL2 Linux kernel',
    badge: 'Kernel · Direct',
  },
];

const MODEL_PRESETS = [
  'gpt-5.6-luna',
  'hermes-3-llama-3.1-8b',
  'hermes-3-llama-3.1-70b',
  'claude-3-7-sonnet',
  'gemini-2.5-pro',
];

export const AgentBuilderScreen: React.FC = () => {
  const { addAgent, agents, setSurface } = useAppStore();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are an autonomous AI software engineer. Analyze code, run terminal commands, execute git diffs, and write clean production code.'
  );
  const [selectedEngine, setSelectedEngine] = useState<AgentEngine>('hermes');
  const [selectedModel, setSelectedModel] = useState('gpt-5.6-luna');
  const [workspacePath, setWorkspacePath] = useState('D:\\project\\O one');
  const [availableMcp, setAvailableMcp] = useState<MCPServerItem[]>([]);
  const [selectedMcp, setSelectedMcp] = useState<string[]>([]);

  // Fetch real configured MCP servers from the host
  useEffect(() => {
    rpcClient.send('mcp.list', {}, (res) => {
      if (res.result && Array.isArray(res.result)) {
        setAvailableMcp(res.result);
        setSelectedMcp(res.result.map((s) => s.name));
      }
    });
  }, []);

  const toggleMcp = (mcpName: string) => {
    if (selectedMcp.includes(mcpName)) {
      setSelectedMcp(selectedMcp.filter((m) => m !== mcpName));
    } else {
      setSelectedMcp([...selectedMcp, mcpName]);
    }
  };

  const handleCreateAgent = () => {
    const agentName = name.trim() || 'Autonomous Agent';
    const agentRole = role.trim() || 'Software Engineer';
    const engineConfig = ENGINE_OPTIONS.find((e) => e.id === selectedEngine);

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: agentName,
      role: agentRole,
      systemPrompt: systemPrompt.trim(),
      engine: selectedEngine,
      engineLabel: engineConfig?.label || 'Nous Hermes 3',
      model: selectedModel.trim(),
      workspacePath: workspacePath.trim(),
      status: 'ready',
      capabilities: ['Terminal', 'Code Diff', ...selectedMcp],
      mcpServers: selectedMcp,
      createdAt: new Date().toISOString(),
    };

    addAgent(newAgent);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Blank Slate Header Banner */}
      <View style={styles.headerBox}>
        <View style={styles.badgeRow}>
          <View style={styles.blankBadge}>
            <Sparkles size={13} color={colors.hermesOrange} />
            <Text style={styles.blankBadgeText}>Agent Genesis · Blank Slate</Text>
          </View>
          {agents.length > 0 && (
            <TouchableOpacity onPress={() => setSurface('cockpit')}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>Build Your Autonomous Agent</Text>
        <Text style={styles.subtitle}>
          Configure your AI engineer from scratch. Select its engine, model, tools, and workspace.
        </Text>
      </View>

      {/* 1. Agent Name & Role */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>1. Identity & Role</Text>

        <Text style={styles.fieldLabel}>Agent Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lead Architect, Bug Triager, DevOps"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.fieldLabel}>Role / Specialty</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Senior Fullstack Engineer & Code Reviewer"
          placeholderTextColor={colors.textMuted}
          value={role}
          onChangeText={setRole}
        />

        <Text style={styles.fieldLabel}>System Prompt / Instructions</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Give your agent custom behavioral rules..."
          placeholderTextColor={colors.textMuted}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* 2. AI Engine Picker */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>2. Execution Engine</Text>
        <Text style={styles.sectionDesc}>Select the runtime engine orchestrating this agent</Text>

        <View style={styles.engineGrid}>
          {ENGINE_OPTIONS.map((engine) => {
            const isSelected = selectedEngine === engine.id;
            return (
              <TouchableOpacity
                key={engine.id}
                style={[styles.engineOption, isSelected && styles.engineOptionActive]}
                onPress={() => setSelectedEngine(engine.id)}
                activeOpacity={0.7}
              >
                <View style={styles.engineHeader}>
                  <Text style={[styles.engineTitle, isSelected && styles.engineTitleActive]}>
                    {engine.label}
                  </Text>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{engine.badge}</Text>
                  </View>
                </View>
                <Text style={styles.engineDesc}>{engine.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Model Picker */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. Inference Model</Text>
        <Text style={styles.sectionDesc}>
          Choose the foundation model (passes `-m` to local CLI or cloud API)
        </Text>

        <View style={styles.presetChips}>
          {MODEL_PRESETS.map((m) => {
            const isSelected = selectedModel === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedModel(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Or Custom Model Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. gpt-5.6-luna or custom fine-tuned model"
          placeholderTextColor={colors.textMuted}
          value={selectedModel}
          onChangeText={setSelectedModel}
          autoCapitalize="none"
        />
      </View>

      {/* 4. Live MCP Tools Connection */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>4. Model Context Protocol (MCP)</Text>
          <Text style={styles.mcpCount}>{availableMcp.length} on Host</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Attach live tools discovered from your host daemon
        </Text>

        {availableMcp.length === 0 ? (
          <View style={styles.emptyMcp}>
            <Text style={styles.emptyMcpText}>
              No MCP servers active on host. You can connect any server in the MCP Hub.
            </Text>
          </View>
        ) : (
          <View style={styles.mcpList}>
            {availableMcp.map((mcp) => {
              const isChecked = selectedMcp.includes(mcp.name);
              return (
                <TouchableOpacity
                  key={mcp.name}
                  style={[styles.mcpItem, isChecked && styles.mcpItemActive]}
                  onPress={() => toggleMcp(mcp.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.mcpLeft}>
                    <View style={[styles.checkCircle, isChecked && styles.checkCircleActive]}>
                      {isChecked && <Check size={11} color="#000000" strokeWidth={3} />}
                    </View>
                    <View>
                      <Text style={styles.mcpName}>{mcp.name}</Text>
                      <Text style={styles.mcpTransport} numberOfLines={1}>
                        {mcp.transport || 'stdio'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.mcpToolsBadge}>{mcp.tools || 'all'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 5. Workspace Directory */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>5. Target Workspace Directory</Text>
        <Text style={styles.sectionDesc}>Project root folder on your host machine or VM</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. D:\project\O one or /home/azureuser/app"
          placeholderTextColor={colors.textMuted}
          value={workspacePath}
          onChangeText={setWorkspacePath}
          autoCapitalize="none"
        />
      </View>

      {/* Launch Agent Button */}
      <TouchableOpacity
        style={styles.launchBtn}
        onPress={handleCreateAgent}
        activeOpacity={0.8}
      >
        <Sparkles size={16} color="#000000" />
        <Text style={styles.launchBtnText}>Create & Launch Agent</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
    gap: 16,
  },
  headerBox: {
    gap: 6,
    paddingVertical: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  blankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignSelf: 'flex-start',
  },
  blankBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.hermesOrange,
    fontFamily: 'monospace',
  },
  cancelText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mcpCount: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
  },
  sectionDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: -4,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  input: {
    height: 42,
    backgroundColor: colors.bgCardInner,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInner,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
  },
  multilineInput: {
    height: 80,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  engineGrid: {
    gap: 8,
    marginTop: 4,
  },
  engineOption: {
    padding: 12,
    backgroundColor: colors.bgCardInner,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderInner,
    gap: 4,
  },
  engineOptionActive: {
    borderColor: colors.hermesOrange,
    backgroundColor: '#261F1A',
  },
  engineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  engineTitleActive: {
    color: colors.hermesOrange,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  engineDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  presetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.bgCardInner,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.borderInner,
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  mcpList: {
    gap: 6,
  },
  mcpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: colors.bgCardInner,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInner,
  },
  mcpItemActive: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: '#16231C',
  },
  mcpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: colors.accentEmerald,
    borderColor: colors.accentEmerald,
  },
  mcpName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mcpTransport: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  mcpToolsBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyMcp: {
    padding: 12,
    backgroundColor: colors.bgCardInner,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyMcpText: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  launchBtn: {
    height: 48,
    borderRadius: 9999,
    backgroundColor: colors.btnPrimaryBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  launchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.btnPrimaryText,
  },
});

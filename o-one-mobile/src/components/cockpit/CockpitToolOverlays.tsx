import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  FolderTree,
  Folder,
  FileCode,
  FileText,
  FileJson,
  Terminal,
  BookOpen,
  X,
  Play,
  Copy,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Plus,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { rpcClient } from '../../services/rpcClient';
import { useKnowledgeStore } from '../../store/useKnowledgeStore';
import { Agent, FileTreeNode, KnowledgeFile } from '../../types';

interface CockpitToolOverlaysProps {
  activeTool: 'none' | 'files' | 'terminal' | 'knowledge';
  onClose: () => void;
  agent: Agent;
  onInsertPrompt: (prompt: string) => void;
}

export const CockpitToolOverlays: React.FC<CockpitToolOverlaysProps> = ({
  activeTool,
  onClose,
  agent,
  onInsertPrompt,
}) => {
  if (activeTool === 'none') return null;

  return (
    <View style={styles.overlayContainer}>
      {activeTool === 'files' && (
        <FilesPanel agent={agent} onClose={onClose} onInsertPrompt={onInsertPrompt} />
      )}
      {activeTool === 'terminal' && <TerminalPanel agent={agent} onClose={onClose} />}
      {activeTool === 'knowledge' && (
        <KnowledgePanel onClose={onClose} onInsertPrompt={onInsertPrompt} />
      )}
    </View>
  );
};

// ----------------------------------------------------------------------
// 1. FILES PANEL (File structure browser)
// ----------------------------------------------------------------------
interface PanelProps {
  agent: Agent;
  onClose: () => void;
  onInsertPrompt: (prompt: string) => void;
}

const FilesPanel: React.FC<PanelProps> = ({ agent, onClose, onInsertPrompt }) => {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    rpcClient.send(
      'fs.readTree',
      { path: agent.workspacePath || 'D:\\project\\O one', maxDepth: 2 },
      (res) => {
        setLoading(false);
        if (res.result && Array.isArray(res.result)) {
          setFileTree(res.result);
        } else {
          // Fallback demo structure if offline
          setFileTree([
            {
              name: 'src',
              path: 'src',
              fullPath: 'src',
              isDir: true,
              children: [
                { name: 'screens', path: 'src/screens', fullPath: 'src/screens', isDir: true },
                { name: 'components', path: 'src/components', fullPath: 'src/components', isDir: true },
                { name: 'store', path: 'src/store', fullPath: 'src/store', isDir: true },
                { name: 'types', path: 'src/types/index.ts', fullPath: 'src/types/index.ts', isDir: false },
              ],
            },
            { name: 'package.json', path: 'package.json', fullPath: 'package.json', isDir: false },
            { name: 'App.tsx', path: 'App.tsx', fullPath: 'App.tsx', isDir: false },
          ]);
        }
      }
    );
  }, [agent.workspacePath]);

  const toggleExpand = (dirPath: string) => {
    setExpandedDirs((prev) => ({ ...prev, [dirPath]: !prev[dirPath] }));
  };

  const handleCopyPath = (filePath: string) => {
    Clipboard.setStringAsync(filePath);
    setCopiedPath(filePath);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  const handlePromptFile = (node: FileTreeNode) => {
    onInsertPrompt(`Inspect and explain \`${node.path}\` in the project workspace.`);
    onClose();
  };

  const getFileIcon = (name: string, isDir: boolean) => {
    if (isDir) return <Folder size={15} color="#3B82F6" strokeWidth={2.2} />;
    if (name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.jsx') || name.endsWith('.js')) {
      return <FileCode size={15} color="#60A5FA" strokeWidth={2} />;
    }
    if (name.endsWith('.json')) {
      return <FileJson size={15} color="#F59E0B" strokeWidth={2} />;
    }
    return <FileText size={15} color="#A1A1AA" strokeWidth={2} />;
  };

  return (
    <View style={styles.panelCard}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderLeft}>
          <FolderTree size={16} color="#38BDF8" strokeWidth={2.4} />
          <Text style={styles.panelTitle}>Workspace Files</Text>
          <Text style={styles.panelSubText}>
            {agent.workspacePath ? agent.workspacePath.split('\\').pop() : 'O one'}
          </Text>
        </View>

        <TouchableOpacity style={styles.panelCloseBtn} onPress={onClose} activeOpacity={0.7}>
          <X size={15} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

      {/* Search Filter */}
      <View style={styles.miniSearch}>
        <Search size={13} color="#71717A" />
        <TextInput
          style={styles.miniSearchInput}
          placeholder="Filter workspace files..."
          placeholderTextColor="#71717A"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* File Tree List */}
      <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.panelLoading}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.panelLoadingText}>Scanning files...</Text>
          </View>
        ) : (
          fileTree
            .filter((node) => node.name.toLowerCase().includes(search.toLowerCase()))
            .map((node) => {
              const isExpanded = !!expandedDirs[node.path];
              const isCopied = copiedPath === node.path;

              return (
                <View key={node.path} style={styles.treeNodeGroup}>
                  <TouchableOpacity
                    style={styles.treeRow}
                    onPress={() => (node.isDir ? toggleExpand(node.path) : handlePromptFile(node))}
                    activeOpacity={0.7}
                  >
                    {node.isDir ? (
                      isExpanded ? (
                        <ChevronDown size={13} color="#71717A" />
                      ) : (
                        <ChevronRight size={13} color="#71717A" />
                      )
                    ) : (
                      <View style={{ width: 13 }} />
                    )}

                    <View style={styles.nodeIconBox}>{getFileIcon(node.name, node.isDir)}</View>

                    <Text style={[styles.nodeName, node.isDir && styles.nodeNameDir]} numberOfLines={1}>
                      {node.name}
                    </Text>

                    {!node.isDir && (
                      <View style={styles.nodeActions}>
                        <TouchableOpacity
                          style={styles.microBtn}
                          onPress={() => handleCopyPath(node.path)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          {isCopied ? (
                            <Check size={12} color="#10B981" />
                          ) : (
                            <Copy size={12} color="#71717A" />
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.microBtn}
                          onPress={() => handlePromptFile(node)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Sparkles size={12} color="#38BDF8" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Expanded Dir Children */}
                  {node.isDir && isExpanded && node.children && (
                    <View style={styles.childIndent}>
                      {node.children.map((child) => (
                        <TouchableOpacity
                          key={child.path}
                          style={styles.childRow}
                          onPress={() => handlePromptFile(child)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.nodeIconBox}>
                            {getFileIcon(child.name, child.isDir)}
                          </View>
                          <Text style={styles.nodeName} numberOfLines={1}>
                            {child.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
        )}
      </ScrollView>
    </View>
  );
};

// ----------------------------------------------------------------------
// 2. TERMINAL PANEL (In-cockpit interactive runner)
// ----------------------------------------------------------------------
const TerminalPanel: React.FC<{ agent: Agent; onClose: () => void }> = ({ agent, onClose }) => {
  const [commandInput, setCommandInput] = useState('');
  const [logs, setLogs] = useState<string[]>([
    `[O1 Cockpit Terminal] Active in ${agent.workspacePath || 'workspace'}`,
    `Connected to Hermes daemon PID ${process.pid || 8443}`,
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const termScrollRef = useRef<ScrollView>(null);

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    setLogs((prev) => [...prev, `$ ${trimmed}`]);
    setCommandInput('');
    setIsRunning(true);

    rpcClient.send(
      'cmd.run',
      { command: trimmed, cwd: agent.workspacePath || process.cwd() },
      (res) => {
        setIsRunning(false);
        if (res.type === 'stdout' && res.data) {
          setLogs((prev) => [...prev, res.data.trim()]);
        } else if (res.type === 'stderr' && res.data) {
          setLogs((prev) => [...prev, `[stderr] ${res.data.trim()}`]);
        } else if (res.type === 'done') {
          setLogs((prev) => [...prev, `Process exited with code ${res.exitCode}`]);
        } else if (res.error) {
          setLogs((prev) => [...prev, `Error: ${res.error}`]);
        }
      }
    );
  };

  return (
    <View style={styles.panelCard}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderLeft}>
          <Terminal size={16} color="#10B981" strokeWidth={2.4} />
          <Text style={styles.panelTitle}>In-Cockpit Terminal</Text>
          <View style={styles.onlineDot} />
        </View>

        <TouchableOpacity style={styles.panelCloseBtn} onPress={onClose} activeOpacity={0.7}>
          <X size={15} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

      {/* Quick Command Chips */}
      <View style={styles.terminalQuickRow}>
        <TouchableOpacity
          style={styles.termChip}
          onPress={() => runCommand('git status -s')}
          activeOpacity={0.7}
        >
          <Text style={styles.termChipText}>git status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.termChip}
          onPress={() => runCommand('git diff --stat')}
          activeOpacity={0.7}
        >
          <Text style={styles.termChipText}>git diff</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.termChip}
          onPress={() => runCommand('npm test -- --bail')}
          activeOpacity={0.7}
        >
          <Text style={styles.termChipText}>npm test</Text>
        </TouchableOpacity>
      </View>

      {/* Console Output */}
      <ScrollView
        ref={termScrollRef}
        style={styles.termConsole}
        contentContainerStyle={styles.termConsoleContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => termScrollRef.current?.scrollToEnd({ animated: true })}
      >
        {logs.map((log, idx) => (
          <Text
            key={idx}
            style={[
              styles.termLine,
              log.startsWith('$') ? styles.termLineCmd : log.includes('stderr') ? styles.termLineErr : null,
            ]}
          >
            {log}
          </Text>
        ))}
        {isRunning && (
          <View style={styles.termRunningRow}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.termRunningText}>Executing command...</Text>
          </View>
        )}
      </ScrollView>

      {/* Command Input Box */}
      <View style={styles.termInputRow}>
        <Text style={styles.termPromptPrefix}>❯</Text>
        <TextInput
          style={styles.termInput}
          placeholder="Run bash or powershell command..."
          placeholderTextColor="#71717A"
          value={commandInput}
          onChangeText={setCommandInput}
          onSubmitEditing={() => runCommand(commandInput)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.termRunBtn}
          onPress={() => runCommand(commandInput)}
          activeOpacity={0.8}
        >
          <Play size={12} color="#000000" fill="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ----------------------------------------------------------------------
// 3. KNOWLEDGE PANEL (Quick reference injection)
// ----------------------------------------------------------------------
const KnowledgePanel: React.FC<{
  onClose: () => void;
  onInsertPrompt: (prompt: string) => void;
}> = ({ onClose, onInsertPrompt }) => {
  const { files } = useKnowledgeStore();
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);

  const handleInject = (file: KnowledgeFile) => {
    onInsertPrompt(
      `Reference shared knowledge from \`${file.name}\`:\n${file.content.slice(0, 600)}`
    );
    onClose();
  };

  return (
    <View style={styles.panelCard}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderLeft}>
          <BookOpen size={16} color="#A78BFA" strokeWidth={2.4} />
          <Text style={styles.panelTitle}>Shared Knowledge Files</Text>
          <View style={styles.countBadgeMini}>
            <Text style={styles.countBadgeMiniText}>{files.length}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.panelCloseBtn} onPress={onClose} activeOpacity={0.7}>
          <X size={15} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

      {/* Files List */}
      <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
        {files.map((file) => (
          <View key={file.id} style={styles.knowledgeCardMini}>
            <View style={styles.knowledgeIconMiniBox}>
              <FileText size={16} color="#A78BFA" />
            </View>

            <View style={styles.knowledgeInfoMiniCol}>
              <Text style={styles.knowledgeMiniName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.knowledgeMiniDesc} numberOfLines={1}>
                {file.description || file.content.replace(/\n+/g, ' ').slice(0, 50)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.injectBtn}
              onPress={() => handleInject(file)}
              activeOpacity={0.7}
            >
              <Sparkles size={12} color="#A78BFA" />
              <Text style={styles.injectBtnText}>Inject</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: '#0C0C0E',
    zIndex: 25,
  },
  panelCard: {
    backgroundColor: '#16161A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: 280,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#1C1C20',
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  panelSubText: {
    fontSize: 11,
    color: '#71717A',
  },
  panelCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121215',
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 10,
    height: 32,
    gap: 6,
  },
  miniSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    paddingVertical: 0,
  },
  panelScroll: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    maxHeight: 200,
  },
  panelLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  panelLoadingText: {
    fontSize: 12,
    color: '#71717A',
  },
  treeNodeGroup: {
    marginBottom: 2,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  nodeIconBox: {
    width: 20,
    alignItems: 'center',
  },
  nodeName: {
    fontSize: 12.5,
    color: '#D4D4D8',
    flex: 1,
  },
  nodeNameDir: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nodeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microBtn: {
    padding: 4,
  },
  childIndent: {
    paddingLeft: 20,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  terminalQuickRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  termChip: {
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  termChipText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: '#10B981',
  },
  termConsole: {
    backgroundColor: '#0E0E11',
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 8,
    maxHeight: 120,
    padding: 8,
  },
  termConsoleContent: {
    paddingBottom: 4,
  },
  termLine: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#A1A1AA',
    lineHeight: 16,
  },
  termLineCmd: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  termLineErr: {
    color: '#EF4444',
  },
  termRunningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  termRunningText: {
    fontSize: 10.5,
    color: '#71717A',
  },
  termInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  termPromptPrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  termInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    paddingVertical: 2,
  },
  termRunBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeMini: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeMiniText: {
    fontSize: 10,
    color: '#A78BFA',
    fontWeight: '700',
  },
  knowledgeCardMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F24',
    padding: 8,
    borderRadius: 10,
    marginVertical: 4,
  },
  knowledgeIconMiniBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#2A2A32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  knowledgeInfoMiniCol: {
    flex: 1,
  },
  knowledgeMiniName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  knowledgeMiniDesc: {
    fontSize: 10.5,
    color: '#71717A',
    marginTop: 1,
  },
  injectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  injectBtnText: {
    fontSize: 11,
    color: '#A78BFA',
    fontWeight: '600',
  },
});

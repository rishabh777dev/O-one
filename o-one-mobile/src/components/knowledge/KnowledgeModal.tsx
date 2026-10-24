import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  X,
  Plus,
  BookOpen,
  FileText,
  Trash2,
  Save,
  Search,
  Check,
  Share2,
  FileCode,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useKnowledgeStore } from '../../store/useKnowledgeStore';
import { KnowledgeFile } from '../../types';

interface KnowledgeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ visible, onClose }) => {
  const { files, activeFile, setActiveFile, saveFile, deleteFile, initKnowledge } =
    useKnowledgeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingFileName, setEditingFileName] = useState('');
  const [editingFileDesc, setEditingFileDesc] = useState('');
  const [editingFileContent, setEditingFileContent] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (visible) {
      initKnowledge();
    }
  }, [visible]);

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectFile = (file: KnowledgeFile) => {
    setActiveFile(file);
    setEditingFileName(file.name);
    setEditingFileDesc(file.description || '');
    setEditingFileContent(file.content);
    setIsEditing(false);
    setIsCreatingNew(false);
  };

  const handleStartCreate = () => {
    setActiveFile(null);
    setEditingFileName('');
    setEditingFileDesc('');
    setEditingFileContent('');
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleStartEdit = () => {
    if (!activeFile) return;
    setEditingFileName(activeFile.name);
    setEditingFileDesc(activeFile.description || '');
    setEditingFileContent(activeFile.content);
    setIsCreatingNew(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmed = editingFileName.trim();
    if (!trimmed) {
      Alert.alert('Missing Name', 'Please provide a file name (e.g. guidelines.md)');
      return;
    }
    await saveFile(trimmed, editingFileContent, editingFileDesc);
    setIsEditing(false);
    setIsCreatingNew(false);
  };

  const handleDelete = (name: string) => {
    Alert.alert('Delete File', `Remove "${name}" from shared knowledge?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFile(name);
          if (activeFile?.name === name) {
            setActiveFile(null);
            setIsEditing(false);
            setIsCreatingNew(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <BookOpen size={18} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Shared Knowledge</Text>
                <Text style={styles.headerSub}>
                  Files accessible across all 3 servers & workspaces
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {!isEditing && (
                <TouchableOpacity
                  style={styles.actionPillBtn}
                  onPress={handleStartCreate}
                  activeOpacity={0.7}
                >
                  <Plus size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.actionPillText}>Add File</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={18} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body Content */}
          {isEditing ? (
            /* Edit / Create Form */
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>File Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. project-rules.md, schema.json"
                  placeholderTextColor="#71717A"
                  value={editingFileName}
                  onChangeText={setEditingFileName}
                  editable={isCreatingNew}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Shared guidelines and database config"
                  placeholderTextColor="#71717A"
                  value={editingFileDesc}
                  onChangeText={setEditingFileDesc}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>File Content (Markdown / Code / Text)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Paste or write documentation, prompts, code snippets, or rules..."
                  placeholderTextColor="#71717A"
                  value={editingFileContent}
                  onChangeText={setEditingFileContent}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setIsEditing(false);
                    setIsCreatingNew(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                  <Save size={16} color="#000000" strokeWidth={2.4} />
                  <Text style={styles.saveBtnText}>Save Knowledge</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : activeFile ? (
            /* File Viewer */
            <View style={styles.viewerContainer}>
              <View style={styles.viewerHeader}>
                <View style={styles.viewerTitleCol}>
                  <Text style={styles.viewerFileName}>{activeFile.name}</Text>
                  {activeFile.description ? (
                    <Text style={styles.viewerFileDesc}>{activeFile.description}</Text>
                  ) : null}
                  <Text style={styles.viewerMeta}>
                    {activeFile.size ? `${(activeFile.size / 1024).toFixed(1)} KB` : 'Doc'} ·
                    Updated {new Date(activeFile.updatedAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.viewerActions}>
                  <TouchableOpacity
                    style={styles.viewerActionBtn}
                    onPress={handleStartEdit}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewerActionText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewerDeleteBtn}
                    onPress={() => handleDelete(activeFile.name)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.viewerScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{activeFile.content || '(Empty file)'}</Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.backToListBtn}
                onPress={() => setActiveFile(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.backToListText}>← Back to All Files</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Knowledge Files List */
            <View style={styles.listContainer}>
              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Search size={15} color="#71717A" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search shared knowledge files..."
                  placeholderTextColor="#71717A"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={15} color="#71717A" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={styles.fileScroll} showsVerticalScrollIndicator={false}>
                {filteredFiles.length === 0 ? (
                  <View style={styles.emptyState}>
                    <BookOpen size={36} color="#3F3F46" />
                    <Text style={styles.emptyTitle}>No knowledge files found</Text>
                    <Text style={styles.emptySub}>
                      Add shared reference files (prompts, rules, schemas) accessible by all
                      workspaces.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyAddBtn}
                      onPress={handleStartCreate}
                      activeOpacity={0.8}
                    >
                      <Plus size={16} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.emptyAddBtnText}>Create First File</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  filteredFiles.map((file) => (
                    <TouchableOpacity
                      key={file.id}
                      style={styles.fileCard}
                      onPress={() => handleSelectFile(file)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fileIconBox}>
                        {file.name.endsWith('.json') ? (
                          <FileCode size={20} color="#F59E0B" />
                        ) : (
                          <FileText size={20} color="#3B82F6" />
                        )}
                      </View>

                      <View style={styles.fileInfoCol}>
                        <Text style={styles.fileNameText} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileDescText} numberOfLines={1}>
                          {file.description || file.content.replace(/\n+/g, ' ').slice(0, 60)}
                        </Text>
                        <Text style={styles.fileSizeText}>
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Text file'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.fileDeleteBtn}
                        onPress={() => handleDelete(file.name)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color="#71717A" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121215',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '84%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A20',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  fileScroll: {
    flex: 1,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfoCol: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fileDescText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  fileSizeText: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  fileDeleteBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E4E4E7',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    marginTop: 18,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  formScroll: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1A1A20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  textArea: {
    minHeight: 180,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  viewerContainer: {
    flex: 1,
    padding: 16,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewerTitleCol: {
    flex: 1,
  },
  viewerFileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewerFileDesc: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  viewerMeta: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 3,
  },
  viewerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerActionBtn: {
    backgroundColor: '#27272A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewerActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewerDeleteBtn: {
    padding: 6,
  },
  viewerScroll: {
    flex: 1,
    backgroundColor: '#16161A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  codeBlock: {
    padding: 14,
  },
  codeText: {
    color: '#E4E4E7',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  backToListBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backToListText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  FolderGit2,
  Play,
  Grid,
  Plus,
  Check,
  Terminal,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { HostCard } from './HostCard';
import { Agent } from '../../types';

const { width } = Dimensions.get('window');
const SHEET_WIDTH = Math.min(width * 0.82, 320);

export const NavigationDrawer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    isDrawerOpen,
    closeDrawer,
    currentSurface,
    activeAgent,
    activeProject,
    setActiveAgent,
    setActiveProject,
    setSurface,
    agents,
    projects,
    deleteAgent,
    addProject,
  } = useAppStore();

  const [modalVisible, setModalVisible] = useState(isDrawerOpen);

  // Animation values: slide strictly from the LEFT edge
  const slideAnim = useRef(new Animated.Value(-SHEET_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Add Project Modal state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (isDrawerOpen) {
      setModalVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SHEET_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [isDrawerOpen]);

  const handleClose = () => {
    closeDrawer();
  };

  const handleSelectAgent = (agent: Agent) => {
    setActiveAgent(agent);
  };

  const handleOpenBuilder = () => {
    setSurface('builder');
  };

  const handleSelectProject = (project: string) => {
    setActiveProject(project);
  };

  const handleSelectTerminal = () => {
    setSurface('terminal');
  };

  const handleSelectWorkflows = () => {
    setSurface('workflows');
  };

  const handleSelectMarketplace = () => {
    setSurface('marketplace');
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    addProject(newProjectName.trim().toLowerCase());
    setNewProjectName('');
    setShowAddProjectModal(false);
  };

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer}>
        {/* Dim Backdrop (Tapping closes drawer) */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Slide Sheet Strictly From Left */}
        <Animated.View
          style={[
            styles.sheet,
            {
              width: SHEET_WIDTH,
              transform: [{ translateX: slideAnim }],
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          {/* Drawer Top Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.titleBadge} />
              <Text style={styles.headerTitle}>O1 Flight Controller</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Navigation Scroll View */}
          <ScrollView
            style={styles.upperScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Custom Autonomous Agents (Blank Slate Ready) */}
            <View style={styles.groupContainer}>
              <View style={styles.groupLabelRow}>
                <Text style={styles.groupLabel}>Autonomous Agents ({agents.length})</Text>
                <TouchableOpacity
                  onPress={handleOpenBuilder}
                  style={styles.plusPill}
                  activeOpacity={0.7}
                >
                  <Plus size={11} color={colors.hermesOrange} />
                  <Text style={styles.groupAction}>New Agent</Text>
                </TouchableOpacity>
              </View>

              {agents.length === 0 ? (
                <TouchableOpacity
                  style={styles.blankSlateCard}
                  onPress={handleOpenBuilder}
                  activeOpacity={0.7}
                >
                  <Sparkles size={16} color={colors.hermesOrange} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.blankSlateTitle}>No Agents Created Yet</Text>
                    <Text style={styles.blankSlateSub}>Tap here to build your first agent</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                agents.map((agent) => {
                  const isActive =
                    currentSurface === 'cockpit' && activeAgent && activeAgent.id === agent.id;
                  return (
                    <TouchableOpacity
                      key={agent.id}
                      style={[styles.pillItem, isActive && styles.pillItemActive]}
                      onPress={() => handleSelectAgent(agent)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemLeft}>
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor:
                                agent.status === 'ready'
                                  ? colors.accentEmerald
                                  : colors.textMuted,
                            },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.itemTitle, isActive && styles.itemTitleActive]}
                            numberOfLines={1}
                          >
                            {agent.name}
                          </Text>
                          <Text style={styles.itemRoleText} numberOfLines={1}>
                            {agent.engineLabel} · {agent.model}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemRightRow}>
                        {isActive ? (
                          <Check size={14} color={colors.accentEmerald} />
                        ) : null}
                        <TouchableOpacity
                          onPress={() => deleteAgent(agent.id)}
                          style={styles.deleteBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={12} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* 2. Tools & Shells (Real Linux Kernel & MCP) */}
            <View style={styles.groupContainer}>
              <View style={styles.groupLabelRow}>
                <Text style={styles.groupLabel}>Kernel, MCP & Tools</Text>
              </View>

              {/* Linux Terminal Item */}
              <TouchableOpacity
                style={[styles.pillItem, currentSurface === 'terminal' && styles.pillItemActive]}
                onPress={handleSelectTerminal}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <Terminal
                    size={15}
                    color={currentSurface === 'terminal' ? colors.accentEmerald : '#9CA3AF'}
                    strokeWidth={2}
                  />
                  <View>
                    <Text
                      style={[
                        styles.itemTitle,
                        currentSurface === 'terminal' && styles.itemTitleActive,
                      ]}
                    >
                      Linux Kernel & CLI
                    </Text>
                    <Text style={styles.itemRoleText}>Ubuntu 24.04 WSL2 · Bash / PS</Text>
                  </View>
                </View>
                <Text style={[styles.itemSubText, { color: colors.accentEmerald }]}>Ready</Text>
              </TouchableOpacity>

              {/* MCP Hub Item */}
              <TouchableOpacity
                style={[
                  styles.pillItem,
                  currentSurface === 'marketplace' && styles.pillItemActive,
                ]}
                onPress={handleSelectMarketplace}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <Grid
                    size={15}
                    color={currentSurface === 'marketplace' ? colors.hermesOrange : '#9CA3AF'}
                    strokeWidth={2}
                  />
                  <View>
                    <Text
                      style={[
                        styles.itemTitle,
                        currentSurface === 'marketplace' && styles.itemTitleActive,
                      ]}
                    >
                      MCP Hub & Connectors
                    </Text>
                    <Text style={styles.itemRoleText}>Connect any stdio or SSE server</Text>
                  </View>
                </View>
                <Text style={styles.itemSubText}>68+ Tools</Text>
              </TouchableOpacity>

              {/* Visual Workflows Item */}
              <TouchableOpacity
                style={[styles.pillItem, currentSurface === 'workflows' && styles.pillItemActive]}
                onPress={handleSelectWorkflows}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <Play
                    size={14}
                    color={currentSurface === 'workflows' ? colors.accentEmerald : '#9CA3AF'}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.itemTitle,
                      currentSurface === 'workflows' && styles.itemTitleActive,
                    ]}
                  >
                    Visual Workflows
                  </Text>
                </View>
                <Text style={[styles.itemSubText, { color: colors.accentEmerald }]}>Active</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Projects & Workspaces */}
            <View style={styles.groupContainer}>
              <View style={styles.groupLabelRow}>
                <Text style={styles.groupLabel}>Workspaces & Repos</Text>
                <TouchableOpacity
                  onPress={() => setShowAddProjectModal(true)}
                  style={styles.plusPill}
                  activeOpacity={0.7}
                >
                  <Plus size={11} color={colors.hermesOrange} />
                  <Text style={styles.groupAction}>Add</Text>
                </TouchableOpacity>
              </View>

              {projects.map((project) => {
                const isActive = currentSurface === 'ide' && activeProject === project;
                return (
                  <TouchableOpacity
                    key={project}
                    style={[styles.pillItem, isActive && styles.pillItemActive]}
                    onPress={() => handleSelectProject(project)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      <FolderGit2
                        size={15}
                        color={isActive ? '#60A5FA' : '#9CA3AF'}
                        strokeWidth={2}
                      />
                      <Text
                        style={[styles.itemTitle, isActive && styles.itemTitleActive]}
                        numberOfLines={1}
                      >
                        {project}
                      </Text>
                    </View>
                    {isActive ? (
                      <Check size={14} color="#60A5FA" />
                    ) : (
                      <Text style={styles.itemSubText}>main</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Lower Section: Real Host Manager */}
          <View style={styles.lowerSection}>
            <HostCard />
          </View>
        </Animated.View>

        {/* Right side outside touchable area to dismiss */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={[styles.outsideDismiss, { left: SHEET_WIDTH }]} />
        </TouchableWithoutFeedback>
      </View>

      {/* Add Project Modal */}
      <Modal visible={showAddProjectModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Project Workspace</Text>
            <Text style={styles.modalSubtitle}>Link folder on your host machine / Azure VM</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Project Name / Path (e.g. cadence)"
              placeholderTextColor={colors.textMuted}
              value={newProjectName}
              onChangeText={setNewProjectName}
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalPrimary}
                onPress={handleCreateProject}
                activeOpacity={0.8}
              >
                <Text style={styles.btnModalPrimaryText}>Add Project</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setShowAddProjectModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  backdropTouch: {
    flex: 1,
  },
  outsideDismiss: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#18181B',
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
    flexDirection: 'column',
    elevation: 20,
    zIndex: 1000,
  },
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.hermesOrange,
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgCircleBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upperScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
  },
  groupContainer: {
    marginBottom: 18,
  },
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  groupLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    fontWeight: '600',
  },
  plusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  groupAction: {
    fontSize: 11,
    color: colors.hermesOrange,
    fontWeight: '600',
  },
  blankSlateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderRadius: 16,
  },
  blankSlateTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  blankSlateSub: {
    fontSize: 10.5,
    color: colors.hermesOrange,
    marginTop: 2,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    marginBottom: 6,
  },
  pillItemActive: {
    backgroundColor: '#27272D',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  itemTitleActive: {
    color: '#FFFFFF',
  },
  itemRoleText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
    fontFamily: 'monospace',
  },
  itemRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemSubText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  deleteBtn: {
    padding: 4,
  },
  lowerSection: {
    padding: 12,
    backgroundColor: '#131315',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  modalInput: {
    height: 42,
    backgroundColor: colors.bgCardInner,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInner,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btnModalPrimary: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    backgroundColor: colors.btnPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnModalPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.btnPrimaryText,
  },
  btnModalCancel: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    backgroundColor: colors.bgCardInner,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnModalCancelText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

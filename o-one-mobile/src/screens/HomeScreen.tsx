import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  Layers,
  Search,
  MoreVertical,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Terminal,
  FolderGit2,
  Folder,
  Hash,
  X,
  ArrowRight,
  Bot,
} from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useAgentStore } from '../store/useAgentStore';
import { CreatureAvatar } from '../components/common/CreatureAvatar';
import { CreateAgentModal } from '../components/common/CreateAgentModal';
import { BrandLogo } from '../components/common/BrandLogo';
import { Agent, ProjectItem } from '../types';

export const HomeScreen: React.FC = () => {
  const {
    setActiveAgent,
    openDrawer,
    getAgentsForActiveServer,
    getProjectsForActiveServer,
    openProject,
    addNewProject,
    openAgentById,
    openTerminalWithCommand,
    activeServerId,
    servers,
  } = useAppStore();
  const { messages } = useAgentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOpenByIdModal, setShowOpenByIdModal] = useState(false);
  const [lookupIdInput, setLookupIdInput] = useState('');
  const [sectionMenuAnchor, setSectionMenuAnchor] = useState<'projects' | 'agents' | null>(null);

  // Accordion toggle states (Agents at top, Projects at bottom)
  const [agentsListOpen, setAgentsListOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);

  // Active workspace metadata
  const currentServer = servers.find((s) => s.id === activeServerId) || servers[0];
  const workspaceProjects = getProjectsForActiveServer();
  const workspaceAgents = getAgentsForActiveServer();

  // Filter agents by search query
  const filteredAgents = workspaceAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter projects by search query
  const filteredProjects = workspaceProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAgent = (agent: Agent) => {
    setActiveAgent(agent);
  };

  const handleOpenById = () => {
    const query = lookupIdInput.trim();
    if (!query) {
      Alert.alert('Empty Input', 'Please enter a Project ID (e.g. prj-my-app) or Agent ID (e.g. agent-1).');
      return;
    }

    // Try matching agent ID first
    const agentOpened = openAgentById(query);
    if (agentOpened) {
      setShowOpenByIdModal(false);
      setLookupIdInput('');
      return;
    }

    // Try matching existing project ID
    const foundProject = workspaceProjects.find(
      (p) => p.id.toLowerCase() === query.toLowerCase() || p.name.toLowerCase() === query.toLowerCase()
    );
    if (foundProject) {
      openProject(foundProject.id, false);
      setShowOpenByIdModal(false);
      setLookupIdInput('');
      return;
    }

    // Allow user to register and add this project to the workspace cleanly
    Alert.alert(
      'Register New Project',
      `No existing project or agent found with ID "${query}". Would you like to register this project in the workspace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register Project',
          onPress: () => {
            const cleanId = query.startsWith('prj-') ? query : `prj-${query.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            const cleanName = query.replace(/^prj-/, '');
            const newProj: ProjectItem = {
              id: cleanId,
              name: cleanName,
              path: `/workspace/${cleanName}`,
              hasGit: false,
              branch: 'main',
              serverId: activeServerId,
              lastActive: 'Just now',
            };
            addNewProject(newProj);
            openProject(newProj.id, false);
            setShowOpenByIdModal(false);
            setLookupIdInput('');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header (Matching dense_041) */}
      <View style={styles.header}>
        {/* Left Stacked Layers Icon (Opens Workspace / Servers Drawer) */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={openDrawer}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Layers size={22} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Center Brand Logo (O creature face + one) */}
        <BrandLogo size={20} fontSize={17} />

        {/* Right Action Icons: Search & 3-Dots */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowSearchInput(!showSearchInput)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Search size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Input Bar */}
      {showSearchInput && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Search size={15} color="#71717A" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects, IDs, or agents..."
              placeholderTextColor="#71717A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color="#71717A" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Main Scroll View */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Workspace Banner with Direct Terminal Shortcut */}
        <View style={styles.workspaceBanner}>
          <View
            style={[
              styles.workspaceDot,
              { backgroundColor: currentServer?.color || colors.accentEmerald },
            ]}
          />
          <Text style={styles.workspaceBannerText}>
            Workspace: <Text style={styles.workspaceBannerBold}>{currentServer?.name || 'Local'}</Text>
          </Text>

          <View style={styles.workspaceBannerActions}>
            <TouchableOpacity
              style={styles.terminalShellBtn}
              onPress={() => openTerminalWithCommand('', currentServer?.type === 'phone' ? 'phone' : 'wsl')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Terminal size={12} color="#10B981" strokeWidth={2.4} />
              <Text style={styles.terminalShellBtnText}>Terminal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.openByIdBadgeBtn}
              onPress={() => setShowOpenByIdModal(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Hash size={12} color="#38BDF8" strokeWidth={2.4} />
              <Text style={styles.openByIdBadgeText}>Open by ID</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* Accordion 1 (TOP): Agents (Workspace-isolated agents)           */}
        {/* ============================================================== */}
        <View style={styles.accordionGroup}>
          <View style={styles.accordionHeaderRow}>
            <TouchableOpacity
              style={styles.accordionTitleTouch}
              onPress={() => setAgentsListOpen(!agentsListOpen)}
              activeOpacity={0.7}
            >
              {agentsListOpen ? (
                <ChevronDown size={14} color="#71717A" />
              ) : (
                <ChevronRight size={14} color="#71717A" />
              )}
              <Text style={styles.accordionTitle}>Agents</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredAgents.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setSectionMenuAnchor('agents')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreHorizontal size={18} color="#71717A" />
            </TouchableOpacity>
          </View>

          {agentsListOpen && (
            <View>
              {filteredAgents.length === 0 ? (
                /* Blank Slate Card */
                <TouchableOpacity
                  style={styles.blankSlateCard}
                  onPress={() => setShowCreateModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.blankIconCircle}>
                    <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.blankTitle}>Add an agent to this workspace</Text>
                  <Text style={styles.blankSub}>
                    Configure its avatar, model engine, and instructions.
                  </Text>
                </TouchableOpacity>
              ) : (
                filteredAgents.map((agent) => {
                  const msgs = messages[agent.id] || [];
                  const lastMsg =
                    msgs.length > 0
                      ? msgs[msgs.length - 1].content.replace(/\n+/g, ' ')
                      : agent.instructions || 'Ready for instructions';
                  const dateText =
                    msgs.length > 0
                      ? msgs[msgs.length - 1].timestamp || 'Today'
                      : 'Today';

                  return (
                    <TouchableOpacity
                      key={agent.id}
                      style={styles.agentRow}
                      onPress={() => handleSelectAgent(agent)}
                      activeOpacity={0.7}
                    >
                      <CreatureAvatar
                        shapeIndex={agent.avatarShape ?? 0}
                        color={agent.avatarColor ?? '#2563EB'}
                        size={44}
                        showGlow={false}
                      />
                      <View style={styles.agentInfoCol}>
                        <View style={styles.agentHeaderNameRow}>
                          <Text style={styles.agentName}>{agent.name}</Text>
                          <View style={styles.agentIdBadge}>
                            <Text style={styles.agentIdBadgeText}>{agent.id}</Text>
                          </View>
                        </View>
                        {agent.role ? (
                          <Text style={styles.agentRole} numberOfLines={1}>
                            {agent.role}
                          </Text>
                        ) : null}
                        <Text style={styles.agentLastMsg} numberOfLines={1}>
                          {lastMsg}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>{dateText}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* ============================================================== */}
        {/* Accordion 2 (BOTTOM): Projects (Under agents)                  */}
        {/* ============================================================== */}
        <View style={styles.accordionGroup}>
          <View style={styles.accordionHeaderRow}>
            <TouchableOpacity
              style={styles.accordionTitleTouch}
              onPress={() => setProjectsOpen(!projectsOpen)}
              activeOpacity={0.7}
            >
              {projectsOpen ? (
                <ChevronDown size={14} color="#71717A" />
              ) : (
                <ChevronRight size={14} color="#71717A" />
              )}
              <Text style={styles.accordionTitle}>Projects</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredProjects.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setSectionMenuAnchor('projects')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreHorizontal size={18} color="#71717A" />
            </TouchableOpacity>
          </View>

          {projectsOpen && (
            <View style={styles.projectListWrap}>
              {filteredProjects.length === 0 ? (
                <TouchableOpacity
                  style={styles.blankSlateCard}
                  onPress={() => setShowOpenByIdModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.blankIconCircle}>
                    <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.blankTitle}>No Projects in Workspace</Text>
                  <Text style={styles.blankSub}>Tap to open or register a project by Project ID.</Text>
                </TouchableOpacity>
              ) : (
                filteredProjects.map((project: ProjectItem) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.projectRow}
                    onPress={() => openProject(project.id, false)}
                    activeOpacity={0.75}
                  >
                    {/* Project Folder / Git Icon */}
                    <View style={styles.projectIconBox}>
                      {project.hasGit ? (
                        <FolderGit2 size={20} color="#10B981" strokeWidth={2} />
                      ) : (
                        <Folder size={20} color="#3B82F6" strokeWidth={2} />
                      )}
                    </View>

                    {/* Project Details */}
                    <View style={styles.projectInfoCol}>
                      <View style={styles.projectNameRow}>
                        <Text style={styles.projectName} numberOfLines={1}>
                          {project.name}
                        </Text>
                        <View style={styles.idChip}>
                          <Text style={styles.idChipText}>{project.id}</Text>
                        </View>
                      </View>

                      <View style={styles.projectMetaRow}>
                        {project.branch ? (
                          <Text style={styles.branchText}> {project.branch}</Text>
                        ) : null}
                        <Text style={styles.projectPathText} numberOfLines={1}>
                          {project.path}
                        </Text>
                      </View>
                    </View>

                    {/* Right Action: Dedicated Interactive Terminal Button */}
                    <TouchableOpacity
                      style={styles.terminalActionBtn}
                      onPress={() => openProject(project.id, true)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={`Open terminal for ${project.name}`}
                    >
                      <Terminal size={17} color="#38BDF8" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Agent Creator Modal */}
      <CreateAgentModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Open by ID Modal (Clean and simple dialog) */}
      <Modal
        visible={showOpenByIdModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOpenByIdModal(false)}
      >
        <TouchableOpacity
          style={styles.popupBackdrop}
          activeOpacity={1}
          onPress={() => setShowOpenByIdModal(false)}
        >
          <View style={styles.openByIdModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.openByIdHeader}>
              <View style={styles.openByIdIcon}>
                <Hash size={18} color="#38BDF8" strokeWidth={2.4} />
              </View>
              <Text style={styles.openByIdTitle}>Open by ID</Text>
            </View>
            <Text style={styles.openByIdSub}>
              Enter a Project ID (e.g. prj-o-one) or Agent ID (e.g. agent-1) to jump directly into
              it.
            </Text>

            <TextInput
              style={styles.openByIdInput}
              placeholder="e.g. prj-o-one or agent-1"
              placeholderTextColor="#71717A"
              value={lookupIdInput}
              onChangeText={setLookupIdInput}
              autoFocus
              onSubmitEditing={handleOpenById}
            />

            <View style={styles.openByIdActionRow}>
              <TouchableOpacity
                style={styles.openByIdCancelBtn}
                onPress={() => setShowOpenByIdModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.openByIdCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.openByIdSubmitBtn}
                onPress={handleOpenById}
                activeOpacity={0.8}
              >
                <Text style={styles.openByIdSubmitText}>Open</Text>
                <ArrowRight size={15} color="#000000" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Section 3-Dots Action Popup */}
      <Modal
        visible={sectionMenuAnchor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSectionMenuAnchor(null)}
      >
        <TouchableOpacity
          style={styles.popupBackdrop}
          activeOpacity={1}
          onPress={() => setSectionMenuAnchor(null)}
        >
          <View style={styles.popupCard}>
            <TouchableOpacity
              style={styles.popupItem}
              onPress={() => {
                setSectionMenuAnchor(null);
                setShowCreateModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.popupItemText}>Add Agent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.popupItem}
              onPress={() => {
                setSectionMenuAnchor(null);
                setShowOpenByIdModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.popupItemText}>Open Project / Agent by ID</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.popupItem, { borderBottomWidth: 0 }]}
              onPress={() => setSectionMenuAnchor(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.popupItemTextMuted}>Refresh Workspace</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0E',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBtn: {
    padding: 6,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#121215',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A20',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  workspaceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  workspaceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  workspaceBannerText: {
    fontSize: 12,
    color: '#A1A1AA',
    flex: 1,
  },
  workspaceBannerBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workspaceBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  terminalShellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  terminalShellBtnText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  openByIdBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openByIdBadgeText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  accordionGroup: {
    marginBottom: 20,
  },
  accordionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  accordionTitleTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E4E4E7',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#27272A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  moreBtn: {
    padding: 4,
  },
  projectListWrap: {
    gap: 8,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151518',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  projectIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectInfoCol: {
    flex: 1,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  idChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idChipText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: '#A1A1AA',
  },
  projectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  branchText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  projectPathText: {
    fontSize: 11,
    color: '#71717A',
    flex: 1,
  },
  terminalActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  agentInfoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  agentHeaderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agentName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  agentIdBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  agentIdBadgeText: {
    fontSize: 10,
    color: '#60A5FA',
    fontFamily: 'monospace',
  },
  agentRole: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 1,
  },
  agentLastMsg: {
    fontSize: 12.5,
    color: '#71717A',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11.5,
    color: '#52525B',
    marginLeft: 8,
  },
  blankSlateCard: {
    backgroundColor: '#16161A',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  blankIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  blankTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  blankSub: {
    fontSize: 11.5,
    color: '#71717A',
    textAlign: 'center',
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    backgroundColor: '#1C1C20',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '80%',
    overflow: 'hidden',
  },
  popupItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  popupItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popupItemTextMuted: {
    fontSize: 14,
    color: '#71717A',
  },
  openByIdModalCard: {
    backgroundColor: '#18181C',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  openByIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  openByIdIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openByIdTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  openByIdSub: {
    fontSize: 12,
    color: '#A1A1AA',
    marginBottom: 14,
    lineHeight: 17,
  },
  openByIdInput: {
    backgroundColor: '#121215',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  openByIdActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  openByIdCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openByIdCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  openByIdSubmitBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openByIdSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  Layers,
  Search,
  MoreVertical,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  Check,
  X,
} from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useAgentStore } from '../store/useAgentStore';
import { CreatureAvatar } from '../components/common/CreatureAvatar';
import { CreateAgentModal } from '../components/common/CreateAgentModal';
import { BrandLogo } from '../components/common/BrandLogo';
import { Agent } from '../types';

export const HomeScreen: React.FC = () => {
  const { agents, setActiveAgent, openDrawer } = useAppStore();
  const { messages } = useAgentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sectionMenuAnchor, setSectionMenuAnchor] = useState<'cloud' | 'custom' | null>(null);

  // Accordion toggle states (OpenBot has both open by default)
  const [cloudAgentOpen, setCloudAgentOpen] = useState(true);
  const [agentsListOpen, setAgentsListOpen] = useState(true);

  // Filter agents by search query
  const filteredAgents = agents.filter(
    (a) =>
      !a.isCloudAgent &&
      (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cloudAgent = agents.find((a) => a.isCloudAgent);

  const handleSelectAgent = (agent: Agent) => {
    setActiveAgent(agent);
  };

  return (
    <View style={styles.container}>
      {/* Top Header (Matching dense_041) */}
      <View style={styles.header}>
        {/* Left Stacked Layers Icon (Opens Servers Drawer) */}
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
              placeholder="Search agents or conversations..."
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

      {/* Main Agent List Scroll View */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Blank Slate Welcome Hero if no agents exist yet */}
        {agents.length === 0 ? (
          <View style={styles.heroBlankCard}>
            <View style={styles.heroAvatarWrap}>
              <CreatureAvatar shapeIndex={0} color="#2563EB" size={80} showGlow={true} />
            </View>
            <Text style={styles.heroBlankTitle}>Welcome to O one</Text>
            <Text style={styles.heroBlankSub}>
              You have a blank slate. Create your first autonomous agent and configure its creature
              avatar, LLM engine (Hermes 3, Codex, Claude, DeepSeek, Antigravity), and instructions.
            </Text>
            <TouchableOpacity
              style={styles.heroCreateBtn}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.heroCreateBtnText}>Create Agent</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Accordion 1: Cloud Agent (Matching dense_041) */}
            <View style={styles.accordionGroup}>
          <View style={styles.accordionHeaderRow}>
            <TouchableOpacity
              style={styles.accordionTitleTouch}
              onPress={() => setCloudAgentOpen(!cloudAgentOpen)}
              activeOpacity={0.7}
            >
              {cloudAgentOpen ? (
                <ChevronDown size={14} color="#71717A" />
              ) : (
                <ChevronRight size={14} color="#71717A" />
              )}
              <Text style={styles.accordionTitle}>Cloud Agent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setSectionMenuAnchor('cloud')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreHorizontal size={18} color="#71717A" />
            </TouchableOpacity>
          </View>

          {cloudAgentOpen && (
            cloudAgent ? (() => {
              const rogerMsgs = messages[cloudAgent.id] || [];
              const rogerLastMsg = rogerMsgs.length > 0
                ? rogerMsgs[rogerMsgs.length - 1].content.replace(/\n+/g, ' ')
                : 'Hi!';
              const rogerDate = rogerMsgs.length > 0
                ? (rogerMsgs[rogerMsgs.length - 1].timestamp || '20 Oct')
                : '20 Oct';

              return (
                <TouchableOpacity
                  style={styles.agentRow}
                  onPress={() => handleSelectAgent(cloudAgent)}
                  activeOpacity={0.7}
                >
                  <CreatureAvatar
                    shapeIndex={cloudAgent.avatarShape ?? 6}
                    color={cloudAgent.avatarColor ?? '#EA580C'}
                    size={44}
                    showGlow={false}
                  />
                  <View style={styles.agentInfoCol}>
                    <Text style={styles.agentName}>{cloudAgent.name}</Text>
                    <Text style={styles.agentLastMsg} numberOfLines={1}>
                      {rogerLastMsg}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{rogerDate}</Text>
                </TouchableOpacity>
              );
            })() : (
              <TouchableOpacity
                style={styles.blankSlateCard}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.blankIconCircle}>
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <Text style={styles.blankTitle}>No Cloud Agent Deployed</Text>
                <Text style={styles.blankSub}>Tap to configure an agent on this server.</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Accordion 2: Agents (Matching dense_041) */}
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
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setSectionMenuAnchor('custom')}
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
                  <Text style={styles.blankTitle}>Add your first agent</Text>
                  <Text style={styles.blankSub}>
                    Configure its creature avatar, model engine, and instructions.
                  </Text>
                </TouchableOpacity>
              ) : (
                filteredAgents.map((agent) => {
                  const msgs = messages[agent.id] || [];
                  const lastMsg = msgs.length > 0
                    ? msgs[msgs.length - 1].content.replace(/\n+/g, ' ')
                    : (agent.instructions || 'No messages yet');
                  const dateText = msgs.length > 0
                    ? (msgs[msgs.length - 1].timestamp || '19 Oct')
                    : '19 Oct';

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
                        <Text style={styles.agentName}>{agent.name}</Text>
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
      </>
    )}
  </ScrollView>

      {/* Agent Creator Modal */}
      <CreateAgentModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Section 3-Dots Action Popup (Matching dense_053) */}
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
              <Text style={styles.popupItemText}>Add agent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.popupItem}
              onPress={() => {
                setSectionMenuAnchor(null);
                setShowCreateModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.popupItemText}>New section</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.popupItem, { borderBottomWidth: 0 }]}
              onPress={() => setSectionMenuAnchor(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.popupItemTextMuted}>Mark all as read</Text>
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
  moreBtn: {
    padding: 4,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  agentInfoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  agentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  agentRole: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  agentLastMsg: {
    fontSize: 13,
    color: '#71717A',
  },
  dateText: {
    fontSize: 12,
    color: '#71717A',
    marginLeft: 10,
    alignSelf: 'flex-start',
    paddingTop: 4,
  },
  heroBlankCard: {
    alignItems: 'center',
    backgroundColor: '#16161A',
    borderRadius: 20,
    padding: 30,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroAvatarWrap: {
    marginBottom: 16,
  },
  heroBlankTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroBlankSub: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  heroCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  blankSlateCard: {
    alignItems: 'center',
    backgroundColor: '#141418',
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blankIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#272730',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  blankTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  blankSub: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 16,
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  popupCard: {
    width: 170,
    backgroundColor: '#242429',
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  popupItem: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  popupItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popupItemTextMuted: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#71717A',
  },
});

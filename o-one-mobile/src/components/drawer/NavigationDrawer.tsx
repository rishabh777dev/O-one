import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { X, FolderGit2, Play, Grid } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAppStore, initialAgents } from '../../store/useAppStore';
import { HostCard } from './HostCard';
import { Agent } from '../../types';

const { width } = Dimensions.get('window');

export const NavigationDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    closeDrawer,
    currentSurface,
    activeAgent,
    activeProject,
    setActiveAgent,
    setActiveProject,
    setSurface,
  } = useAppStore();

  if (!isDrawerOpen) return null;

  const handleSelectAgent = (agent: Agent) => {
    setActiveAgent(agent);
  };

  const handleSelectProject = (project: string) => {
    setActiveProject(project);
  };

  const handleSelectWorkflows = () => {
    setSurface('workflows');
  };

  const handleSelectMarketplace = () => {
    setSurface('marketplace');
  };

  return (
    <Modal
      visible={isDrawerOpen}
      transparent
      animationType="fade"
      onRequestClose={closeDrawer}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch to close */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={closeDrawer}
          activeOpacity={1}
        />

        {/* Slide Sheet */}
        <View style={styles.sheet}>
          {/* Drawer Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>O1 Flight Controller</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closeDrawer}
              activeOpacity={0.7}
            >
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Upper Section: Nav Groups */}
          <ScrollView
            style={styles.upperScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Agents Group */}
            <View style={styles.groupContainer}>
              <View style={styles.groupLabelRow}>
                <Text style={styles.groupLabel}>Agents</Text>
                <TouchableOpacity onPress={() => alert('Create new specialized agent...')}>
                  <Text style={styles.groupAction}>+ New</Text>
                </TouchableOpacity>
              </View>

              {initialAgents.map((agent) => {
                const isActive =
                  currentSurface === 'cockpit' && activeAgent.id === agent.id;
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
                      <Text style={styles.itemTitle}>{agent.name}</Text>
                    </View>
                    <Text style={styles.itemSubText}>
                      {agent.status === 'ready' ? 'Active' : 'Idle'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Projects & Workspaces */}
            <View style={styles.groupContainer}>
              <View style={styles.groupLabelRow}>
                <Text style={styles.groupLabel}>Projects & Workspaces</Text>
                <TouchableOpacity
                  onPress={() => alert('Clone repo from GitHub or attach Azure VM path...')}
                >
                  <Text style={styles.groupAction}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {['cadence', 'o-one', 'stripe-gateway'].map((project) => {
                const isActive =
                  currentSurface === 'ide' && activeProject === project;
                return (
                  <TouchableOpacity
                    key={project}
                    style={[styles.pillItem, isActive && styles.pillItemActive]}
                    onPress={() => handleSelectProject(project)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      <FolderGit2 size={14} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.itemTitle}>{project}</Text>
                    </View>
                    <Text style={styles.itemSubText}>main</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Tools & Automation */}
            <View style={styles.groupContainer}>
              <View style={styles.groupLabelRow}>
                <Text style={styles.groupLabel}>Tools & Automation</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.pillItem,
                  currentSurface === 'workflows' && styles.pillItemActive,
                ]}
                onPress={handleSelectWorkflows}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <Play size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.itemTitle}>Visual Workflows</Text>
                </View>
                <Text style={[styles.itemSubText, { color: colors.accentEmerald }]}>
                  2 Active
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pillItem,
                  currentSurface === 'marketplace' && styles.pillItemActive,
                ]}
                onPress={handleSelectMarketplace}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <Grid size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.itemTitle}>MCP Marketplace</Text>
                </View>
                <Text style={styles.itemSubText}>3 Ready</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Lower Section: Collapsible Host Manager */}
          <View style={styles.lowerSection}>
            <HostCard />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    width: Math.min(width * 0.82, 330),
    backgroundColor: '#18181B',
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCircleBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upperScroll: {
    flex: 1,
    padding: 16,
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  groupAction: {
    fontSize: 12,
    color: colors.hermesOrange,
    fontWeight: '500',
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
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
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemSubText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  lowerSection: {
    padding: 14,
    backgroundColor: '#131315',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});

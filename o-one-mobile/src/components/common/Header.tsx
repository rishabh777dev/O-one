import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu, Monitor } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';

export const Header: React.FC = () => {
  const {
    currentSurface,
    activeAgent,
    activeProject,
    openDrawer,
    toggleHostExpanded,
    isHostExpanded,
  } = useAppStore();

  const isIDE = currentSurface === 'ide';
  const isTerminal = currentSurface === 'terminal';
  const isWorkflows = currentSurface === 'workflows';
  const isMarketplace = currentSurface === 'marketplace';
  const isBuilder = currentSurface === 'builder' || !activeAgent;

  let title = activeAgent ? activeAgent.name : 'Create Agent';
  let statusText = activeAgent ? `${activeAgent.engineLabel} · Ready` : 'Blank Slate';

  if (isBuilder) {
    title = 'Agent Studio';
    statusText = 'Blank Slate · Build Engine';
  } else if (isTerminal) {
    title = 'Linux Shell';
    statusText = 'Ubuntu 24.04 WSL2 Active';
  } else if (isIDE) {
    title = `${activeProject} (IDE)`;
    statusText = 'Workspace Synced';
  } else if (isWorkflows) {
    title = 'Visual Workflows';
    statusText = 'Pipelines & Triggers';
  } else if (isMarketplace) {
    title = 'MCP Hub';
    statusText = '68+ Tools & Connectors';
  }

  const handleOpenHost = () => {
    openDrawer();
    if (!isHostExpanded) {
      toggleHostExpanded();
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left Slider / Drawer Trigger Button */}
      <TouchableOpacity
        style={styles.circleBtn}
        onPress={openDrawer}
        activeOpacity={0.7}
        accessibilityLabel="Open Navigation Drawer"
      >
        <Menu size={18} color="#FFFFFF" strokeWidth={2.2} />
      </TouchableOpacity>

      {/* Center Surface Pill */}
      <TouchableOpacity
        style={styles.centerPill}
        onPress={openDrawer}
        activeOpacity={0.8}
        accessibilityLabel="Switch Agent or Destination"
      >
        <View style={styles.nousBadge}>
          <View style={styles.nousDot} />
          <View style={styles.nousDot} />
        </View>

        <View style={styles.titleColumn}>
          <Text style={styles.agentTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Desktop / Host Toggle Button */}
      <TouchableOpacity
        style={styles.circleBtn}
        onPress={handleOpenHost}
        activeOpacity={0.7}
        accessibilityLabel="Host Connection Manager"
      >
        <Monitor size={17} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgScreen,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 30,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgCircleBtn,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
    maxWidth: '65%',
  },
  nousBadge: {
    flexDirection: 'row',
    gap: 2.5,
  },
  nousDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hermesOrange,
  },
  titleColumn: {
    alignItems: 'flex-start',
  },
  agentTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accentEmerald,
  },
  statusText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
});

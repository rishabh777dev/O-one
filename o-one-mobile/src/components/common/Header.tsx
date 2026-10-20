import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, Monitor } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';

export const Header: React.FC = () => {
  const { currentSurface, activeAgent, activeProject, openDrawer, toggleHostExpanded } =
    useAppStore();

  const isIDE = currentSurface === 'ide';
  const isWorkflows = currentSurface === 'workflows';
  const isMarketplace = currentSurface === 'marketplace';

  let title = activeAgent.name;
  let statusText = 'Ready to send';

  if (isIDE) {
    title = `${activeProject} (IDE)`;
    statusText = 'Antigravity CLI · Connected';
  } else if (isWorkflows) {
    title = 'Workflows';
    statusText = '2 Active Pipelines';
  } else if (isMarketplace) {
    title = 'MCP Hub';
    statusText = 'Connectors & Tools';
  }

  const handleOpenHost = () => {
    openDrawer();
    toggleHostExpanded();
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left Circular Drawer / Back Button */}
      <TouchableOpacity
        style={styles.circleBtn}
        onPress={openDrawer}
        activeOpacity={0.7}
      >
        <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
      </TouchableOpacity>

      {/* Center Agent / Surface Pill with Nous Badge */}
      <TouchableOpacity
        style={styles.centerPill}
        onPress={openDrawer}
        activeOpacity={0.8}
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
      >
        <Monitor size={17} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgScreen,
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
    backgroundColor: '#222226',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 14,
    paddingLeft: 6,
    gap: 8,
  },
  nousBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.hermesOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  nousDot: {
    width: 3.5,
    height: 8,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  titleColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  agentTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
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
    color: colors.textSecondary,
  },
});

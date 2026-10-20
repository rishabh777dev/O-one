import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useHostStore } from '../../store/useHostStore';
import { useAppStore } from '../../store/useAppStore';
import { HostMode } from '../../types';

export const HostCard: React.FC = () => {
  const { currentHost, setHostMode } = useHostStore();
  const { isHostExpanded, toggleHostExpanded } = useAppStore();

  const modes: HostMode[] = ['Azure VM', 'Local PC', 'Phone'];

  return (
    <View style={styles.card}>
      {/* Summary Header */}
      <TouchableOpacity
        style={styles.summary}
        onPress={toggleHostExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.summaryLeft}>
          <View style={styles.statusDot} />
          <View>
            <Text style={styles.hostName}>{currentHost.name}</Text>
            <Text style={styles.hostSpecs}>{currentHost.specs}</Text>
          </View>
        </View>

        {isHostExpanded ? (
          <ChevronUp size={16} color={colors.textMuted} />
        ) : (
          <ChevronDown size={16} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      {/* Expanded Details */}
      {isHostExpanded && (
        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.label}>Tailscale IP</Text>
            <Text style={styles.value}>{currentHost.tailscaleIp}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Antigravity CLI</Text>
            <Text style={[styles.value, { color: colors.accentEmerald }]}>
              {currentHost.antigravityVersion}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Hermes Daemon</Text>
            <Text style={styles.value}>PID {currentHost.hermesPid}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Disk Storage</Text>
            <Text style={styles.value}>{currentHost.diskUsage}</Text>
          </View>

          {/* Mode Switcher Strip */}
          <Text style={styles.sectionLabel}>Host Connection Mode</Text>
          <View style={styles.modeStrip}>
            {modes.map((mode) => {
              const active = currentHost.mode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, active && styles.modeBtnActive]}
                  onPress={() => setHostMode(mode)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeText, active && styles.modeTextActive]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentEmerald,
  },
  hostName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hostSpecs: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 1,
  },
  details: {
    backgroundColor: colors.bgCardInner,
    borderTopWidth: 1,
    borderTopColor: colors.borderInner,
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  value: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  modeStrip: {
    flexDirection: 'row',
    backgroundColor: '#222227',
    borderRadius: 9999,
    padding: 3,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  modeText: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  modeTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
});

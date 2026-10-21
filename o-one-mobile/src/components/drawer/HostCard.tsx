import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { ChevronDown, ChevronUp, Server, Pencil, Check, RefreshCw } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useHostStore } from '../../store/useHostStore';
import { useAppStore } from '../../store/useAppStore';
import { rpcClient } from '../../services/rpcClient';
import { HostMode } from '../../types';

export const HostCard: React.FC = () => {
  const { currentHost, setHostMode } = useHostStore();
  const { isHostExpanded, toggleHostExpanded } = useAppStore();

  const [showEditHostModal, setShowEditHostModal] = useState(false);
  const [customHostUrl, setCustomHostUrl] = useState(rpcClient.getHost());

  const modes: HostMode[] = ['Azure VM', 'Local PC', 'Phone'];

  const handleSelectMode = (mode: HostMode) => {
    setHostMode(mode);
    if (mode === 'Azure VM') {
      rpcClient.setHost('100.92.14.8');
    } else if (mode === 'Local PC') {
      rpcClient.setHost('192.168.1.7');
    }
  };

  const handleSaveCustomHost = () => {
    if (!customHostUrl.trim()) return;
    rpcClient.setHost(customHostUrl.trim());
    setShowEditHostModal(false);
  };

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
            <View style={styles.nameRow}>
              <Text style={styles.hostName}>{currentHost.name}</Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>ONLINE</Text>
              </View>
            </View>
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
            <Text style={styles.label}>Daemon Endpoint</Text>
            <TouchableOpacity
              style={styles.ipTouchable}
              onPress={() => {
                setCustomHostUrl(rpcClient.getHost());
                setShowEditHostModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.endpointValue} numberOfLines={1}>
                {rpcClient.getHost()}
              </Text>
              <Pencil size={11} color={colors.hermesOrange} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Linux Kernel</Text>
            <Text style={[styles.value, { color: colors.accentEmerald }]}>
              {currentHost.linuxKernel}
            </Text>
          </View>

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
            <Text style={styles.value}>PID {currentHost.hermesPid || 1420} · Active</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Disk Storage</Text>
            <Text style={styles.value}>{currentHost.diskUsage}</Text>
          </View>

          {/* Mode Switcher Strip */}
          <Text style={styles.sectionLabel}>Host Target</Text>
          <View style={styles.modeStrip}>
            {modes.map((mode) => {
              const active = currentHost.mode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, active && styles.modeBtnActive]}
                  onPress={() => handleSelectMode(mode)}
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

      {/* Edit Host / Daemon IP Modal */}
      <Modal visible={showEditHostModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Server size={18} color={colors.hermesOrange} />
              <Text style={styles.modalTitle}>Host Daemon Endpoint</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Connect O1 Mobile to your 24/7 Azure VM or Local PC over Wi-Fi/Tailscale
            </Text>

            <TextInput
              style={styles.modalInput}
              value={customHostUrl}
              onChangeText={setCustomHostUrl}
              placeholder="e.g. ws://192.168.1.7:8443 or ws://100.92.14.8:8443"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Quick Preset Buttons */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => setCustomHostUrl('ws://192.168.1.7:8443')}
              >
                <Text style={styles.presetText}>Local Wi-Fi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => setCustomHostUrl('ws://100.92.14.8:8443')}
              >
                <Text style={styles.presetText}>Azure Tailscale</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => setCustomHostUrl('ws://127.0.0.1:8443')}
              >
                <Text style={styles.presetText}>Localhost</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalPrimary}
                onPress={handleSaveCustomHost}
                activeOpacity={0.8}
              >
                <Text style={styles.btnModalPrimaryText}>Connect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setShowEditHostModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentEmerald,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hostName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  liveBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.accentEmerald,
  },
  hostSpecs: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 1,
  },
  details: {
    backgroundColor: colors.bgCardInner,
    borderTopWidth: 1,
    borderTopColor: colors.borderInner,
    padding: 12,
    gap: 7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  value: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  ipTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '55%',
  },
  endpointValue: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.hermesOrange,
  },
  sectionLabel: {
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginTop: 3,
  },
  modeStrip: {
    flexDirection: 'row',
    backgroundColor: '#222227',
    borderRadius: 9999,
    padding: 2.5,
    gap: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 4.5,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  modeText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  modeTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
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
    padding: 18,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
  },
  modalInput: {
    height: 40,
    backgroundColor: colors.bgCardInner,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInner,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'monospace',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.bgCardInner,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderInner,
  },
  presetText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Check, Plus, X, Globe, Layers, ShieldCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { MCPServerItem } from '../types';

const defaultServers: MCPServerItem[] = [
  {
    id: 'github',
    name: 'GitHub MCP Server',
    code: 'GH',
    description: 'Autonomous repository read/write, PR review, issues triage',
    installed: true,
    toolCount: 14,
  },
  {
    id: 'composio',
    name: 'Composio Connectors',
    code: 'CP',
    description: 'Unified integrations for Gmail, Slack, Linear, Notion, and Discord',
    installed: true,
    toolCount: 42,
  },
  {
    id: 'postgres',
    name: 'PostgreSQL Inspector',
    code: 'PG',
    description: 'Safe read-only schema introspection and query debugging on host',
    installed: true,
    toolCount: 6,
  },
  {
    id: 'custom-mcp',
    name: 'Custom Stdio/SSE MCP',
    code: 'CLI',
    description: 'Run any custom stdio or SSE server script on your Azure VM',
    installed: false,
    toolCount: 0,
  },
];

export const MarketplaceScreen: React.FC = () => {
  const [servers, setServers] = useState<MCPServerItem[]>(defaultServers);
  const [selectedServer, setSelectedServer] = useState<MCPServerItem | null>(null);
  const [tokenInput, setTokenInput] = useState('');

  const handleToggleInstall = (server: MCPServerItem) => {
    if (server.installed) {
      // Toggle off
      setServers(
        servers.map((s) => (s.id === server.id ? { ...s, installed: false } : s))
      );
    } else {
      // Open configure modal
      setSelectedServer(server);
    }
  };

  const handleSaveConfig = () => {
    if (selectedServer) {
      setServers(
        servers.map((s) =>
          s.id === selectedServer.id ? { ...s, installed: true, toolCount: s.toolCount || 8 } : s
        )
      );
      setSelectedServer(null);
      setTokenInput('');
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Model Context Protocol (MCP) Hub</Text>
        <View style={styles.verifiedBadge}>
          <ShieldCheck size={12} color={colors.accentEmerald} />
          <Text style={styles.verifiedText}>Verified Connectors</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {servers.map((server: MCPServerItem) => (
          <View key={server.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconCode}>{server.code}</Text>
              </View>
              <View style={styles.textCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.serverName}>{server.name}</Text>
                  {server.installed ? (
                    <Text style={styles.toolCountBadge}>{server.toolCount} Tools</Text>
                  ) : null}
                </View>
                <Text style={styles.serverDesc}>{server.description}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                server.installed ? styles.installedBtn : styles.addBtn,
              ]}
              onPress={() => handleToggleInstall(server)}
              activeOpacity={0.7}
            >
              {server.installed ? (
                <>
                  <Check size={12} color={colors.accentEmerald} strokeWidth={2.4} />
                  <Text style={styles.installedBtnText}>Active</Text>
                </>
              ) : (
                <Text style={styles.addBtnText}>+ Add</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Configure MCP Server Modal */}
      <Modal visible={!!selectedServer} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure {selectedServer?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedServer(null)}>
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Installs stdio daemon runner on your Azure VM workspace.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="API Key / Auth Token (optional for stdio)"
              placeholderTextColor={colors.textMuted}
              value={tokenInput}
              onChangeText={setTokenInput}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalPrimary}
                onPress={handleSaveConfig}
                activeOpacity={0.8}
              >
                <Text style={styles.btnModalPrimaryText}>Install & Connect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setSelectedServer(null)}
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
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  topBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 9999,
  },
  verifiedText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#27272C',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  textCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  serverName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toolCountBadge: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    color: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  serverDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtn: {
    backgroundColor: colors.btnPrimaryBg,
  },
  addBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.btnPrimaryText,
  },
  installedBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  installedBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentEmerald,
    fontFamily: 'monospace',
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
    justifyContent: 'space-between',
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
    fontSize: 13,
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

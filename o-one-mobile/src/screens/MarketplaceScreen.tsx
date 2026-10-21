import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Check, Plus, X, ShieldCheck, RefreshCw, Trash2, Play, Globe, Terminal } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { MCPServerItem } from '../types';
import { rpcClient } from '../services/rpcClient';

export const MarketplaceScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'configured' | 'catalog'>('configured');
  const [configuredServers, setConfiguredServers] = useState<MCPServerItem[]>([]);
  const [catalogServers, setCatalogServers] = useState<MCPServerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Custom MCP Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [transportType, setTransportType] = useState<'sse' | 'stdio'>('sse');
  const [customCommandOrUrl, setCustomCommandOrUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch servers from host
  const fetchServers = () => {
    setIsLoading(true);
    // 1. List active servers
    rpcClient.send('mcp.list', {}, (res) => {
      if (res.result && Array.isArray(res.result)) {
        setConfiguredServers(res.result);
      }
      setIsLoading(false);
    });

    // 2. List catalog
    rpcClient.send('mcp.catalog', {}, (res) => {
      if (res.result && Array.isArray(res.result)) {
        setCatalogServers(res.result);
      }
    });
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleInstallCatalog = (serverName: string) => {
    setStatusMessage(`Installing ${serverName} via host daemon...`);
    rpcClient.send('mcp.install', { name: serverName }, (res) => {
      if (res.success) {
        setStatusMessage(`✓ ${serverName} installed successfully!`);
        fetchServers();
      } else {
        setStatusMessage(`Error: ${res.error || 'Failed to install'}`);
      }
      setTimeout(() => setStatusMessage(null), 3500);
    });
  };

  const handleAddCustomMcp = () => {
    if (!customName.trim() || !customCommandOrUrl.trim()) return;
    setStatusMessage(`Connecting MCP server "${customName}"...`);
    rpcClient.send(
      'mcp.add',
      { name: customName.trim(), commandOrUrl: customCommandOrUrl.trim() },
      (res) => {
        if (res.success) {
          setStatusMessage(`✓ Connected "${customName}" to host.`);
          setShowAddModal(false);
          setCustomName('');
          setCustomCommandOrUrl('');
          fetchServers();
        } else {
          setStatusMessage(`Error: ${res.error || 'Connection failed'}`);
        }
        setTimeout(() => setStatusMessage(null), 3500);
      }
    );
  };

  const handleRemoveMcp = (name: string) => {
    setStatusMessage(`Removing ${name}...`);
    rpcClient.send('mcp.remove', { name }, (res) => {
      setStatusMessage(`✓ Removed ${name}`);
      fetchServers();
      setTimeout(() => setStatusMessage(null), 2500);
    });
  };

  const handleTestMcp = (name: string) => {
    setStatusMessage(`Testing connection to ${name}...`);
    rpcClient.send('mcp.test', { name }, (res) => {
      setStatusMessage(`Result for ${name}: ${res.result?.trim() || 'Online'}`);
      setTimeout(() => setStatusMessage(null), 4000);
    });
  };

  const filteredCatalog = catalogServers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Model Context Protocol (MCP) Hub</Text>
          <Text style={styles.topBarSubtitle}>Connect any local stdio tool or remote SSE server</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Plus size={13} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.addBtnText}>Connect MCP</Text>
        </TouchableOpacity>
      </View>

      {/* Status Toast Banner */}
      {statusMessage ? (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>{statusMessage}</Text>
        </View>
      ) : null}

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'configured' && styles.tabBtnActive]}
          onPress={() => setActiveTab('configured')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'configured' && styles.tabTextActive]}>
            Configured ({configuredServers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'catalog' && styles.tabBtnActive]}
          onPress={() => setActiveTab('catalog')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>
            Catalog ({catalogServers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchServers} activeOpacity={0.7}>
          <RefreshCw size={13} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Tab 1: Configured MCP Servers */}
      {activeTab === 'configured' ? (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {configuredServers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No MCP Servers Connected</Text>
              <Text style={styles.emptySub}>
                Tap "+ Connect MCP" to attach any custom stdio/SSE server, or install from the catalog.
              </Text>
            </View>
          ) : (
            configuredServers.map((server) => (
              <View key={server.name} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconCode}>{server.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={styles.textCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.serverName}>{server.name}</Text>
                      <View style={styles.enabledBadge}>
                        <Check size={10} color={colors.accentEmerald} strokeWidth={3} />
                        <Text style={styles.enabledBadgeText}>{server.status || 'Active'}</Text>
                      </View>
                    </View>
                    <Text style={styles.serverDesc} numberOfLines={1}>
                      {server.transport}
                    </Text>
                  </View>
                </View>

                {/* Actions: Test & Remove */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.testBtn}
                    onPress={() => handleTestMcp(server.name)}
                    activeOpacity={0.7}
                  >
                    <Play size={11} color="#60A5FA" />
                    <Text style={styles.testBtnText}>Test</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveMcp(server.name)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={12} color={colors.accentRose} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        /* Tab 2: Catalog */
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={styles.searchInput}
            placeholder="Search 68+ verified MCP connectors..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {filteredCatalog.map((item) => (
            <View key={item.name} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconCode}>{item.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.serverName}>{item.name}</Text>
                  <Text style={styles.serverDesc}>{item.description}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.installBtn}
                onPress={() => handleInstallCatalog(item.name)}
                activeOpacity={0.7}
              >
                <Plus size={12} color="#000000" strokeWidth={2.4} />
                <Text style={styles.installBtnText}>Install</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Connect Custom MCP Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Any MCP Server</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Directly attach any Model Context Protocol provider running on your host machine, network, or cloud
            </Text>

            <Text style={styles.fieldLabel}>Server Identifier Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. postgres-inspector, sentry-mcp, my-internal-api"
              placeholderTextColor={colors.textMuted}
              value={customName}
              onChangeText={setCustomName}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Transport Protocol</Text>
            <View style={styles.transportSwitch}>
              <TouchableOpacity
                style={[styles.transportBtn, transportType === 'sse' && styles.transportBtnActive]}
                onPress={() => {
                  setTransportType('sse');
                  if (!customCommandOrUrl) setCustomCommandOrUrl('https://api.example.com/mcp');
                }}
              >
                <Globe size={12} color={transportType === 'sse' ? '#FFFFFF' : colors.textMuted} />
                <Text
                  style={[
                    styles.transportBtnText,
                    transportType === 'sse' && styles.transportBtnTextActive,
                  ]}
                >
                  Remote SSE / HTTP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.transportBtn, transportType === 'stdio' && styles.transportBtnActive]}
                onPress={() => {
                  setTransportType('stdio');
                  if (!customCommandOrUrl) setCustomCommandOrUrl('npx -y @modelcontextprotocol/server-postgres');
                }}
              >
                <Terminal size={12} color={transportType === 'stdio' ? '#FFFFFF' : colors.textMuted} />
                <Text
                  style={[
                    styles.transportBtnText,
                    transportType === 'stdio' && styles.transportBtnTextActive,
                  ]}
                >
                  Local Stdio Command
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>
              {transportType === 'sse' ? 'Server URL (SSE Endpoint)' : 'CLI Execution Command'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={
                transportType === 'sse'
                  ? 'https://connect.composio.dev/mcp'
                  : 'npx -y @modelcontextprotocol/server-postgres postgresql://...'
              }
              placeholderTextColor={colors.textMuted}
              value={customCommandOrUrl}
              onChangeText={setCustomCommandOrUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalPrimary}
                onPress={handleAddCustomMcp}
                activeOpacity={0.8}
              >
                <Text style={styles.btnModalPrimaryText}>Connect MCP Server</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setShowAddModal(false)}
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topBarSubtitle: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E2530',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(96, 165, 250, 0.3)',
  },
  statusBannerText: {
    fontSize: 11.5,
    fontFamily: 'monospace',
    color: '#93C5FD',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 11.5,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  refreshBtn: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 28,
  },
  searchInput: {
    height: 38,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12.5,
    marginBottom: 4,
  },
  emptyCard: {
    padding: 24,
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 6,
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
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
    paddingRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272C',
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
  enabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 4,
  },
  enabledBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
    fontWeight: '700',
  },
  serverDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  testBtnText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: '#60A5FA',
    fontWeight: '600',
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: colors.btnPrimaryBg,
    borderRadius: 9999,
  },
  installBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.btnPrimaryText,
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
    maxWidth: 350,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
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
  transportSwitch: {
    flexDirection: 'row',
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  transportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
  },
  transportBtnActive: {
    backgroundColor: '#2D2D38',
  },
  transportBtnText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  transportBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    fontSize: 12.5,
    fontWeight: '700',
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
    fontSize: 12.5,
    color: colors.textSecondary,
  },
});

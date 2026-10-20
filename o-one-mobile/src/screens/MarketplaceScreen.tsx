import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { MCPServerItem } from '../types';

const defaultServers: MCPServerItem[] = [
  {
    id: 'github',
    name: 'GitHub MCP',
    code: 'GH',
    description: 'Repository read/write, PR review, issues triage',
    installed: true,
    toolCount: 14,
  },
  {
    id: 'composio',
    name: 'Composio Connectors',
    code: 'CP',
    description: 'Gmail, Slack, Linear, Notion integrations',
    installed: true,
    toolCount: 42,
  },
  {
    id: 'postgres',
    name: 'PostgreSQL Inspector',
    code: 'PG',
    description: 'Safe read-only schema introspection on host',
    installed: true,
    toolCount: 6,
  },
  {
    id: 'custom-mcp',
    name: 'Custom Stdio/SSE MCP',
    code: '+',
    description: 'Connect your own stdio or SSE server script on Azure VM',
    installed: false,
    toolCount: 0,
  },
];

export const MarketplaceScreen: React.FC = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {defaultServers.map((server: MCPServerItem) => (
        <View key={server.id} style={styles.card}>
          <View style={styles.cardLeft}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconCode}>{server.code}</Text>
            </View>
            <View style={styles.textCol}>
              <Text style={styles.serverName}>{server.name}</Text>
              <Text style={styles.serverDesc}>{server.description}</Text>
            </View>
          </View>

          {server.installed ? (
            <Text style={styles.installedBadge}>Installed</Text>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => alert('Configure new MCP server on Azure VM...')}
              activeOpacity={0.7}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  content: {
    padding: 16,
    gap: 12,
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
    paddingRight: 8,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textCol: {
    flex: 1,
  },
  serverName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  serverDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  installedBadge: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.accentEmerald,
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.btnPrimaryBg,
    borderRadius: 9999,
  },
  addBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.btnPrimaryText,
  },
});

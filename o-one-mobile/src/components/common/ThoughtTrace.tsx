import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface ThoughtTraceProps {
  trace: string;
}

export const ThoughtTrace: React.FC<ThoughtTraceProps> = ({ trace }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Zap size={13} color={colors.accentAmber} />
          <Text style={styles.headerTitle}>Reasoning trace</Text>
        </View>
        {expanded ? (
          <ChevronDown size={14} color={colors.textMuted} />
        ) : (
          <ChevronRight size={14} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <Text style={styles.contentText}>{trace}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111115',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 11.5,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: '#0D0D10',
  },
  contentText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    color: colors.textSecondary,
  },
});

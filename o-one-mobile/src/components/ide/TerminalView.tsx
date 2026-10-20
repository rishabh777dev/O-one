import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useProjectStore } from '../../store/useProjectStore';

export const TerminalView: React.FC = () => {
  const { terminalLogs, isTerminalVisible, toggleTerminal } = useProjectStore();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleTerminal}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Terminal size={14} color={colors.terminalText} />
          <Text style={styles.headerTitle}>Remote Console (Azure VM)</Text>
        </View>
        {isTerminalVisible ? (
          <ChevronUp size={14} color={colors.textMuted} />
        ) : (
          <ChevronDown size={14} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      {isTerminalVisible && (
        <View style={styles.body}>
          {terminalLogs.map((log, index) => (
            <Text
              key={index}
              style={[
                styles.logLine,
                log.includes('PASS') && styles.passLine,
                log.includes('1 file changed') && styles.infoLine,
              ]}
            >
              {log}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.terminalBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderInner,
    overflow: 'hidden',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#16161A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  body: {
    padding: 12,
    gap: 4,
  },
  logLine: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: colors.terminalText,
    lineHeight: 15,
  },
  passLine: {
    color: colors.accentEmerald,
  },
  infoLine: {
    color: '#93C5FD',
  },
});

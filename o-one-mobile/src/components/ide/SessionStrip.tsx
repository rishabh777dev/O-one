import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { useProjectStore } from '../../store/useProjectStore';

export const SessionStrip: React.FC = () => {
  const { sessions, activeSessionId, setActiveSession, createSession } = useProjectStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        return (
          <TouchableOpacity
            key={session.id}
            style={[styles.sessionPill, isActive && styles.sessionPillActive]}
            onPress={() => setActiveSession(session.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sessionText, isActive && styles.sessionTextActive]}>
              {session.title}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.newSessionBtn}
        onPress={() => createSession('Optimize Postgres Pool')}
        activeOpacity={0.7}
      >
        <Text style={styles.newSessionText}>+ New Task</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  sessionPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
  },
  sessionPillActive: {
    backgroundColor: '#2A2A30',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  sessionText: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  sessionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  newSessionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSessionText: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
});

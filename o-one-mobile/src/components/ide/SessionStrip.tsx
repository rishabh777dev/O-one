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
import { Plus, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useProjectStore } from '../../store/useProjectStore';

export const SessionStrip: React.FC = () => {
  const { sessions, activeSessionId, setActiveSession, createSession } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  const handleCreate = () => {
    const title = taskTitle.trim() || `Task ${sessions.length + 1}`;
    createSession(title);
    setTaskTitle('');
    setShowModal(false);
  };

  return (
    <>
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
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <Plus size={12} color={colors.textMuted} />
          <Text style={styles.newSessionText}>New Task</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* New Task Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Autonomous Task</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeBtn}
              >
                <X size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="e.g. Refactor Auth Middleware"
              placeholderTextColor={colors.textMuted}
              value={taskTitle}
              onChangeText={setTaskTitle}
              autoFocus
              onSubmitEditing={handleCreate}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.btnCreate}
                onPress={handleCreate}
                activeOpacity={0.8}
              >
                <Text style={styles.btnCreateText}>Start Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  sessionPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
  },
  sessionPillActive: {
    backgroundColor: '#27272D',
    borderColor: 'rgba(255, 255, 255, 0.24)',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
  },
  newSessionText: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
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
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCircleBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 42,
    backgroundColor: colors.bgCardInner,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInner,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnCreate: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    backgroundColor: colors.btnPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCreateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.btnPrimaryText,
  },
  btnCancel: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    backgroundColor: colors.bgCardInner,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

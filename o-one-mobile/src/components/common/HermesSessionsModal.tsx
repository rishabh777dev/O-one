import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, MessageSquare, Clock, Check, ChevronRight, RotateCcw } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { rpcClient, RPCResponse } from '../../services/rpcClient';
import { useAgentStore } from '../../store/useAgentStore';

interface SessionItem {
  id: string;
  title: string;
  started_at: number;
  message_count: number;
  cwd: string;
  model?: string;
}

interface HermesSessionsModalProps {
  visible: boolean;
  agentId: string;
  agentColor?: string;
  onClose: () => void;
}

export const HermesSessionsModal: React.FC<HermesSessionsModalProps> = ({
  visible,
  agentId,
  agentColor = '#EA580C',
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { sessions, sessionTitles, startNewSession, switchSession } = useAgentStore();
  const activeSessionId = sessions[agentId] || '';

  const [loading, setLoading] = useState(false);
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);

  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible]);

  const loadSessions = () => {
    setLoading(true);
    rpcClient.send('hermes.sessions.list', { limit: 25 }, (res: RPCResponse) => {
      setLoading(false);
      if (res.type === 'result' && Array.isArray(res.sessions)) {
        setSessionsList(res.sessions);
      }
    });
  };

  const handleStartFresh = () => {
    startNewSession(agentId);
    onClose();
  };

  const handleSelectSession = (s: SessionItem) => {
    if (s.id === activeSessionId) {
      onClose();
      return;
    }
    switchSession(agentId, s.id, s.title);
    onClose();
  };

  const formatTimestamp = (sec: number) => {
    if (!sec) return '';
    const diffMs = Date.now() - sec * 1000;
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <MessageSquare size={18} color={agentColor} />
              <Text style={styles.headerTitle}>Hermes Sessions</Text>
              {sessionsList.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{sessionsList.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {/* New Session Action Card */}
          <TouchableOpacity
            style={[styles.newSessionCard, { borderColor: `${agentColor}40` }]}
            onPress={handleStartFresh}
            activeOpacity={0.8}
          >
            <View style={[styles.newSessionIconBox, { backgroundColor: `${agentColor}20` }]}>
              <Plus size={20} color={agentColor} strokeWidth={2.5} />
            </View>
            <View style={styles.newSessionTextCol}>
              <Text style={styles.newSessionTitle}>Start Fresh Session</Text>
              <Text style={styles.newSessionSub}>
                Begin a brand-new conversation thread with clean context
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>Recent Sessions in Workspace</Text>

          {/* Sessions List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={agentColor} size="small" />
              <Text style={styles.loadingText}>Loading Hermes session index...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {sessionsList.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.sessionRow,
                      isActive && [styles.sessionRowActive, { borderColor: `${agentColor}60` }],
                    ]}
                    onPress={() => handleSelectSession(s)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sessionLeft}>
                      <View style={styles.titleLine}>
                        <Text
                          style={[styles.sessionTitle, isActive && { color: '#FFFFFF' }]}
                          numberOfLines={1}
                        >
                          {s.title || 'Untitled Session'}
                        </Text>
                        {isActive && (
                          <View
                            style={[
                              styles.activeTag,
                              { backgroundColor: `${agentColor}25`, borderColor: `${agentColor}60` },
                            ]}
                          >
                            <View style={[styles.activeDot, { backgroundColor: agentColor }]} />
                            <Text style={[styles.activeText, { color: agentColor }]}>Active</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.metaRow}>
                        <Clock size={11} color="#71717A" />
                        <Text style={styles.metaText}>{formatTimestamp(s.started_at)}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{s.message_count || 0} msgs</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.sessionHash}>{s.id.substring(s.id.length - 6)}</Text>
                      </View>
                    </View>

                    {isActive ? (
                      <Check size={16} color={agentColor} strokeWidth={2.5} />
                    ) : (
                      <ChevronRight size={16} color="#52525B" />
                    )}
                  </TouchableOpacity>
                );
              })}

              {sessionsList.length === 0 && !loading && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No previous Hermes sessions found.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0E0E12',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#27272A',
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#27272A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#141419',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  newSessionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSessionTextCol: {
    flex: 1,
  },
  newSessionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  newSessionSub: {
    color: '#A1A1AA',
    fontSize: 11,
    lineHeight: 15,
  },
  sectionHeader: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  scroll: {
    maxHeight: 380,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#1F1F24',
  },
  sessionRowActive: {
    backgroundColor: '#181820',
  },
  sessionLeft: {
    flex: 1,
    marginRight: 12,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sessionTitle: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#71717A',
    fontSize: 11,
  },
  metaDot: {
    color: '#3F3F46',
    fontSize: 11,
  },
  sessionHash: {
    color: '#52525B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#71717A',
    fontSize: 12,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717A',
    fontSize: 12,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Check,
  Cpu,
  Sparkles,
  Zap,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { rpcClient } from '../../services/rpcClient';
import { useAppStore } from '../../store/useAppStore';
import { Agent } from '../../types';

interface ModelItem {
  id: string;
  name: string;
  desc: string;
  isCurrent?: boolean;
}

interface ProviderGroup {
  provider: string;
  slug: string;
  engine: string;
  isCurrent?: boolean;
  desc: string;
  models: ModelItem[];
}

interface ModelPickerModalProps {
  visible: boolean;
  agent?: Agent | null;
  onClose: () => void;
  onSelectModel?: (modelId: string, providerSlug: string) => void;
}

export const ModelPickerModal: React.FC<ModelPickerModalProps> = ({
  visible,
  agent,
  onClose,
  onSelectModel,
}) => {
  const insets = useSafeAreaInsets();
  const { updateAgent } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ProviderGroup[]>([]);
  const [activeModel, setActiveModel] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const fetchModels = () => {
    setLoading(true);
    rpcClient.send('models.list', {}, (res) => {
      setLoading(false);
      if (res.result && Array.isArray(res.result)) {
        setGroups(res.result);
        if (res.activeModel) setActiveModel(res.activeModel);
        if (res.activeProvider) setActiveProvider(res.activeProvider);
      }
    });
  };

  useEffect(() => {
    if (visible) {
      fetchModels();
    }
  }, [visible]);

  const handleSelect = (group: ProviderGroup, model: ModelItem) => {
    setIsSwitching(model.id);

    // Call host daemon to set active model in Hermes config
    rpcClient.send(
      'models.set',
      { model: model.id, provider: group.slug },
      (res) => {
        setIsSwitching(null);
        setActiveModel(model.id);
        setActiveProvider(group.provider);

        // Update the active agent's model in app store
        if (agent) {
          updateAgent({
            ...agent,
            model: model.id,
            engineLabel: `${model.name} · ${group.provider.split(' ')[0]}`,
          });
        }

        if (onSelectModel) {
          onSelectModel(model.id, group.slug);
        }

        onClose();
      }
    );
  };

  const currentSelectedModel = agent?.model || activeModel;

  // Filter groups and models by search query
  const filteredGroups = groups
    .map((g) => {
      if (!searchQuery.trim()) return g;
      const q = searchQuery.toLowerCase();
      const matchProvider = g.provider.toLowerCase().includes(q);
      const filteredModels = g.models.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.desc.toLowerCase().includes(q)
      );
      if (matchProvider) return g;
      return {
        ...g,
        models: filteredModels,
      };
    })
    .filter((g) => g.models.length > 0);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Inference Models</Text>
            <Text style={styles.headerSub}>Live models streamed from Hermes gateway</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Search Input Box */}
        <View style={styles.searchWrap}>
          <Search size={16} color="#71717A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search models (e.g. gpt, grok, gemini, claude)..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Content Body */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Fetching available models from Hermes...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredGroups.map((group) => (
              <View key={group.slug || group.provider} style={styles.groupCard}>
                {/* Group Header */}
                <View style={styles.groupHeaderRow}>
                  <View style={styles.groupIconBox}>
                    <Cpu size={16} color="#38BDF8" />
                  </View>
                  <View style={styles.groupTitleCol}>
                    <View style={styles.groupNameRow}>
                      <Text style={styles.groupName}>{group.provider}</Text>
                      {group.isCurrent && (
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>ACTIVE PROVIDER</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.groupDesc} numberOfLines={1}>
                      {group.desc}
                    </Text>
                  </View>
                </View>

                {/* Models in Group */}
                <View style={styles.modelList}>
                  {group.models.map((model, idx) => {
                    const isSelected =
                      model.id === currentSelectedModel ||
                      (model.isCurrent && !agent?.model);
                    const isProcessing = isSwitching === model.id;
                    const isLast = idx === group.models.length - 1;

                    return (
                      <TouchableOpacity
                        key={model.id}
                        style={[
                          styles.modelRow,
                          isSelected && styles.modelRowSelected,
                          isLast && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => handleSelect(group, model)}
                        disabled={isProcessing}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modelInfoCol}>
                          <View style={styles.modelNameRow}>
                            <Text
                              style={[
                                styles.modelName,
                                isSelected && { color: '#38BDF8', fontWeight: '700' },
                              ]}
                            >
                              {model.name}
                            </Text>
                            {isSelected && (
                              <View style={styles.selectedBadge}>
                                <Check size={11} color="#38BDF8" strokeWidth={2.8} />
                                <Text style={styles.selectedBadgeText}>Selected</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.modelDesc} numberOfLines={2}>
                            {model.desc}
                          </Text>
                        </View>

                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#38BDF8" />
                        ) : (
                          <ChevronRight size={16} color="#52525B" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0E',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  groupCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#16161D',
  },
  groupIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitleCol: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  groupDesc: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  modelList: {
    paddingHorizontal: 14,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    gap: 12,
  },
  modelRowSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
  },
  modelInfoCol: {
    flex: 1,
  },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F4F4F5',
    fontFamily: 'monospace',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  modelDesc: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 3,
    lineHeight: 15,
  },
});

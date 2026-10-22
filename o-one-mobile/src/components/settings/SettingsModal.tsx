import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  Palette,
  Sparkles,
  Globe,
  Vibrate,
  Bell,
  Lock,
  EyeOff,
  HelpCircle,
  Info,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();

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
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Account Card */}
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => Alert.alert('Account', 'Logged in as rishisingh7145@gmail.com')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>R</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>rishisingh7145</Text>
              <Text style={styles.profileEmail}>rishisingh7145@gmail.com</Text>
            </View>
            <ChevronRight size={18} color="#71717A" />
          </TouchableOpacity>

          {/* Preferences Section */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={styles.rowItem}
              onPress={() => Alert.alert('Appearance', 'Dark theme enabled')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>Appearance</Text>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rowItem}
              onPress={() => Alert.alert('Animations', 'Fluid spring animations enabled')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>Animations</Text>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rowItem}
              onPress={() => Alert.alert('Language', 'English (US)')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>Language</Text>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rowItem}
              onPress={() => Alert.alert('Haptics', 'Haptic feedback on')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>Haptics</Text>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rowItem}
              onPress={() => Alert.alert('Notifications', 'System notifications active')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>Notifications</Text>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rowItem, { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert('Privacy', 'Local data & encryption safe')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>Privacy</Text>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Conversations Section */}
          <Text style={styles.sectionTitle}>Conversations</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[styles.rowItem, { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert('Hidden chats', 'No hidden chats')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>Hidden chats</Text>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={styles.supportRowItem}
              onPress={() => Alert.alert('Support', 'Support logs saved')}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.rowLabel}>Support</Text>
                <Text style={styles.rowSubLabel}>Get help and save a support log</Text>
              </View>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rowItem, { borderBottomWidth: 0 }]}
              onPress={() =>
                Alert.alert(
                  'About O one',
                  'O one · v1.0.0 Standalone\nAutonomous AI Agent Cockpit & Embedded Linux Distro\nZero Termux Dependency'
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>About O one</Text>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27272F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#71717A',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupCard: {
    backgroundColor: '#16161A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  supportRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rowSubLabel: {
    fontSize: 11.5,
    color: '#71717A',
    marginTop: 2,
  },
});

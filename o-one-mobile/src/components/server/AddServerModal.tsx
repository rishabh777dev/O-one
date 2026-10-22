import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Terminal,
  Monitor,
  Smartphone,
  Cloud,
  Check,
  CreditCard,
  Ticket,
  ChevronRight,
  Zap,
  Cpu,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { useDistroStore } from '../../store/useDistroStore';
import { ServerItem, ServerType } from '../../types';
import { rpcClient } from '../../services/rpcClient';
import { BrandLogo } from '../common/BrandLogo';

interface AddServerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddServerModal: React.FC<AddServerModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { addServer } = useAppStore();
  const {
    distroName,
    kernelVersion,
    architecture,
    status: distroStatus,
    ramUsageMB,
    diskUsageMB,
    packages,
    consoleLogs,
    installPackage,
    uninstallPackage,
    clearLogs,
    restartDistroDaemon,
  } = useDistroStore();

  const [activeTab, setActiveTab] = useState<ServerType>('phone');

  // SSH Form State
  const [sshName, setSshName] = useState('Ubuntu Production VPS');
  const [sshHost, setSshHost] = useState('');
  const [sshPort, setSshPort] = useState('22');
  const [sshUser, setSshUser] = useState('root');
  const [sshPassword, setSshPassword] = useState('');
  const [isConnectingSSH, setIsConnectingSSH] = useState(false);

  // Local Form State
  const [localName, setLocalName] = useState('Local Laptop (OpenBot)');
  const [localHost, setLocalHost] = useState('10.56.5.83:8443');

  // Cloud Join State
  const [inviteToken, setInviteToken] = useState('');

  // 1. Activate On-Device Standalone Distro Server
  const handleActivateOnDeviceDistro = () => {
    const newServer: ServerItem = {
      id: 'server-ondevice-alpine',
      name: 'O one On-Device',
      type: 'phone',
      typeLabel: 'Standalone Linux',
      host: 'localhost:8443',
      status: 'connected',
      color: '#10B981', // Emerald
      icon: 'smartphone',
      lastConnected: 'Active on phone',
    };
    addServer(newServer);
    Alert.alert(
      'Standalone Linux Activated',
      'O one is now running directly inside the on-device Alpine Linux environment on localhost:8443.'
    );
    onClose();
  };

  // 2. Add SSH Server
  const handleConnectSSH = () => {
    if (!sshHost.trim()) {
      Alert.alert('Required', 'Please enter a hostname or IP address');
      return;
    }
    setIsConnectingSSH(true);

    rpcClient.send(
      'terminal.execute',
      { command: `ssh -o BatchMode=yes -o ConnectTimeout=3 ${sshUser}@${sshHost} "echo ready"`, shellType: 'wsl' },
      () => {
        setIsConnectingSSH(false);
      }
    );

    const newServer: ServerItem = {
      id: `srv-ssh-${Date.now()}`,
      name: sshName.trim() || 'Remote SSH Server',
      type: 'ssh',
      typeLabel: 'SSH Remote',
      host: `${sshHost.trim()}:${sshPort.trim()}`,
      username: sshUser.trim(),
      status: 'connected',
      color: '#3B82F6',
      icon: 'terminal',
      lastConnected: 'Just now',
    };
    addServer(newServer);
    onClose();
  };

  // 3. Add Local Laptop Host Server
  const handleConnectLocal = () => {
    const newServer: ServerItem = {
      id: `srv-local-${Date.now()}`,
      name: localName.trim() || 'Laptop Host (OpenBot)',
      type: 'local',
      typeLabel: 'Workstation',
      host: localHost.trim() || 'localhost:8443',
      status: 'connected',
      color: '#E04848',
      icon: 'monitor',
      lastConnected: 'Active now',
    };
    addServer(newServer);
    onClose();
  };

  // 4. Join Cloud Server
  const handleJoinCloud = () => {
    const newServer: ServerItem = {
      id: `srv-cloud-${Date.now()}`,
      name: 'OpenBot Cloud Cluster',
      type: 'cloud',
      typeLabel: 'Cloud Gateway',
      status: 'connected',
      color: '#8B5CF6',
      icon: 'cloud',
      lastConnected: 'Connected',
    };
    addServer(newServer);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
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
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>

          <BrandLogo size={20} fontSize={16} subtext="SERVERS" />

          <View style={{ width: 36 }} />
        </View>

        {/* Server Type Segmented Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'phone' && styles.tabItemActive]}
            onPress={() => setActiveTab('phone')}
            activeOpacity={0.7}
          >
            <Smartphone size={14} color={activeTab === 'phone' ? '#10B981' : '#71717A'} />
            <Text style={[styles.tabText, activeTab === 'phone' && styles.tabTextActive]}>
              On-Device
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'cloud' && styles.tabItemActive]}
            onPress={() => setActiveTab('cloud')}
            activeOpacity={0.7}
          >
            <Cloud size={14} color={activeTab === 'cloud' ? '#FFFFFF' : '#71717A'} />
            <Text style={[styles.tabText, activeTab === 'cloud' && styles.tabTextActive]}>Cloud</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'ssh' && styles.tabItemActive]}
            onPress={() => setActiveTab('ssh')}
            activeOpacity={0.7}
          >
            <Terminal size={14} color={activeTab === 'ssh' ? '#FFFFFF' : '#71717A'} />
            <Text style={[styles.tabText, activeTab === 'ssh' && styles.tabTextActive]}>SSH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'local' && styles.tabItemActive]}
            onPress={() => setActiveTab('local')}
            activeOpacity={0.7}
          >
            <Monitor size={14} color={activeTab === 'local' ? '#FFFFFF' : '#71717A'} />
            <Text style={[styles.tabText, activeTab === 'local' && styles.tabTextActive]}>Laptop</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ========================================================================= */}
          {/* TAB 1: ON-DEVICE STANDALONE LINUX DISTRO (NO TERMUX DEPENDENCY)           */}
          {/* ========================================================================= */}
          {activeTab === 'phone' && (
            <View>
              {/* Architecture Intro */}
              <View style={styles.introCard}>
                <View style={styles.pillRow}>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>STANDALONE DISTRO</Text>
                  </View>
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={[styles.badgePillText, { color: '#10B981' }]}>NO TERMUX REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.introTitle}>Standalone On-Device Linux</Text>
                <Text style={styles.introSub}>
                  O one embeds its own user-space Alpine Linux runtime via PRoot. Agents run locally
                  on your phone 24/7 without needing a laptop, root access, or separate apps.
                </Text>
              </View>

              {/* Hardware & Runtime Telemetry Card */}
              <View style={styles.telemetryCard}>
                <View style={styles.telemetryRow}>
                  <View style={styles.telemetryItem}>
                    <Cpu size={14} color="#71717A" />
                    <Text style={styles.telemetryLabel}>ARCH</Text>
                    <Text style={styles.telemetryValue}>{architecture}</Text>
                  </View>
                  <View style={styles.telemetryDivider} />
                  <View style={styles.telemetryItem}>
                    <HardDrive size={14} color="#71717A" />
                    <Text style={styles.telemetryLabel}>RAM / DISK</Text>
                    <Text style={styles.telemetryValue}>{ramUsageMB} MB · {diskUsageMB} MB</Text>
                  </View>
                  <View style={styles.telemetryDivider} />
                  <View style={styles.telemetryItem}>
                    <Zap size={14} color="#10B981" />
                    <Text style={styles.telemetryLabel}>DAEMON</Text>
                    <Text style={[styles.telemetryValue, { color: '#10B981' }]}>
                      {distroStatus === 'running' ? 'Active :8443' : 'Starting'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* In-App Package & Agent Toolchain Manager */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderLabel}>On-Device Agent Toolchains</Text>
                <TouchableOpacity onPress={restartDistroDaemon} activeOpacity={0.7}>
                  <RefreshCw size={14} color="#71717A" />
                </TouchableOpacity>
              </View>

              <View style={styles.packagesCard}>
                {packages.map((pkg, idx) => {
                  const isLast = idx === packages.length - 1;
                  return (
                    <View
                      key={pkg.id}
                      style={[styles.pkgRow, isLast && { borderBottomWidth: 0 }]}
                    >
                      <View style={styles.pkgIconBox}>
                        {pkg.category === 'agent' ? (
                          <Zap size={18} color="#3B82F6" />
                        ) : pkg.category === 'runtime' ? (
                          <Cpu size={18} color="#10B981" />
                        ) : (
                          <Terminal size={18} color="#F59E0B" />
                        )}
                      </View>

                      <View style={styles.pkgInfoCol}>
                        <View style={styles.pkgTitleRow}>
                          <Text style={styles.pkgName}>{pkg.name}</Text>
                          <Text style={styles.pkgVersion}>{pkg.version}</Text>
                        </View>
                        <Text style={styles.pkgDesc} numberOfLines={2}>
                          {pkg.description}
                        </Text>
                      </View>

                      {/* Install / Installed Button */}
                      {pkg.installing ? (
                        <View style={styles.installingBox}>
                          <ActivityIndicator size="small" color="#10B981" />
                        </View>
                      ) : pkg.installed ? (
                        <TouchableOpacity
                          style={styles.installedBadge}
                          onPress={() => uninstallPackage(pkg.id)}
                          activeOpacity={0.7}
                        >
                          <Check size={12} color="#10B981" strokeWidth={2.4} />
                          <Text style={styles.installedText}>Active</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.installBtn}
                          onPress={() => installPackage(pkg.id)}
                          activeOpacity={0.7}
                        >
                          <Download size={12} color="#FFFFFF" />
                          <Text style={styles.installBtnText}>Install</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Embedded Execution Console */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderLabel}>Distro Execution Log</Text>
                <TouchableOpacity onPress={clearLogs} activeOpacity={0.7}>
                  <Text style={styles.clearLogsText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.consoleCard}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 120 }}>
                  {consoleLogs.map((log, i) => (
                    <Text key={i} style={styles.consoleLogLine}>
                      {log}
                    </Text>
                  ))}
                </ScrollView>
              </View>

              {/* Activate Standalone Server Button */}
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleActivateOnDeviceDistro}
                activeOpacity={0.8}
              >
                <Smartphone size={16} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.primaryActionText}>Activate On-Device Standalone Distro</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CLOUD SERVER (OPENBOT / VPS GATEWAY)                                */}
          {/* ========================================================================= */}
          {activeTab === 'cloud' && (
            <View>
              <View style={styles.introCard}>
                <Text style={styles.introTitle}>Dedicated Cloud Servers</Text>
                <Text style={styles.introSub}>
                  Hosted VPS or Azure compute clusters for 24/7 background agent workflows and heavy
                  browser automation.
                </Text>
              </View>

              {/* Plans Card */}
              <View style={styles.plansCard}>
                <TouchableOpacity style={styles.planRow} onPress={handleJoinCloud} activeOpacity={0.7}>
                  <Text style={styles.planName}>Starter</Text>
                  <Text style={styles.planTagline}>For one agent and basic routines.</Text>
                  <Text style={styles.planSpecs}>Up to 3 members · 12 GB storage · Base speed</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.planRow} onPress={handleJoinCloud} activeOpacity={0.7}>
                  <Text style={styles.planName}>Standard</Text>
                  <Text style={styles.planTagline}>For a small team with daily routines.</Text>
                  <Text style={styles.planSpecs}>Up to 10 members · 50 GB storage · 2× faster</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.planRow, { borderBottomWidth: 0 }]}
                  onPress={handleJoinCloud}
                  activeOpacity={0.7}
                >
                  <Text style={styles.planName}>Pro</Text>
                  <Text style={styles.planTagline}>For many agents and heavy browser work.</Text>
                  <Text style={styles.planSpecs}>Up to 25 members · 100 GB storage · 4× faster</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionHeaderLabel}>On your computer</Text>

              <View style={styles.computerCard}>
                <TouchableOpacity style={styles.computerRow} activeOpacity={0.7}>
                  <Monitor size={18} color="#FFFFFF" />
                  <View style={styles.computerTextCol}>
                    <Text style={styles.computerRowTitle}>Add a cloud server</Text>
                    <Text style={styles.computerRowSub}>
                      In O one, open Settings → Hosted servers and select Add server.
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.computerRow, { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                >
                  <CreditCard size={18} color="#FFFFFF" />
                  <View style={styles.computerTextCol}>
                    <Text style={styles.computerRowTitle}>Change a plan</Text>
                    <Text style={styles.computerRowSub}>In O one, open Settings → Billing.</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.joinServerCard}
                onPress={handleJoinCloud}
                activeOpacity={0.7}
              >
                <Ticket size={20} color="#FFFFFF" />
                <View style={styles.computerTextCol}>
                  <Text style={styles.computerRowTitle}>Join a server</Text>
                  <Text style={styles.computerRowSub}>Use an invitation from a server owner.</Text>
                </View>
                <ChevronRight size={18} color="#71717A" />
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DIRECT SSH REMOTE CONNECTION                                       */}
          {/* ========================================================================= */}
          {activeTab === 'ssh' && (
            <View>
              <View style={styles.introCard}>
                <Text style={styles.introTitle}>Direct SSH Connection</Text>
                <Text style={styles.introSub}>
                  Connect directly to any remote Linux VPS or dedicated server over secure SSH.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Server Display Name</Text>
                  <TextInput
                    style={styles.input}
                    value={sshName}
                    onChangeText={setSshName}
                    placeholder="e.g. Production Ubuntu VPS"
                    placeholderTextColor="#52525B"
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.fieldGroup, { flex: 3 }]}>
                    <Text style={styles.fieldLabel}>Hostname or IP</Text>
                    <TextInput
                      style={styles.input}
                      value={sshHost}
                      onChangeText={setSshHost}
                      placeholder="e.g. 198.51.100.24"
                      placeholderTextColor="#52525B"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Port</Text>
                    <TextInput
                      style={styles.input}
                      value={sshPort}
                      onChangeText={setSshPort}
                      placeholder="22"
                      placeholderTextColor="#52525B"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>User</Text>
                    <TextInput
                      style={styles.input}
                      value={sshUser}
                      onChangeText={setSshUser}
                      placeholder="root"
                      placeholderTextColor="#52525B"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1.5 }]}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={sshPassword}
                      onChangeText={setSshPassword}
                      placeholder="Password"
                      placeholderTextColor="#52525B"
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={handleConnectSSH}
                  disabled={isConnectingSSH}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionText}>
                    {isConnectingSSH ? 'Connecting...' : 'Connect via SSH'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: LAPTOP HOST SERVER (OPENBOT / HERMES)                               */}
          {/* ========================================================================= */}
          {activeTab === 'local' && (
            <View>
              <View style={styles.introCard}>
                <Text style={styles.introTitle}>Local Laptop Host</Text>
                <Text style={styles.introSub}>
                  Connect to your laptop or desktop workstation running the OpenBot host daemon
                  over Wi-Fi or LAN.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Server Name</Text>
                  <TextInput
                    style={styles.input}
                    value={localName}
                    onChangeText={setLocalName}
                    placeholder="e.g. Laptop Host (OpenBot)"
                    placeholderTextColor="#52525B"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Host Daemon URL</Text>
                  <TextInput
                    style={styles.input}
                    value={localHost}
                    onChangeText={setLocalHost}
                    placeholder="10.56.5.83:8443 or localhost:8443"
                    placeholderTextColor="#52525B"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={handleConnectLocal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionText}>Save & Connect Local Server</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    padding: 4,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#24242C',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introCard: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  badgePillText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  introSub: {
    fontSize: 13,
    color: '#A1A1AA',
    lineHeight: 18,
  },
  telemetryCard: {
    backgroundColor: '#16161A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  telemetryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearLogsText: {
    fontSize: 11,
    color: '#71717A',
  },
  packagesCard: {
    backgroundColor: '#16161A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  pkgIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#202026',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgInfoCol: {
    flex: 1,
  },
  pkgTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pkgName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pkgVersion: {
    fontSize: 11,
    color: '#71717A',
  },
  pkgDesc: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 2,
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  installBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  installedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  installedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  installingBox: {
    paddingHorizontal: 12,
  },
  consoleCard: {
    backgroundColor: '#09090B',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  consoleLogLine: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#34D399',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#16161A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0E0E12',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  plansCard: {
    backgroundColor: '#16161A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  planRow: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planTagline: {
    fontSize: 12,
    color: '#D4D4D8',
    marginTop: 2,
  },
  planSpecs: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 4,
  },
  computerCard: {
    backgroundColor: '#16161A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  computerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  computerTextCol: {
    flex: 1,
  },
  computerRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  computerRowSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  joinServerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
});

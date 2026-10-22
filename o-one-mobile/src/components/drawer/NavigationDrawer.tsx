import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
  TouchableWithoutFeedback,
  Alert,
  BackHandler,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Layers,
  Monitor,
  Terminal,
  Smartphone,
  Cloud,
  Settings,
  Check,
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { AddServerModal } from '../server/AddServerModal';
import { SettingsModal } from '../settings/SettingsModal';
import { ServerItem } from '../../types';

export const NavigationDrawer: React.FC = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const sheetWidth = Math.min(Math.round(screenWidth * 0.83), 340);
  const insets = useSafeAreaInsets();

  const {
    isDrawerOpen,
    closeDrawer,
    servers,
    activeServerId,
    selectServer,
    deleteServer,
  } = useAppStore();

  const [isMounted, setIsMounted] = useState(isDrawerOpen);
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Animation values: slide strictly from the LEFT edge
  const slideAnim = useRef(new Animated.Value(-sheetWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handle hardware back press on Android
  useEffect(() => {
    if (!isDrawerOpen) return;
    const backAction = () => {
      closeDrawer();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isDrawerOpen, closeDrawer]);

  useEffect(() => {
    if (isDrawerOpen) {
      setIsMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 22,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -sheetWidth,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsMounted(false);
      });
    }
  }, [isDrawerOpen, sheetWidth]);

  const handleClose = () => {
    closeDrawer();
  };

  const handleSelectServer = (server: ServerItem) => {
    selectServer(server.id);
  };

  const handleDeleteServer = (server: ServerItem) => {
    Alert.alert(
      'Remove Server',
      `Are you sure you want to remove "${server.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteServer(server.id),
        },
      ]
    );
  };

  if (!isMounted && !isDrawerOpen) return null;

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 24
  );
  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <View
      style={[styles.overlayRoot, { width: screenWidth, height: screenHeight }]}
      pointerEvents={isDrawerOpen ? 'auto' : 'none'}
    >
      {/* Dim Backdrop (Tap closes drawer) */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            width: screenWidth,
            height: screenHeight,
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Servers Drawer Sheet (Strictly sliding from LEFT edge - matching dense_042) */}
      <Animated.View
        style={[
          styles.sheet,
          {
            width: sheetWidth,
            height: screenHeight,
            transform: [{ translateX: slideAnim }],
            paddingTop: topInset + 8,
          },
        ]}
      >
        {/* Header (Matching dense_042 exactly: "Servers" on left, "+" & "Layers" on right) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Servers</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => setShowAddServerModal(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Layers size={18} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Servers List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {servers.map((server) => {
            const isConnected = server.status === 'connected';
            const isActive = server.id === activeServerId;

            return (
              <TouchableOpacity
                key={server.id}
                style={[styles.serverCard, isActive && styles.serverCardActive]}
                onPress={() => handleSelectServer(server)}
                onLongPress={() => handleDeleteServer(server)}
                activeOpacity={0.75}
              >
                {/* Left Server Squoval Icon with green online dot */}
                <View
                  style={[
                    styles.serverIconBox,
                    { backgroundColor: server.color || '#E04848' },
                  ]}
                >
                  {server.type === 'ssh' ? (
                    <Terminal size={24} color="#FFFFFF" strokeWidth={2.2} />
                  ) : server.type === 'phone' ? (
                    <Smartphone size={24} color="#FFFFFF" strokeWidth={2.2} />
                  ) : server.type === 'cloud' ? (
                    <Cloud size={24} color="#FFFFFF" strokeWidth={2.2} />
                  ) : (
                    <Monitor size={24} color="#FFFFFF" strokeWidth={2.2} />
                  )}

                  {/* Green online dot on bottom-right of icon box (Matching dense_042) */}
                  {isConnected && <View style={styles.onlineDot} />}
                </View>

                {/* Server Name & Type */}
                <View style={styles.serverInfoCol}>
                  <Text style={styles.serverNameText} numberOfLines={1}>
                    {server.name}
                  </Text>
                  <Text style={styles.serverTypeText}>{server.typeLabel || 'Local'}</Text>
                </View>

                {/* Active Server indicator */}
                {isActive && (
                  <View style={styles.activeCheckPill}>
                    <Check size={14} color="#10B981" strokeWidth={2.6} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Quick "+ Add Server" Prompt Card */}
          <TouchableOpacity
            style={styles.addServerRow}
            onPress={() => setShowAddServerModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={16} color="#71717A" />
            <Text style={styles.addServerRowText}>Add a new server (SSH / Phone / Cloud)</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Profile Row - FIRMLY PINNED AT BOTTOM (Matching dense_042) */}
        <View style={[styles.bottomProfileBar, { paddingBottom: bottomInset + 8 }]}>
          <TouchableOpacity
            style={styles.profileTouch}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarLetter}>R</Text>
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.profileUsername}>rishisingh7145</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                rishisingh7145@gmail.com
              </Text>
            </View>
          </TouchableOpacity>

          {/* Settings Gear Icon */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings size={22} color="#71717A" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Right side outside touchable area to dismiss */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={[styles.outsideDismiss, { left: sheetWidth }]} />
      </TouchableWithoutFeedback>

      {/* Add Server Modal (SSH, Local, Phone Termux, Cloud) */}
      <AddServerModal
        visible={showAddServerModal}
        onClose={() => setShowAddServerModal(false)}
      />

      {/* Settings Modal (Appearance, Animations, Notifications, etc.) */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  backdropTouch: {
    flex: 1,
  },
  outsideDismiss: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#0E0E11',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'column',
    justifyContent: 'space-between',
    elevation: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    zIndex: 100000,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222226',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  serverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  serverCardActive: {
    backgroundColor: '#1C1C20',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  serverIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#18181B',
  },
  serverInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  serverNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  serverTypeText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  activeCheckPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addServerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 6,
  },
  addServerRowText: {
    fontSize: 12.5,
    color: '#71717A',
  },
  bottomProfileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111114',
  },
  profileTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#272730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  profileUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileEmail: {
    fontSize: 11.5,
    color: '#71717A',
  },
  settingsBtn: {
    padding: 8,
  },
});

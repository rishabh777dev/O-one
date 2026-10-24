import React, { useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Silence transient dev warnings and Expo CLI pings from popping up on mobile device
LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  '[O1 RPC]',
  'WebSocket error',
]);
LogBox.ignoreAllLogs(true);
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { useAppStore } from './src/store/useAppStore';
import { useHostStore } from './src/store/useHostStore';
import { useDistroStore } from './src/store/useDistroStore';
import { useAgentStore } from './src/store/useAgentStore';
import { rpcClient, getDefaultHostUrl } from './src/services/rpcClient';
import { Header } from './src/components/common/Header';
import { InputBar } from './src/components/common/InputBar';
import { NavigationDrawer } from './src/components/drawer/NavigationDrawer';
import { HomeScreen } from './src/screens/HomeScreen';
import { CockpitScreen } from './src/screens/CockpitScreen';
import { ProjectIDEScreen } from './src/screens/ProjectIDEScreen';
import { TerminalScreen } from './src/screens/TerminalScreen';
import { WorkflowsScreen } from './src/screens/WorkflowsScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { AgentBuilderScreen } from './src/screens/AgentBuilderScreen';

export default function App() {
  const { currentSurface, agents, initStore } = useAppStore();

  useEffect(() => {
    // Dynamic host discovery from Metro runtime
    const autoHost = getDefaultHostUrl();
    console.log(`[O1 Init] Dynamically discovered host: ${autoHost}`);
    rpcClient.setHost(autoHost);
    initStore();
    useAgentStore.getState().initMessages();
    useDistroStore.getState().initDistro();
    const unsub = rpcClient.onTelemetry((data) => {
      useHostStore.getState().updateTelemetry({
        specs: `${data.hostname} · ${data.memory}`,
        linuxKernel: data.linuxKernel || 'WSL2 Ubuntu 24.04',
        hermesPid: data.hermes?.daemonPid || 1420,
        status: 'connected',
      });
    });
    return unsub;
  }, []);

  const renderCurrentSurface = () => {
    switch (currentSurface) {
      case 'home':
        return <HomeScreen />;
      case 'cockpit':
        return <CockpitScreen />;
      case 'ide':
        return <ProjectIDEScreen />;
      case 'terminal':
        return <TerminalScreen />;
      case 'workflows':
        return <WorkflowsScreen />;
      case 'marketplace':
        return <MarketplaceScreen />;
      case 'builder':
        return <AgentBuilderScreen />;
      default:
        return <HomeScreen />;
    }
  };

  // Only show generic header on IDE / Workflows surfaces
  const showGenericHeader = currentSurface === 'ide' || currentSurface === 'workflows';

  // Only show bottom chat input bar on Cockpit
  const showBottomInput = currentSurface === 'cockpit';

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />

        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          {/* Global Header (Only for IDE & Workflows) */}
          {showGenericHeader && <Header />}

          {/* Keyboard-aware surface layout */}
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Active Surface */}
            <View style={styles.surfaceContainer}>{renderCurrentSurface()}</View>

            {/* Bottom Chat Input Bar (Only on Cockpit) */}
            {showBottomInput && <InputBar />}
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Left-Side Slider Navigation Drawer (Full-screen root overlay matching OpenBot dense_042) */}
        <NavigationDrawer />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C0C0E',
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#0C0C0E',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0C0C0E',
  },
  surfaceContainer: {
    flex: 1,
    backgroundColor: '#0C0C0E',
  },
});

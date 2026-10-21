import React, { useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { useAppStore } from './src/store/useAppStore';
import { useHostStore } from './src/store/useHostStore';
import { rpcClient } from './src/services/rpcClient';
import { Header } from './src/components/common/Header';
import { InputBar } from './src/components/common/InputBar';
import { NavigationDrawer } from './src/components/drawer/NavigationDrawer';
import { CockpitScreen } from './src/screens/CockpitScreen';
import { ProjectIDEScreen } from './src/screens/ProjectIDEScreen';
import { TerminalScreen } from './src/screens/TerminalScreen';
import { WorkflowsScreen } from './src/screens/WorkflowsScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { AgentBuilderScreen } from './src/screens/AgentBuilderScreen';

export default function App() {
  const { currentSurface, agents, initStore } = useAppStore();

  useEffect(() => {
    initStore();
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
    // If user has zero agents yet, show Blank Slate Agent Genesis
    if (agents.length === 0 || currentSurface === 'builder') {
      return <AgentBuilderScreen />;
    }

    switch (currentSurface) {
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
      default:
        return <CockpitScreen />;
    }
  };

  // Only show bottom input bar on conversation/project surfaces
  const showBottomInput = currentSurface === 'cockpit' || currentSurface === 'ide';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Global Chief / O1 Header */}
        <Header />

        {/* Keyboard-aware surface layout */}
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Active Surface */}
          <View style={styles.surfaceContainer}>{renderCurrentSurface()}</View>

          {/* Bottom Chat Input (Only on Cockpit & IDE) */}
          {showBottomInput && agents.length > 0 && <InputBar />}
        </KeyboardAvoidingView>

        {/* Left-Side Slider Navigation Drawer */}
        <NavigationDrawer />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  keyboardContainer: {
    flex: 1,
  },
  surfaceContainer: {
    flex: 1,
  },
});

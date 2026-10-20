import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { useAppStore } from './src/store/useAppStore';
import { Header } from './src/components/common/Header';
import { InputBar } from './src/components/common/InputBar';
import { NavigationDrawer } from './src/components/drawer/NavigationDrawer';
import { CockpitScreen } from './src/screens/CockpitScreen';
import { ProjectIDEScreen } from './src/screens/ProjectIDEScreen';
import { WorkflowsScreen } from './src/screens/WorkflowsScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';

export default function App() {
  const { currentSurface } = useAppStore();

  const renderCurrentSurface = () => {
    switch (currentSurface) {
      case 'cockpit':
        return <CockpitScreen />;
      case 'ide':
        return <ProjectIDEScreen />;
      case 'workflows':
        return <WorkflowsScreen />;
      case 'marketplace':
        return <MarketplaceScreen />;
      default:
        return <CockpitScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Global Chief Header */}
        <Header />

        {/* Active Surface (100% full height - zero bottom tab clutter) */}
        <View style={styles.surfaceContainer}>{renderCurrentSurface()}</View>

        {/* Pure Bottom Input Bar */}
        <InputBar />

        {/* All-in-Slider Navigation Drawer */}
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
  surfaceContainer: {
    flex: 1,
  },
});

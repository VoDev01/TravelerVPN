import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AppLayout from '@/components/AppLayout';
import MainScreen from '@/screens/MainScreen';
import LocationDialogue from '@/components/LocationDialogue';
import SettingsScreen from '@/screens/SettingsScreen';

export default function AppNavigation() {
  const [activeScreen, setActiveScreen] = useState<'main' | 'settings'>('main');
  const [showLocationDialogue, setShowLocationDialogue] = useState(false);

  return (
    <AppLayout>
      {activeScreen === 'main' && <MainScreen />}
      {activeScreen === 'settings' && <SettingsScreen />}
      {showLocationDialogue && (
        <LocationDialogue onClose={() => setShowLocationDialogue(false)} />
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

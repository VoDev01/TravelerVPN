import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MainScreen from '@/screens/MainScreen';
import LocationScreen from '@/screens/LocationScreen';
import SettingsScreen from '@/screens/SettingsScreen';

export default function AppNavigation() {
  const [activeScreen, setActiveScreen] = useState<'main' | 'location' | 'settings'>('main');

  return (
    <View style={styles.container}>
      {activeScreen === 'main' && <MainScreen />}
      {activeScreen === 'location' && <LocationScreen />}
      {activeScreen === 'settings' && <SettingsScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});

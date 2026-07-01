import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';

export default function MainScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsIcon}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>127 mph</Text>
        <Text style={styles.statsText} style={{ color: '#ff4444' }}>
          ↓ 10 mins
        </Text>
        <Text style={styles.altitudeText}>10016 ft</Text>
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.airportName}>Frankfurt</Text>
        <Svg width={150} height={150} viewBox="0 0 150 150">
          <Circle cx="75" cy="75" r="70" fill="none" stroke="#666" strokeWidth="1" />
          <Circle cx="75" cy="75" r="50" fill="none" stroke="#666" strokeWidth="1" />
          <Path
            d="M 75 30 L 85 75 L 75 100 L 65 75 Z"
            fill="white"
            stroke="white"
            strokeWidth="2"
          />
        </Svg>
      </View>

      <TouchableOpacity style={styles.landingButton}>
        <Text style={styles.landingButtonText}>Точка посадки 📍</Text>
      </TouchableOpacity>

      <View style={styles.storageContainer}>
        <View style={styles.storageIcon}>
          <Text style={styles.storageIconText}>📦</Text>
        </View>
        <Text style={styles.storageText}>4.5/5.0 GB</Text>
        <View style={styles.storageBar}>
          <View style={styles.storageBarFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statsText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: '600',
  },
  altitudeText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  mapContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  airportName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  landingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 30,
  },
  landingButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  storageContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  storageIcon: {
    marginBottom: 10,
  },
  storageIconText: {
    fontSize: 24,
  },
  storageText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  storageBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    width: '90%',
  },
});

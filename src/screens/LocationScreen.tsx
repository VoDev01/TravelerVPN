import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';

const airports = [
  { id: '1', name: 'Frankfurt', flag: '🇩🇪', code: 'FRA' },
  { id: '2', name: 'Berlin', flag: '🇩🇪', code: 'BER' },
  { id: '3', name: 'Munich', flag: '🇩🇪', code: 'MUC' },
];

export default function LocationScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsIcon}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Доступные аэропорты</Text>
      </View>

      <View style={styles.airportsList}>
        {airports.map((airport, index) => (
          <TouchableOpacity
            key={airport.id}
            style={[
              styles.airportItem,
              index === 0 && styles.airportItemSelected,
            ]}
          >
            <View style={styles.airportInfo}>
              <Text style={styles.flagText}>{airport.flag}</Text>
              <View style={styles.airportDetails}>
                <Text style={styles.airportName}>{airport.name}</Text>
                <Text style={styles.airportCode}>{airport.code}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.mapLabel}>Frankfurt</Text>
        <Svg width={150} height={150} viewBox="0 0 150 150">
          <Circle cx="75" cy="75" r="70" fill="none" stroke="#555" strokeWidth="1" />
          <Circle cx="75" cy="75" r="50" fill="none" stroke="#555" strokeWidth="1" />
          <Path
            d="M 75 30 L 85 75 L 75 100 L 65 75 Z"
            fill="#666"
            stroke="#888"
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
    alignItems: 'center',
    marginBottom: 20,
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
  title: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 20,
  },
  airportsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  airportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  airportItemSelected: {
    backgroundColor: 'rgba(100, 200, 100, 0.3)',
  },
  airportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 24,
    marginRight: 12,
  },
  airportDetails: {
    justifyContent: 'center',
  },
  airportName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  airportCode: {
    color: '#888',
    fontSize: 12,
  },
  mapContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mapLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
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
    color: '#888',
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

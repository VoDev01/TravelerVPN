import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function MainScreen() {
  const handleSettingsPress = () => {
    // TODO: Navigate to settings
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsIcon}>
          <Image
            source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PC9zdmc+' }}
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0.00</Text>
          <Text style={styles.statLabel}>Mbps</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0.00</Text>
          <Text style={styles.statLabel}>GB</Text>
        </View>
      </View>

      <View style={styles.connectionStatus}>
        <Text style={styles.connectionText}>Not Connected</Text>
        <Text style={styles.ipText}>0.0.0.0</Text>
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.locationName}>Location</Text>
        <View style={styles.mapPlaceholder}>
          <Image
            source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiPjwvc3ZnPg==' }}
            style={styles.mapImage}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => {
          // TODO: Connect to VPN
        }}
      >
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>

      <View style={styles.dataContainer}>
        <View style={styles.dataIcon}>
          <Image
            source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PC9zdmc+' }}
            style={styles.dataIconImage}
          />
        </View>
        <Text style={styles.dataLabel}>Data Used</Text>
        <View style={styles.dataBar}>
          <View style={styles.dataBarFill} />
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 24,
    height: 24,
    tintColor: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  connectionStatus: {
    alignItems: 'center',
    marginBottom: 30,
  },
  connectionText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
  ipText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  mapContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  locationName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  mapPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    width: 150,
    height: 150,
  },
  connectButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  connectButtonText: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: '600',
  },
  dataContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  dataIcon: {
    marginBottom: 10,
  },
  dataIconImage: {
    width: 24,
    height: 24,
    tintColor: '#888',
  },
  dataLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  dataBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dataBarFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    width: '0%',
  },
});

import { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [setting1, setSetting1] = useState(true);
  const [setting2, setSetting2] = useState(true);
  const [setting3, setSetting3] = useState(true);
  const [setting4, setSetting4] = useState(false);

  const handleLanguageChange = () => {
    // TODO: Change language
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.settingsContainer}>
        <View style={styles.settingGroup}>
          <Text style={styles.groupLabel}>Language</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Choose Language</Text>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={handleLanguageChange}
            >
              <Text style={styles.languageText}>English</Text>
              <Text style={styles.languageArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.groupLabel}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingLabel}>Connection alerts</Text>
            </View>
            <Switch
              value={setting1}
              onValueChange={setSetting1}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor={setting1 ? '#00ff00' : '#999'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingLabel}>Data usage alerts</Text>
            </View>
            <Switch
              value={setting2}
              onValueChange={setSetting2}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor={setting2 ? '#00ff00' : '#999'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingLabel}>Security warnings</Text>
            </View>
            <Switch
              value={setting3}
              onValueChange={setSetting3}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor={setting3 ? '#00ff00' : '#999'}
            />
          </View>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.groupLabel}>Privacy</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingLabel}>Kill switch</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor="#00ff00"
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingLabel}>DNS protection</Text>
            </View>
            <Switch
              value={setting4}
              onValueChange={setSetting4}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor={setting4 ? '#00ff00' : '#999'}
            />
          </View>
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
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
  },
  settingsContainer: {
    flex: 1,
  },
  settingGroup: {
    marginBottom: 28,
  },
  groupLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#888',
  },
  settingLabel: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  languageText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  languageArrow: {
    color: '#888',
    fontSize: 10,
  },
});

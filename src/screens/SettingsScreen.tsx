import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';

export default function SettingsScreen() {
  const [languageEnabled, setLanguageEnabled] = React.useState(true);
  const [setting1, setSetting1] = React.useState(true);
  const [setting2, setSetting2] = React.useState(true);
  const [setting3, setSetting3] = React.useState(true);
  const [setting4, setSetting4] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
      </View>

      <View style={styles.settingsContainer}>
        <View style={styles.settingGroup}>
          <Text style={styles.groupLabel}>Язык</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Скандинавский</Text>
            <View style={styles.languageButton}>
              <Text style={styles.languageText}>Русский</Text>
              <Text style={styles.languageArrow}>▼</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.groupLabel}>Уведомления</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Показывать входящие сообщения</Text>
            <Switch
              value={setting1}
              onValueChange={setSetting1}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor={setting1 ? '#00ff00' : '#999'}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Показывать логи подключения</Text>
            <Switch
              value={setting2}
              onValueChange={setSetting2}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor={setting2 ? '#00ff00' : '#999'}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Показывать долг/Ч подключения</Text>
            <Switch
              value={setting3}
              onValueChange={setSetting3}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor={setting3 ? '#00ff00' : '#999'}
            />
          </View>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.groupLabel}>Оповещения</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Основные уровни</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor="#00ff00"
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Важные события</Text>
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
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsContainer: {
    flex: 1,
  },
  settingGroup: {
    marginBottom: 24,
  },
  groupLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  settingLabel: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  languageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  languageArrow: {
    color: '#888',
    fontSize: 10,
  },
});

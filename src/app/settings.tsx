import ChevronDown from '@/assets/images/chevron_down.svg';
import ChevronUp from '@/assets/images/chevron_up.svg';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

export default function SettingsScreen() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);

  const [setting1, setSetting1] = useState(true);
  const [setting2, setSetting2] = useState(true);
  const [setting3, setSetting3] = useState(true);
  const [setting4, setSetting4] = useState(false);
  const [languages, setLanguage] = useState([
    {label: "English", value: "en"},
    {label: "Русский", value: "ru"}
  ]);

  const handleLanguageChange = () => {
    // TODO: Change language
  };

  return (
    <>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Settings</Text>
    </View>
    <ScrollView style={[styles.settingsContainer, {zIndex: 1000} ]}>
        <View style={styles.settingGroup}>
          <Text style={styles.groupLabel}>Language</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Choose Language</Text>
            <DropDownPicker
              open={open}
              value={value}
              items={languages}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setLanguage}
              listMode='SCROLLVIEW'
              style={{
    backgroundColor: '#3D3D3D',
    borderColor: 'transparent',
    minHeight: 40,
    width: 125,
  }}
  containerStyle={{width: 125}}
  dropDownContainerStyle={{
    backgroundColor: '#3D3D3D',
    borderColor: '#303036',
  }}
  textStyle={{
    color: '#FFFFFF',
    fontSize: 14,
  }}
  ArrowDownIconComponent={() => (
  <ChevronDown width={24} height={24} />
)}
ArrowUpIconComponent={() => (
  <ChevronUp width={24} height={24} />
)}
            />
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
              trackColor={{ false: '#666', true: '#999' }}
              thumbColor={setting4 ? '#00ff00' : '#999'}
            />
          </View>
        </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    rowGap: 12
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
  settingGroup: {
    marginBottom: 28,
  },
  groupLabel: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: '100%'
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
  languageSelect: {
    backgroundColor: "#969696",
    width: 48,
    height: 48,
    borderRadius: 12
  }
});

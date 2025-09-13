// src/Profile/Screens/PrivacySettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const PrivacySettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [settings, setSettings] = useState({
    dataSharing: false,
    analytics: true,
    crashReports: true,
    marketingEmails: false,
    profileVisibility: 'private',
    locationSharing: false,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSettingItem = (title, subtitle, key, showDivider = true) => (
    <View key={key}>
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        <Switch
          value={settings[key]}
          onValueChange={() => handleToggle(key)}
          trackColor={{ false: theme.backgroundGray, true: theme.primaryBackground }}
          thumbColor={settings[key] ? theme.primary : theme.textLight}
        />
      </View>
      {showDivider && <View style={[styles.divider, { backgroundColor: theme.borderColor }]} />}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Privacy Settings
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.container}>
        {/* Data Collection */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Data Collection
          </Text>
          
          {renderSettingItem(
            'Usage Analytics',
            'Help improve the app by sharing anonymous usage data',
            'analytics'
          )}
          
          {renderSettingItem(
            'Crash Reports',
            'Automatically send crash reports to help fix issues',
            'crashReports'
          )}
          
          {renderSettingItem(
            'Location Sharing',
            'Share your location for location-based features',
            'locationSharing',
            false
          )}
        </View>

        {/* Data Sharing */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Data Sharing
          </Text>
          
          {renderSettingItem(
            'Third-party Data Sharing',
            'Allow sharing data with trusted partners',
            'dataSharing'
          )}
          
          {renderSettingItem(
            'Marketing Communications',
            'Receive marketing emails and promotional content',
            'marketingEmails',
            false
          )}
        </View>

        {/* Account Privacy */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Account Privacy
          </Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Coming Soon', 'Profile visibility settings coming soon!')}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                Profile Visibility
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                Control who can see your business profile
              </Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={[styles.settingValueText, { color: theme.textSecondary }]}>
                Private
              </Text>
              <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Data Management
          </Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Data export will be available soon!')}
          >
            <FontAwesome5 name="download" size={16} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              Export My Data
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { marginTop: '8@vs' }]}
            onPress={() => Alert.alert(
              'Delete Account Data',
              'This action cannot be undone. Contact support to proceed.',
              [{ text: 'OK' }]
            )}
          >
            <FontAwesome5 name="trash" size={16} color={theme.danger} />
            <Text style={[styles.actionButtonText, { color: theme.danger }]}>
              Delete My Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.primaryBackground }]}>
          <FontAwesome5 name="shield-alt" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            Your privacy is important to us. We use industry-standard encryption to protect your data and never sell your personal information.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    padding: '8@s',
    width: '40@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: '16@s',
  },
  section: {
    borderRadius: '12@s',
    marginBottom: '16@vs',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: '16@s',
    fontWeight: 'bold',
    padding: '16@s',
    paddingBottom: '12@vs',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
  },
  settingInfo: {
    flex: 1,
    marginRight: '16@s',
  },
  settingTitle: {
    fontSize: '16@s',
    fontWeight: '500',
    marginBottom: '2@vs',
  },
  settingSubtitle: {
    fontSize: '14@s',
    lineHeight: '18@s',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
  },
  settingValueText: {
    fontSize: '14@s',
  },
  divider: {
    height: 1,
    marginLeft: '16@s',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@vs',
    paddingHorizontal: '16@s',
    gap: '8@s',
  },
  actionButtonText: {
    fontSize: '16@s',
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@s',
    borderRadius: '8@s',
    gap: '12@s',
  },
  infoText: {
    flex: 1,
    fontSize: '14@s',
    lineHeight: '18@s',
  },
});

export default PrivacySettingsScreen;
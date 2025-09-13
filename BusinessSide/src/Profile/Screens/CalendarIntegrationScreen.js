// src/Profile/Screens/CalendarIntegrationScreen.js
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

const CalendarIntegrationScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [integrations, setIntegrations] = useState({
    googleCalendar: false,
    appleCalendar: false,
    outlookCalendar: false,
    syncDirection: 'both' // 'both', 'import', 'export'
  });

  const handleToggle = (key) => {
    setIntegrations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConnect = (service) => {
    Alert.alert(
      'Coming Soon', 
      `${service} integration will be available in a future update!`
    );
  };

  const renderIntegrationCard = (icon, title, description, service, isConnected) => (
    <View style={[styles.integrationCard, { backgroundColor: theme.surface }]}>
      <View style={styles.integrationInfo}>
        <View style={styles.integrationHeader}>
          <FontAwesome5 name={icon} size={24} color={theme.primary} />
          <Text style={[styles.integrationTitle, { color: theme.textPrimary }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.integrationDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
        <View style={styles.integrationStatus}>
          <Text style={[
            styles.statusText, 
            { color: isConnected ? theme.success : theme.textLight }
          ]}>
            {isConnected ? 'Connected' : 'Not connected'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.connectButton,
          isConnected 
            ? { backgroundColor: theme.success } 
            : { backgroundColor: theme.primary }
        ]}
        onPress={() => handleConnect(service)}
      >
        <Text style={[styles.connectButtonText, { color: theme.white }]}>
          {isConnected ? 'Disconnect' : 'Connect'}
        </Text>
      </TouchableOpacity>
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
          Calendar Integration
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.primaryBackground }]}>
          <FontAwesome5 name="info-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            Sync your appointments with external calendars to stay organized across all your devices.
          </Text>
        </View>

        {/* Calendar Services */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Available Integrations
        </Text>
        
        {renderIntegrationCard(
          'google',
          'Google Calendar',
          'Sync appointments with your Google Calendar',
          'Google Calendar',
          integrations.googleCalendar
        )}
        
        {renderIntegrationCard(
          'apple',
          'Apple Calendar',
          'Sync appointments with your Apple Calendar',
          'Apple Calendar',
          integrations.appleCalendar
        )}
        
        {renderIntegrationCard(
          'microsoft',
          'Outlook Calendar',
          'Sync appointments with your Outlook Calendar',
          'Outlook Calendar',
          integrations.outlookCalendar
        )}

        {/* Sync Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Sync Settings
          </Text>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
              Sync Direction
            </Text>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
              Two-way sync (Coming Soon)
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
              Auto Sync
            </Text>
            <Switch
              value={false}
              onValueChange={() => Alert.alert('Coming Soon', 'Auto sync will be available soon!')}
              trackColor={{ false: theme.backgroundGray, true: theme.primaryBackground }}
              thumbColor={theme.textLight}
            />
          </View>
        </View>

        {/* Export Options */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Export Options
          </Text>
          
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.primaryBackground }]}
            onPress={() => Alert.alert('Coming Soon', 'Calendar export will be available soon!')}
          >
            <FontAwesome5 name="download" size={16} color={theme.primary} />
            <Text style={[styles.exportButtonText, { color: theme.primary }]}>
              Export Calendar (.ics)
            </Text>
          </TouchableOpacity>
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
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: '16@s',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@s',
    borderRadius: '8@s',
    marginBottom: '24@s',
    gap: '12@s',
  },
  infoText: {
    flex: 1,
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
    lineHeight: '18@s',
  },
  sectionTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '16@s',
  },
  integrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@s',
    borderRadius: '12@s',
    marginBottom: '12@s',
  },
  integrationInfo: {
    flex: 1,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@s',
    gap: '12@s',
  },
  integrationTitle: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
  },
  integrationDescription: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
    marginBottom: '8@s',
    lineHeight: '18@s',
  },
  integrationStatus: {
    marginBottom: '0@s',
  },
  statusText: {
    fontSize: '12@s',
    fontFamily: 'Inter-Medium',
  },
  connectButton: {
    paddingHorizontal: '16@s',
    paddingVertical: '8@s',
    borderRadius: '6@s',
  },
  connectButtonText: {
    fontSize: '14@s',
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    padding: '16@s',
    borderRadius: '12@s',
    marginBottom: '16@s',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@s',
  },
  settingLabel: {
    fontSize: '16@s',
    fontFamily: 'Inter-Medium',
  },
  settingValue: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@s',
    borderRadius: '8@s',
    gap: '8@s',
  },
  exportButtonText: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
  },
});

export default CalendarIntegrationScreen;
// src/Profile/Screens/NotificationSettingsScreen.js
import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

const NotificationSettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [settings, setSettings] = useState({
    // Appointment notifications
    appointmentReminders: true,
    appointmentConfirmations: true,
    appointmentCancellations: true,
    appointmentRescheduling: true,
    
    // Business notifications
    newCustomerRegistrations: true,
    dailyAppointmentSummary: true,
    weeklyBusinessReport: false,
    
    // System notifications
    appUpdates: true,
    maintenanceAlerts: true,
    securityAlerts: true,
    
    // Marketing
    promotionalOffers: false,
    businessTips: true,
    
    // Notification timing
    reminderTiming: '1hour', // '15min', '30min', '1hour', '2hours', '1day'
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleReminderTimingChange = () => {
    const timingOptions = [
      { label: '15 minutes before', value: '15min' },
      { label: '30 minutes before', value: '30min' },
      { label: '1 hour before', value: '1hour' },
      { label: '2 hours before', value: '2hours' },
      { label: '1 day before', value: '1day' },
    ];

    const currentIndex = timingOptions.findIndex(option => option.value === settings.reminderTiming);
    const nextIndex = (currentIndex + 1) % timingOptions.length;
    const newTiming = timingOptions[nextIndex].value;

    const newSettings = { ...settings, reminderTiming: newTiming };
    saveSettings(newSettings);
  };

  const getReminderTimingLabel = () => {
    const timingLabels = {
      '15min': '15 minutes before',
      '30min': '30 minutes before',
      '1hour': '1 hour before',
      '2hours': '2 hours before',
      '1day': '1 day before',
    };
    return timingLabels[settings.reminderTiming] || '1 hour before';
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

  const renderSection = (title, items) => (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        {title}
      </Text>
      {items.map((item, index) => 
        renderSettingItem(item.title, item.subtitle, item.key, index < items.length - 1)
      )}
    </View>
  );

  const appointmentNotifications = [
    {
      title: 'Appointment Reminders',
      subtitle: 'Get notified before upcoming appointments',
      key: 'appointmentReminders'
    },
    {
      title: 'Appointment Confirmations',
      subtitle: 'When customers confirm their appointments',
      key: 'appointmentConfirmations'
    },
    {
      title: 'Appointment Cancellations',
      subtitle: 'When customers cancel appointments',
      key: 'appointmentCancellations'
    },
    {
      title: 'Appointment Rescheduling',
      subtitle: 'When customers reschedule appointments',
      key: 'appointmentRescheduling'
    }
  ];

  const businessNotifications = [
    {
      title: 'New Customer Registrations',
      subtitle: 'When new customers sign up',
      key: 'newCustomerRegistrations'
    },
    {
      title: 'Daily Summary',
      subtitle: 'Daily overview of appointments and business metrics',
      key: 'dailyAppointmentSummary'
    },
    {
      title: 'Weekly Report',
      subtitle: 'Weekly business performance report',
      key: 'weeklyBusinessReport'
    }
  ];

  const systemNotifications = [
    {
      title: 'App Updates',
      subtitle: 'New features and improvements',
      key: 'appUpdates'
    },
    {
      title: 'Maintenance Alerts',
      subtitle: 'Scheduled maintenance notifications',
      key: 'maintenanceAlerts'
    },
    {
      title: 'Security Alerts',
      subtitle: 'Important security-related notifications',
      key: 'securityAlerts'
    }
  ];

  const marketingNotifications = [
    {
      title: 'Promotional Offers',
      subtitle: 'Special offers and discounts',
      key: 'promotionalOffers'
    },
    {
      title: 'Business Tips',
      subtitle: 'Tips to grow your business',
      key: 'businessTips'
    }
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          Notification Settings
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Appointment Notifications */}
        {renderSection('Appointment Notifications', appointmentNotifications)}

        {/* Reminder Timing */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Reminder Timing
          </Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleReminderTimingChange}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                Send reminders
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                {getReminderTimingLabel()}
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Business Notifications */}
        {renderSection('Business Notifications', businessNotifications)}

        {/* System Notifications */}
        {renderSection('System Notifications', systemNotifications)}

        {/* Marketing */}
        {renderSection('Marketing & Tips', marketingNotifications)}

        {/* Quiet Hours */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Quiet Hours
          </Text>
          {renderSettingItem(
            'Enable Quiet Hours',
            'Pause notifications during specified hours',
            'quietHoursEnabled',
            false
          )}
          
          {settings.quietHoursEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.borderColor }]} />
              <View style={styles.quietHoursContainer}>
                <Text style={[styles.quietHoursLabel, { color: theme.textSecondary }]}>
                  Quiet hours: {settings.quietHoursStart} - {settings.quietHoursEnd}
                </Text>
                <Text style={[styles.quietHoursNote, { color: theme.textLight }]}>
                  Emergency notifications will still be delivered
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Test Notification */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primaryBackground }]}
            onPress={() => Alert.alert('Test Notification', 'This is how your notifications will look!')}
          >
            <FontAwesome5 name="bell" size={16} color={theme.primary} />
            <Text style={[styles.testButtonText, { color: theme.primary }]}>
              Send Test Notification
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
  divider: {
    height: 1,
    marginLeft: '16@s',
  },
  quietHoursContainer: {
    paddingHorizontal: '16@s',
    paddingBottom: '16@vs',
  },
  quietHoursLabel: {
    fontSize: '14@s',
    marginBottom: '4@vs',
  },
  quietHoursNote: {
    fontSize: '12@s',
    fontStyle: 'italic',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '16@s',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    gap: '8@s',
  },
  testButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: '16@s',
  },
});

export default NotificationSettingsScreen;
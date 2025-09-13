// src/Profile/Screens/HelpSupportScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const HelpSupportScreen = ({ navigation }) => {
  const { theme } = useTheme();

  const handleContactSupport = (method) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:support@appointmentsapp.com');
        break;
      case 'phone':
        Linking.openURL('tel:+1234567890');
        break;
      case 'chat':
        Alert.alert('Live Chat', 'Live chat support coming soon!');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature will be available soon!');
    }
  };

  const renderHelpItem = (icon, title, description, onPress) => (
    <TouchableOpacity
      style={[styles.helpItem, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <View style={[styles.helpIcon, { backgroundColor: theme.primaryBackground }]}>
        <FontAwesome5 name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.helpContent}>
        <Text style={[styles.helpTitle, { color: theme.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.helpDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
      <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
    </TouchableOpacity>
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
          Help & Support
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.container}>
        {/* Contact Support */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Contact Support
        </Text>
        
        {renderHelpItem(
          'envelope',
          'Email Support',
          'Get help via email within 24 hours',
          () => handleContactSupport('email')
        )}
        
        {renderHelpItem(
          'phone',
          'Phone Support',
          'Call us for immediate assistance',
          () => handleContactSupport('phone')
        )}
        
        {renderHelpItem(
          'comments',
          'Live Chat',
          'Chat with our support team',
          () => handleContactSupport('chat')
        )}

        {/* Help Topics */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Help Topics
        </Text>
        
        {renderHelpItem(
          'calendar-plus',
          'Managing Appointments',
          'Learn how to create, edit, and manage appointments',
          () => Alert.alert('Coming Soon', 'Help articles coming soon!')
        )}
        
        {renderHelpItem(
          'users',
          'Customer Management',
          'How to add and manage your customers',
          () => Alert.alert('Coming Soon', 'Help articles coming soon!')
        )}
        
        {renderHelpItem(
          'cog',
          'Settings & Configuration',
          'Customize your app settings and preferences',
          () => Alert.alert('Coming Soon', 'Help articles coming soon!')
        )}
        
        {renderHelpItem(
          'credit-card',
          'Payments & Billing',
          'Understanding payments and billing features',
          () => Alert.alert('Coming Soon', 'Help articles coming soon!')
        )}

        {/* Resources */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Resources
        </Text>
        
        {renderHelpItem(
          'book',
          'User Guide',
          'Comprehensive guide to using the app',
          () => Alert.alert('Coming Soon', 'User guide coming soon!')
        )}
        
        {renderHelpItem(
          'video',
          'Video Tutorials',
          'Watch video tutorials and walkthroughs',
          () => Alert.alert('Coming Soon', 'Video tutorials coming soon!')
        )}
        
        {renderHelpItem(
          'question-circle',
          'FAQ',
          'Frequently asked questions and answers',
          () => Alert.alert('Coming Soon', 'FAQ section coming soon!')
        )}

        {/* App Info */}
        <View style={[styles.appInfo, { backgroundColor: theme.surface }]}>
          <Text style={[styles.appInfoTitle, { color: theme.textPrimary }]}>
            App Information
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Version:
            </Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              1.0.0
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Support Email:
            </Text>
            <Text style={[styles.infoValue, { color: theme.primary }]}>
              support@appointmentsapp.com
            </Text>
          </View>
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
  sectionTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '16@s',
    marginTop: '8@s',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@s',
    borderRadius: '12@s',
    marginBottom: '8@s',
  },
  helpIcon: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
    marginBottom: '4@s',
  },
  helpDescription: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
    lineHeight: '18@s',
  },
  appInfo: {
    padding: '16@s',
    borderRadius: '12@s',
    marginTop: '24@s',
  },
  appInfoTitle: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
    marginBottom: '12@s',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '8@s',
  },
  infoLabel: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
  },
  infoValue: {
    fontSize: '14@s',
    fontFamily: 'Inter-Medium',
  },
});

export default HelpSupportScreen;
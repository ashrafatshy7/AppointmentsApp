// src/Profile/Screens/TermsPoliciesScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const TermsPoliciesScreen = ({ navigation }) => {
  const { theme } = useTheme();

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
          Terms & Policies
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.container}>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Terms of Service
          </Text>
          <Text style={[styles.content, { color: theme.textSecondary }]}>
            By using this application, you agree to our terms of service. These terms outline your rights and responsibilities when using our appointment management platform.
          </Text>
          <Text style={[styles.lastUpdated, { color: theme.textLight }]}>
            Last updated: January 2024
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.content, { color: theme.textSecondary }]}>
            We respect your privacy and are committed to protecting your personal data. Our privacy policy explains how we collect, use, and safeguard your information.
          </Text>
          <Text style={[styles.lastUpdated, { color: theme.textLight }]}>
            Last updated: January 2024
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Data Usage Policy
          </Text>
          <Text style={[styles.content, { color: theme.textSecondary }]}>
            Learn how we handle your business and customer data, including storage, processing, and sharing practices.
          </Text>
          <Text style={[styles.lastUpdated, { color: theme.textLight }]}>
            Last updated: January 2024
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.primaryBackground }]}>
          <FontAwesome5 name="info-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            Full terms and policies documents will be available in a future update. For questions, contact support@appointmentsapp.com
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
    padding: '16@s',
    borderRadius: '12@s',
    marginBottom: '16@vs',
  },
  sectionTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    marginBottom: '12@vs',
  },
  content: {
    fontSize: '14@s',
    lineHeight: '20@s',
    marginBottom: '12@vs',
  },
  lastUpdated: {
    fontSize: '12@s',
    fontStyle: 'italic',
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

export default TermsPoliciesScreen;
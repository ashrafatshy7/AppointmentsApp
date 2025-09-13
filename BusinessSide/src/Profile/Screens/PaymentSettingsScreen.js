// src/Profile/Screens/PaymentSettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const PaymentSettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [paymentMethods] = useState([
    {
      id: 1,
      type: 'card',
      brand: 'visa',
      last4: '4242',
      isDefault: true,
      expiryMonth: 12,
      expiryYear: 2025
    }
  ]);

  const renderPaymentMethod = (method) => (
    <View key={method.id} style={[styles.paymentMethodCard, { backgroundColor: theme.background }]}>
      <View style={styles.paymentMethodInfo}>
        <View style={styles.paymentMethodHeader}>
          <FontAwesome5 
            name={method.brand === 'visa' ? 'cc-visa' : 'credit-card'} 
            size={24} 
            color={method.brand === 'visa' ? '#1A1F71' : theme.textSecondary} 
          />
          <Text style={[styles.cardNumber, { color: theme.textPrimary }]}>
            •••• •••• •••• {method.last4}
          </Text>
          {method.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: theme.success }]}>
              <Text style={[styles.defaultBadgeText, { color: theme.white }]}>
                Default
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardExpiry, { color: theme.textSecondary }]}>
          Expires {method.expiryMonth}/{method.expiryYear}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => Alert.alert('Edit Payment Method', 'Payment method editing coming soon!')}
      >
        <FontAwesome5 name="edit" size={16} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderFeatureCard = (icon, title, description, status = 'available') => (
    <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.featureIcon, { backgroundColor: theme.primaryBackground }]}>
        <FontAwesome5 name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.featureInfo}>
        <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
        {status === 'coming-soon' && (
          <Text style={[styles.comingSoonText, { color: theme.warning }]}>
            Coming Soon
          </Text>
        )}
      </View>
      <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
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
          Payment Settings
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Payment Methods */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Payment Methods
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => Alert.alert('Add Payment Method', 'Payment method integration coming soon!')}
            >
              <FontAwesome5 name="plus" size={14} color={theme.white} />
              <Text style={[styles.addButtonText, { color: theme.white }]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
          
          {paymentMethods.length > 0 ? (
            paymentMethods.map(renderPaymentMethod)
          ) : (
            <View style={styles.noPaymentMethods}>
              <FontAwesome5 name="credit-card" size={40} color={theme.textLight} />
              <Text style={[styles.noPaymentMethodsText, { color: theme.textSecondary }]}>
                No payment methods added yet
              </Text>
            </View>
          )}
        </View>

        {/* Payment Features */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Payment Features
          </Text>
          
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => Alert.alert('Feature Coming Soon', 'Online payments integration will be available soon!')}
          >
            {renderFeatureCard(
              'globe',
              'Online Payments',
              'Accept payments online from customers',
              'coming-soon'
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => Alert.alert('Feature Coming Soon', 'Automated invoicing will be available soon!')}
          >
            {renderFeatureCard(
              'file-invoice-dollar',
              'Automated Invoicing',
              'Send invoices automatically after appointments',
              'coming-soon'
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => Alert.alert('Feature Coming Soon', 'Payment reminders will be available soon!')}
          >
            {renderFeatureCard(
              'bell-dollar',
              'Payment Reminders',
              'Send payment reminders to customers',
              'coming-soon'
            )}
          </TouchableOpacity>
        </View>

        {/* Payment Analytics */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Payment Analytics
          </Text>
          
          <View style={styles.analyticsGrid}>
            <View style={[styles.analyticsCard, { backgroundColor: theme.background }]}>
              <Text style={[styles.analyticsValue, { color: theme.success }]}>
                $0.00
              </Text>
              <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>
                This Month
              </Text>
            </View>
            
            <View style={[styles.analyticsCard, { backgroundColor: theme.background }]}>
              <Text style={[styles.analyticsValue, { color: theme.textPrimary }]}>
                $0.00
              </Text>
              <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>
                Total Revenue
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.viewReportsButton, { backgroundColor: theme.primaryBackground }]}
            onPress={() => Alert.alert('Coming Soon', 'Detailed payment reports will be available soon!')}
          >
            <FontAwesome5 name="chart-line" size={16} color={theme.primary} />
            <Text style={[styles.viewReportsButtonText, { color: theme.primary }]}>
              View Detailed Reports
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Security
          </Text>
          
          <View style={styles.securityInfo}>
            <FontAwesome5 name="shield-alt" size={24} color={theme.success} />
            <View style={styles.securityText}>
              <Text style={[styles.securityTitle, { color: theme.textPrimary }]}>
                Secure Payments
              </Text>
              <Text style={[styles.securityDescription, { color: theme.textSecondary }]}>
                All payment data is encrypted and secured with industry-standard SSL encryption.
              </Text>
            </View>
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
    padding: '16@s',
    marginBottom: '16@vs',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  sectionTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '16@s',
    gap: '4@s',
  },
  addButtonText: {
    fontSize: '14@s',
    fontWeight: '600',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@s',
    borderRadius: '8@s',
    marginBottom: '8@vs',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4@vs',
    gap: '12@s',
  },
  cardNumber: {
    fontSize: '16@s',
    fontWeight: '500',
    flex: 1,
  },
  defaultBadge: {
    paddingHorizontal: '8@s',
    paddingVertical: '2@vs',
    borderRadius: '10@s',
  },
  defaultBadgeText: {
    fontSize: '10@s',
    fontWeight: 'bold',
  },
  cardExpiry: {
    fontSize: '14@s',
  },
  editButton: {
    padding: '8@s',
  },
  noPaymentMethods: {
    alignItems: 'center',
    paddingVertical: '32@vs',
    gap: '12@vs',
  },
  noPaymentMethodsText: {
    fontSize: '16@s',
  },
  featureButton: {
    marginBottom: '8@vs',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@s',
    borderRadius: '8@s',
    gap: '12@s',
  },
  featureIcon: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '2@vs',
  },
  featureDescription: {
    fontSize: '14@s',
    lineHeight: '18@s',
  },
  comingSoonText: {
    fontSize: '12@s',
    fontWeight: '600',
    marginTop: '4@vs',
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: '12@s',
    marginBottom: '16@vs',
  },
  analyticsCard: {
    flex: 1,
    padding: '16@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: '24@s',
    fontWeight: 'bold',
    marginBottom: '4@vs',
  },
  analyticsLabel: {
    fontSize: '12@s',
    textAlign: 'center',
  },
  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    gap: '8@s',
  },
  viewReportsButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '12@s',
  },
  securityText: {
    flex: 1,
  },
  securityTitle: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '4@vs',
  },
  securityDescription: {
    fontSize: '14@s',
    lineHeight: '18@s',
  },
});

export default PaymentSettingsScreen;
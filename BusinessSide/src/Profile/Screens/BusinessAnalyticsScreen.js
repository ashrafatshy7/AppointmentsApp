// src/Profile/Screens/BusinessAnalyticsScreen.js
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

const BusinessAnalyticsScreen = ({ navigation }) => {
  const { theme } = useTheme();

  const renderAnalyticsCard = (title, value, icon, color) => (
    <View style={[styles.analyticsCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.cardIcon, { backgroundColor: `${color}20` }]}>
        <FontAwesome5 name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.cardValue, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{title}</Text>
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
          Business Analytics
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.container}>
        {/* Coming Soon Notice */}
        <View style={[styles.comingSoonCard, { backgroundColor: theme.primaryBackground }]}>
          <FontAwesome5 name="chart-line" size={40} color={theme.primary} />
          <Text style={[styles.comingSoonTitle, { color: theme.primary }]}>
            Analytics Coming Soon!
          </Text>
          <Text style={[styles.comingSoonDescription, { color: theme.primary }]}>
            Get detailed insights about your business performance, customer trends, and revenue analytics.
          </Text>
        </View>

        {/* Preview Cards */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          What's Coming
        </Text>
        
        <View style={styles.analyticsGrid}>
          {renderAnalyticsCard('Total Revenue', '$0', 'dollar-sign', theme.success)}
          {renderAnalyticsCard('Total Customers', '0', 'users', theme.primary)}
          {renderAnalyticsCard('Avg. Rating', '0.0', 'star', theme.warning)}
          {renderAnalyticsCard('Repeat Customers', '0%', 'redo', theme.info)}
        </View>

        <View style={[styles.featureList, { backgroundColor: theme.surface }]}>
          <Text style={[styles.featureListTitle, { color: theme.textPrimary }]}>
            Upcoming Features:
          </Text>
          <View style={styles.feature}>
            <FontAwesome5 name="check-circle" size={16} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Revenue tracking and trends
            </Text>
          </View>
          <View style={styles.feature}>
            <FontAwesome5 name="check-circle" size={16} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Customer analytics and insights
            </Text>
          </View>
          <View style={styles.feature}>
            <FontAwesome5 name="check-circle" size={16} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Service performance metrics
            </Text>
          </View>
          <View style={styles.feature}>
            <FontAwesome5 name="check-circle" size={16} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Appointment trends and patterns
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
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: '16@s',
  },
  comingSoonCard: {
    alignItems: 'center',
    padding: '32@s',
    borderRadius: '12@s',
    marginBottom: '24@vs',
  },
  comingSoonTitle: {
    fontSize: '24@s',
    fontWeight: 'bold',
    marginTop: '16@vs',
    marginBottom: '8@vs',
  },
  comingSoonDescription: {
    fontSize: '16@s',
    textAlign: 'center',
    lineHeight: '22@s',
  },
  sectionTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    marginBottom: '16@vs',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: '24@vs',
  },
  analyticsCard: {
    width: '48%',
    padding: '16@s',
    borderRadius: '12@s',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  cardIcon: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  cardValue: {
    fontSize: '24@s',
    fontWeight: 'bold',
    marginBottom: '4@vs',
  },
  cardTitle: {
    fontSize: '12@s',
    textAlign: 'center',
  },
  featureList: {
    padding: '16@s',
    borderRadius: '12@s',
  },
  featureListTitle: {
    fontSize: '16@s',
    fontWeight: 'bold',
    marginBottom: '16@vs',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
    gap: '12@s',
  },
  featureText: {
    fontSize: '14@s',
    flex: 1,
  },
});

export default BusinessAnalyticsScreen;
// src/Dashboard/Screens/BusinessDashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import Constants from 'expo-constants';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import { getDashboardData } from '../Service/AppointmentService';
import DashboardHeader from '../Components/DashboardHeader';
import StatCard from '../Components/StatCard';
import QuickActions from '../Components/QuickActions';
import Colors from '../../Constants/Colors';

const BusinessDashboardScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { activeBusiness, refreshBusinessData } = useBusiness();
  
  // State
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const businessId = activeBusiness?._id || activeBusiness?.id;
      if (!businessId) {
        console.warn('No business ID available for dashboard data');
        setDashboardData({
          todayCount: 0,
          upcomingCount: 0,
          revenue: 0,
          otherStat: 0
        });
        return;
      }
      
      const data = await getDashboardData(businessId);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeBusiness]);

  // Load data when screen comes into focus or when refresh param is passed
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.refresh) {
        // Clear the refresh param to avoid continuous refreshing
        navigation.setParams({ refresh: undefined });
        // Only refresh if explicitly requested via params
        loadDashboardData();
        refreshBusinessData();
      } else {
        // Just load dashboard data on normal focus, no business data refresh to avoid rate limiting
        loadDashboardData();
      }
    }, [route?.params?.refresh, loadDashboardData, navigation, refreshBusinessData])
  );

  // Handle manual refresh (pull to refresh)
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh both business data and dashboard data
      await Promise.all([
        refreshBusinessData(),
        loadDashboardData()
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={Colors.primary}
          translucent={true}
        />
        <View style={styles.statusBarArea} />
        <View style={styles.headerContainer}>
          <DashboardHeader 
            theme={theme}
            navigation={navigation}
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primary, fontFamily: 'Inter-Regular' }]}>
            Loading dashboard...
          </Text>
        </View>
      </View>
    );
  }

  const counts = dashboardData || {};

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Colors.primary}
        translucent={true}
      />
      <View style={styles.statusBarArea} />
      <View style={styles.headerContainer}>
        <DashboardHeader 
          theme={theme}
          navigation={navigation}
        />
      </View>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        
        {/* Main Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: 'Poppins-SemiBold' }]}>
              Overview
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <StatCard
              title="Today Upcoming"
              value={counts.todayUpcomingCount || 0}
              icon="calendar-day"
              color={Colors.primary}
              theme={theme}
            />
            <StatCard
              title="Today Completed"
              value={counts.todayCompletedCount || 0}
              icon="check-circle"
              color={Colors.success}
              theme={theme}
            />
            <StatCard
              title="This Month"
              value={`${counts.completedThisMonthCount || 0}/${counts.totalThisMonthCount || 0}`}
              icon="calendar-alt"
              color={Colors.info}
              theme={theme}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <QuickActions theme={theme} navigation={navigation} />
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  statusBarArea: {
    height: Constants.statusBarHeight,
    backgroundColor: Colors.primary,
  },
  headerContainer: {
    backgroundColor: Colors.primary,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.primaryUltraLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '15@s',
    fontSize: '16@s',
    fontFamily: 'Inter-Regular',
  },
  section: {
    padding: '18@s',
    marginBottom: '10@s',
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@s',
  },
  sectionTitle: {
    fontSize: '16@s',
    fontFamily: 'Poppins-SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default BusinessDashboardScreen;
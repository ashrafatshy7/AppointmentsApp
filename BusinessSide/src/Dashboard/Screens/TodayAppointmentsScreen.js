// src/Dashboard/Screens/TodayAppointmentsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import { getTodayAppointments } from '../Service/AppointmentService';

const TodayAppointmentsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { activeBusiness } = useBusiness();
  
  // State
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Load today's appointments
  const loadAppointments = useCallback(async () => {
    try {
      const businessId = activeBusiness?._id || activeBusiness?.id;
      if (!businessId) {
        console.warn('No business ID available for today appointments');
        setAppointments([]);
        return;
      }
      
      const todayAppointments = await getTodayAppointments(businessId);
      
      // Sort by time
      todayAppointments.sort((a, b) => {
        const timeA = a.time ? a.time.replace(':', '') : '0000';
        const timeB = b.time ? b.time.replace(':', '') : '0000';
        return timeA.localeCompare(timeB);
      });
      
      setAppointments(todayAppointments);
    } catch (error) {
      console.error('Error loading today appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeBusiness]);
  
  // Initial load - only when business data is available
  useEffect(() => {
    if (activeBusiness) {
      loadAppointments();
    }
  }, [loadAppointments, activeBusiness]);
  
  // Handle refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    loadAppointments();
  };
  
  // Get filtered appointments based on status
  const getFilteredAppointments = () => {
    if (filterStatus === 'all') {
      return appointments;
    }
    
    return appointments.filter(appointment => appointment.status === filterStatus);
  };
  
  // Format today's date
  const formatTodayDate = () => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };
  
  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterStatus === 'all' && [styles.activeFilterButton, { backgroundColor: theme.primaryBackground }]
        ]}
        onPress={() => setFilterStatus('all')}
      >
        <Text style={[
          styles.filterButtonText,
          filterStatus === 'all' && { color: theme.primary, fontWeight: '600' }
        ]}>
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterStatus === 'booked' && [styles.activeFilterButton, { backgroundColor: theme.primaryBackground }]
        ]}
        onPress={() => setFilterStatus('booked')}
      >
        <Text style={[
          styles.filterButtonText,
          filterStatus === 'booked' && { color: theme.primary, fontWeight: '600' }
        ]}>
          Booked
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterStatus === 'completed' && [styles.activeFilterButton, { backgroundColor: '#E6F9F0' }]
        ]}
        onPress={() => setFilterStatus('completed')}
      >
        <Text style={[
          styles.filterButtonText,
          filterStatus === 'completed' && { color: theme.success, fontWeight: '600' }
        ]}>
          Completed
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterStatus === 'canceled' && [styles.activeFilterButton, { backgroundColor: '#FEEEEE' }]
        ]}
        onPress={() => setFilterStatus('canceled')}
      >
        <Text style={[
          styles.filterButtonText,
          filterStatus === 'canceled' && { color: theme.danger, fontWeight: '600' }
        ]}>
          Canceled
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Simple appointment item component (inline)
  const renderAppointmentItem = ({ item }) => {
    const formatTime = (dateTime) => {
      const date = new Date(dateTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
      <TouchableOpacity
        style={[styles.appointmentCard, { backgroundColor: theme.background }]}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item._id || item.id })}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.customerInfo}>
            <View style={[styles.customerInitials, { backgroundColor: theme.primaryBackground }]}>
              <Text style={[styles.initialsText, { color: theme.primary }]}>
                {item.user?.name ? item.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'UK'}
              </Text>
            </View>
            <View>
              <Text style={[styles.customerName, { color: theme.textPrimary }]}>
                {item.user?.name || 'Unknown Customer'}
              </Text>
              <Text style={[styles.appointmentService, { color: theme.textSecondary }]}>
                {item.service?.name || 'Unknown Service'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: 
              item.status === 'booked' ? theme.primaryBackground : 
              item.status === 'completed' ? '#E6F9F0' : 
              '#FEEEEE'
          }]}>
            <Text style={[styles.statusText, { 
              color: 
                item.status === 'booked' ? theme.primary : 
                item.status === 'completed' ? theme.success : 
                theme.danger 
            }]}>
              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
            </Text>
          </View>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailItem}>
            <FontAwesome5 name="clock" size={14} color={theme.textLight} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: theme.textPrimary }]}>
              {item.time || 'No time'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <FontAwesome5 name="hourglass-half" size={14} color={theme.textLight} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: theme.textPrimary }]}>
              {item.durationMinutes ? `${item.durationMinutes} min` : 'No duration'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="calendar-day" size={60} color={theme.textLight} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        No appointments today
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {filterStatus !== 'all' 
          ? `You don't have any ${filterStatus} appointments today` 
          : 'Your schedule is clear for today'}
      </Text>
    </View>
  );
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading today's appointments...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Today's Appointments
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.dateContainer}>
          <FontAwesome5 name="calendar-day" size={16} color={theme.primary} style={styles.dateIcon} />
          <Text style={[styles.dateText, { color: theme.textPrimary }]}>
            {formatTodayDate()}
          </Text>
        </View>
        
        {renderFilterButtons()}
        
        <FlatList
          data={getFilteredAppointments()}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
        
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddAppointment')}
        >
          <FontAwesome5 name="plus" size={20} color={theme.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '16@s',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: '4@s',
  },
  headerTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: '28@s',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
  },
  dateIcon: {
    marginRight: '8@s',
  },
  dateText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: '16@s',
    paddingBottom: '16@vs',
  },
  filterButton: {
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    marginRight: '8@s',
    borderRadius: '20@s',
    backgroundColor: '#F5F5F5',
  },
  activeFilterButton: {
    backgroundColor: '#E8F5E9',
  },
  filterButtonText: {
    fontSize: '14@s',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: '16@s',
    paddingBottom: '80@vs',
    flexGrow: 1,
  },
  appointmentCard: {
    borderRadius: '12@s',
    padding: '16@s',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerInitials: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@s',
  },
  initialsText: {
    fontSize: '16@s',
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  appointmentService: {
    fontSize: '14@s',
    marginTop: '2@vs',
  },
  statusBadge: {
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '12@s',
  },
  statusText: {
    fontSize: '12@s',
    fontWeight: '500',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: '6@s',
    width: '20@s',
  },
  detailText: {
    fontSize: '14@s',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '60@vs',
  },
  emptyTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    marginTop: '16@vs',
    marginBottom: '8@vs',
  },
  emptySubtitle: {
    fontSize: '16@s',
    textAlign: 'center',
    marginBottom: '24@vs',
    paddingHorizontal: '32@s',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs',
    paddingHorizontal: '16@s',
    borderRadius: '8@s',
  },
  addButtonIcon: {
    marginRight: '8@s',
  },
  addButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: '24@vs',
    right: '24@s',
    width: '56@s',
    height: '56@s',
    borderRadius: '28@s',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.3,
    shadowRadius: '4@s',
    elevation: 4,
  },
});

export default TodayAppointmentsScreen;

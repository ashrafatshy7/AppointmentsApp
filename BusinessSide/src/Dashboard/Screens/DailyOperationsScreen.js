// src/Dashboard/Screens/DailyOperationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import { getTodayAppointments, getTomorrowAppointments, updateAppointmentStatus } from '../Service/AppointmentService';

const DailyOperationsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { activeBusiness, refreshBusinessData } = useBusiness();
  
  // State
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Load data when screen comes into focus - only when business data is available
  useFocusEffect(
    useCallback(() => {
      if (activeBusiness) {
        loadData();
      }
    }, [activeBusiness, loadData])
  );

  // Load appointments data
  const loadData = useCallback(async () => {
    try {
      const businessId = activeBusiness?._id || activeBusiness?.id;
      if (!businessId) {
        console.warn('No business ID available for daily operations');
        setTodayAppointments([]);
        setTomorrowAppointments([]);
        return;
      }
      
      const [todayData, tomorrowData] = await Promise.all([
        getTodayAppointments(businessId),
        getTomorrowAppointments(businessId)
      ]);
      
      // Sort today's appointments by time
      const sortedToday = todayData.sort((a, b) => {
        const timeA = a.time ? a.time.replace(':', '') : '0000';
        const timeB = b.time ? b.time.replace(':', '') : '0000';
        return timeA.localeCompare(timeB);
      });
      
      setTodayAppointments(sortedToday);
      setTomorrowAppointments(tomorrowData.slice(0, 4)); // Only first 4 for preview
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeBusiness]);

  // Handle refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh both business data (including profile image) and appointments data
      await Promise.all([
        refreshBusinessData(),
        loadData()
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Quick status update
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdatingStatus(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      
      // Update local state
      setTodayAppointments(prev => prev.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
      
      Alert.alert('Success', `Appointment marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update appointment status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle phone call
  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'No phone number available for this customer');
    }
  };

  // Handle SMS
  const handleMessage = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`sms:${phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'No phone number available for this customer');
    }
  };

  // Get current time status
  const getTimeStatus = (appointmentTime) => {
    if (!appointmentTime) return 'no-time';
    
    const now = new Date();
    const [hours, minutes] = appointmentTime.split(':');
    const appointmentDate = new Date();
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diffMinutes = (appointmentDate - now) / (1000 * 60);
    
    if (diffMinutes < -15) return 'overdue';
    if (diffMinutes < 0) return 'current';
    if (diffMinutes < 30) return 'upcoming';
    return 'scheduled';
  };

  // Format today's date
  const formatTodayDate = () => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  // Get customer initials
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name
      .split(' ')
      .map(n => n && n[0] ? n[0] : '')
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };

  // Render quick action buttons
  const renderQuickActions = () => (
    <View style={[styles.quickActionsContainer, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddAppointment')}
        >
          <FontAwesome5 name="plus" size={16} color={theme.white} />
          <Text style={[styles.quickActionText, { color: theme.white }]}>Add Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.info }]}
          onPress={() => navigation.navigate('AppointmentsList')}
        >
          <FontAwesome5 name="search" size={16} color={theme.white} />
          <Text style={[styles.quickActionText, { color: theme.white }]}>Search</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );

  // Render appointment item with quick actions
  const renderAppointmentItem = (appointment) => {
    const timeStatus = getTimeStatus(appointment.time);
    const isUpdating = updatingStatus === appointment._id;
    
    return (
      <View key={appointment._id} style={[styles.appointmentCard, { backgroundColor: theme.background }]}>
        {/* Time and Status Indicator */}
        <View style={styles.appointmentHeader}>
          <View style={styles.timeContainer}>
            <Text style={[styles.appointmentTime, { 
              color: timeStatus === 'overdue' ? theme.danger : 
                     timeStatus === 'current' ? theme.warning : 
                     timeStatus === 'upcoming' ? theme.primary : theme.textPrimary 
            }]}>
              {appointment.time || 'No time'}
            </Text>
            {timeStatus === 'overdue' && (
              <Text style={[styles.statusIndicator, { color: theme.danger }]}>OVERDUE</Text>
            )}
            {timeStatus === 'current' && (
              <Text style={[styles.statusIndicator, { color: theme.warning }]}>NOW</Text>
            )}
            {timeStatus === 'upcoming' && (
              <Text style={[styles.statusIndicator, { color: theme.primary }]}>SOON</Text>
            )}
          </View>
          
          <View style={[styles.statusBadge, { 
            backgroundColor: 
              appointment.status === 'booked' ? theme.primaryBackground : 
              appointment.status === 'completed' ? '#E6F9F0' : 
              appointment.status === 'canceled' ? '#FEEEEE' : 
              appointment.status === 'no-show' ? '#FFF3E0' : theme.backgroundLight
          }]}>
            <Text style={[styles.statusText, { 
              color: 
                appointment.status === 'booked' ? theme.primary : 
                appointment.status === 'completed' ? theme.success : 
                appointment.status === 'canceled' ? theme.danger :
                appointment.status === 'no-show' ? theme.warning : theme.textSecondary
            }]}>
              {appointment.status ? appointment.status.replace('-', ' ').toUpperCase() : 'UNKNOWN'}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <TouchableOpacity
          style={styles.customerSection}
          onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: appointment._id })}
        >
          <View style={styles.customerInfo}>
            <View style={[styles.customerInitials, { backgroundColor: theme.primaryBackground }]}>
              <Text style={[styles.initialsText, { color: theme.primary }]}>
                {getInitials(appointment.user?.name)}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={[styles.customerName, { color: theme.textPrimary }]}>
                {appointment.user?.name || 'Unknown Customer'}
              </Text>
              <Text style={[styles.serviceName, { color: theme.textSecondary }]}>
                {appointment.service?.name || 'Unknown Service'}
              </Text>
              <Text style={[styles.duration, { color: theme.textLight }]}>
                {appointment.durationMinutes ? `${appointment.durationMinutes} min` : 'No duration'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Contact Actions */}
          <View style={styles.contactActions}>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.success }]}
                              onPress={() => handleCall(appointment.user?.phone)}
            >
              <FontAwesome5 name="phone" size={14} color={theme.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.info }]}
                              onPress={() => handleMessage(appointment.user?.phone)}
            >
              <FontAwesome5 name="comment" size={14} color={theme.white} />
            </TouchableOpacity>
          </View>

          {/* Status Actions - Only show for booked appointments */}
          {appointment.status === 'booked' && (
            <View style={styles.statusActions}>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: theme.success }]}
                onPress={() => handleStatusUpdate(appointment._id, 'completed')}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <>
                    <FontAwesome5 name="check" size={12} color={theme.white} />
                    <Text style={[styles.statusButtonText, { color: theme.white }]}>Done</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: theme.warning }]}
                onPress={() => handleStatusUpdate(appointment._id, 'no-show')}
                disabled={isUpdating}
              >
                <FontAwesome5 name="user-times" size={12} color={theme.white} />
                <Text style={[styles.statusButtonText, { color: theme.white }]}>No Show</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: theme.danger }]}
                onPress={() => handleStatusUpdate(appointment._id, 'canceled')}
                disabled={isUpdating}
              >
                <FontAwesome5 name="times" size={12} color={theme.white} />
                <Text style={[styles.statusButtonText, { color: theme.white }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render tomorrow preview
  const renderTomorrowPreview = () => {
    if (tomorrowAppointments.length === 0) return null;

    return (
      <View style={[styles.tomorrowContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.tomorrowHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Tomorrow Preview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AppointmentsList')}>
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {tomorrowAppointments.map((appointment, index) => (
          <TouchableOpacity
            key={appointment._id}
            style={[styles.tomorrowItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: appointment._id })}
          >
            <Text style={[styles.tomorrowTime, { color: theme.primary }]}>
              {appointment.time || 'No time'}
            </Text>
            <Text style={[styles.tomorrowCustomer, { color: theme.textPrimary }]}>
              {appointment.user?.name || 'Unknown Customer'}
            </Text>
            <Text style={[styles.tomorrowService, { color: theme.textSecondary }]}>
              {appointment.service?.name || 'Unknown Service'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading daily operations...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Daily Operations
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {formatTodayDate()}
          </Text>
        </View>

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Today's Appointments */}
        <View style={styles.todayContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Today's Schedule ({todayAppointments.length})
          </Text>
          
          {todayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="calendar-day" size={48} color={theme.textLight} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No appointments today
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Your schedule is clear for today
              </Text>
            </View>
          ) : (
            todayAppointments.map((appointment) => renderAppointmentItem(appointment))
          )}
        </View>

        {/* Tomorrow Preview */}
        {renderTomorrowPreview()}

        <View style={{ height: 20 }} />
      </ScrollView>
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
    padding: '16@s',
    paddingBottom: '8@vs',
  },
  headerTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: '14@s',
    marginTop: '3@vs',
  },
  quickActionsContainer: {
    marginHorizontal: '12@s',
    padding: '12@s',
    borderRadius: '10@s',
    marginBottom: '12@vs',
  },
  sectionTitle: {
    fontSize: '16@s',
    fontWeight: 'bold',
    marginBottom: '10@vs',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@vs',
    paddingHorizontal: '8@s',
    borderRadius: '8@s',
    marginHorizontal: '4@s',
  },
  quickActionText: {
    marginLeft: '8@s',
    fontSize: '14@s',
    fontWeight: '600',
  },
  todayContainer: {
    padding: '16@s',
  },
  appointmentCard: {
    borderRadius: '12@s',
    padding: '16@s',
    marginBottom: '12@vs',
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
  timeContainer: {
    flex: 1,
  },
  appointmentTime: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  statusIndicator: {
    fontSize: '12@s',
    fontWeight: '600',
    marginTop: '2@vs',
  },
  statusBadge: {
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '12@s',
  },
  statusText: {
    fontSize: '11@s',
    fontWeight: '600',
  },
  customerSection: {
    marginBottom: '12@vs',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  serviceName: {
    fontSize: '14@s',
    marginTop: '2@vs',
  },
  duration: {
    fontSize: '12@s',
    marginTop: '2@vs',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactActions: {
    flexDirection: 'row',
  },
  contactButton: {
    width: '36@s',
    height: '36@s',
    borderRadius: '18@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8@s',
  },
  statusActions: {
    flexDirection: 'row',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '10@s',
    paddingVertical: '6@vs',
    borderRadius: '16@s',
    marginLeft: '6@s',
  },
  statusButtonText: {
    fontSize: '12@s',
    fontWeight: '600',
    marginLeft: '4@s',
  },
  tomorrowContainer: {
    marginHorizontal: '16@s',
    padding: '16@s',
    borderRadius: '12@s',
    marginBottom: '16@vs',
  },
  tomorrowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  viewAllText: {
    fontSize: '14@s',
    fontWeight: '600',
  },
  tomorrowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '8@vs',
    borderBottomWidth: 1,
  },
  tomorrowTime: {
    fontSize: '14@s',
    fontWeight: '600',
    width: '60@s',
  },
  tomorrowCustomer: {
    fontSize: '14@s',
    fontWeight: '500',
    flex: 1,
    marginLeft: '12@s',
  },
  tomorrowService: {
    fontSize: '12@s',
    marginLeft: '8@s',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: '40@vs',
  },
  emptyTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    marginTop: '16@vs',
    marginBottom: '8@vs',
  },
  emptySubtitle: {
    fontSize: '14@s',
    textAlign: 'center',
  },
});

export default DailyOperationsScreen;
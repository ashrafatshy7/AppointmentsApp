// src/Dashboard/AppointmentDetails/AppointmentDetailsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../Context/ThemeContext';
import { 
  getAppointmentById, 
  updateAppointmentStatus 
} from '../Service/AppointmentService';
import StatusBadge from './StatusBadge';

const AppointmentDetailsScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { appointmentId, refresh } = route.params;
  
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Load appointment details
  const loadAppointment = useCallback(async () => {
    setIsLoading(true);
    try {
      const appointmentData = await getAppointmentById(appointmentId);
      
      if (!appointmentData) {
        Alert.alert('Error', 'Appointment not found');
        navigation.goBack();
        return;
      }
      
      setAppointment(appointmentData);
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, navigation]);
  
  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);
  
  // Refresh when coming back from reschedule or when focus changes
  useFocusEffect(
    useCallback(() => {
      if (refresh) {
        loadAppointment();
        // Clear the refresh param to avoid repeated refreshes
        navigation.setParams({ refresh: undefined });
      }
    }, [refresh, loadAppointment, navigation])
  );
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleTimeString(undefined, options);
  };
  
  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
  
      const updated = await updateAppointmentStatus(appointmentId, newStatus);
      
      setAppointment(updated);
      
      // Show success message
      Alert.alert(
        'Status Updated',
        `Appointment status changed to ${newStatus}`
      );
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error details:', {
        message: error.message,
        appointmentId,
        newStatus
      });
      Alert.alert(
        'Error', 
        `Failed to update appointment status: ${error.message}`
      );
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Get initials from customer name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name
      .split(' ')
      .map(n => n && n[0] ? n[0] : '')
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading appointment details...
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
            Appointment Details
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditAppointment', { appointmentId })}
            style={styles.editButton}
          >
            <FontAwesome5 name="edit" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Status section */}
          <View style={[styles.statusSection, { backgroundColor: theme.backgroundLight }]}>
            <View style={styles.statusContainer}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
                Status
              </Text>
              <StatusBadge status={appointment.status} />
            </View>
            
            <View style={styles.statusActions}>
              {appointment.status === 'booked' && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: theme.success + '20' }
                    ]}
                    onPress={() => handleStatusChange('completed')}
                    disabled={isUpdating}
                  >
                    <FontAwesome5 name="check-circle" size={14} color={theme.success} />
                    <Text style={[styles.statusButtonText, { color: theme.success }]}>
                      Complete
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: theme.danger + '20' }
                    ]}
                    onPress={() => handleStatusChange('canceled')}
                    disabled={isUpdating}
                  >
                    <FontAwesome5 name="times-circle" size={14} color={theme.danger} />
                    <Text style={[styles.statusButtonText, { color: theme.danger }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              
              {(appointment.status === 'completed' || appointment.status === 'canceled') && (
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    { backgroundColor: theme.primary + '20' }
                  ]}
                  onPress={() => handleStatusChange('booked')}
                  disabled={isUpdating}
                >
                  <FontAwesome5 name="undo" size={14} color={theme.primary} />
                  <Text style={[styles.statusButtonText, { color: theme.primary }]}>
                    Return to Booked
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Customer info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Customer
            </Text>
            
            <TouchableOpacity
              style={[styles.customerCard, { backgroundColor: theme.backgroundLight }]}
                              onPress={() => navigation.navigate('CustomerDetails', { customerId: appointment.user?._id })}
            >
              {appointment.customerImage ? (
                <Image source={{ uri: appointment.customerImage }} style={styles.customerImage} />
              ) : (
                <View style={[
                  styles.initialsContainer, 
                  { backgroundColor: theme.primaryBackground }
                ]}>
                  <Text style={[styles.initials, { color: theme.primary }]}>
                    {getInitials(appointment?.user?.name)}
                  </Text>
                </View>
              )}
              
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: theme.textPrimary }]}>
                  {appointment?.user?.name || 'Unknown Customer'}
                </Text>
                <Text style={[styles.viewProfileText, { color: theme.primary }]}>
                  View Profile
                </Text>
              </View>
              
              <View style={styles.customerActions}>
                <TouchableOpacity
                  style={[styles.customerAction, { backgroundColor: theme.primary + '15' }]}
                  onPress={() => navigation.navigate('CustomerChat', { customerId: appointment.user?._id })}
                >
                  <FontAwesome5 name="comment" size={16} color={theme.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.customerAction, { backgroundColor: theme.info + '15' }]}
                  onPress={() => {
                    // In a real app, this would initiate a phone call
                    Alert.alert('Call Customer', 'This would initiate a phone call to the customer');
                  }}
                >
                  <FontAwesome5 name="phone" size={16} color={theme.info} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Service details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Service Details
            </Text>
            
            <View style={[styles.detailsCard, { backgroundColor: theme.backgroundLight }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Service
                </Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {appointment.service?.name || 'Unknown Service'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Price
                </Text>
                <Text style={[styles.detailValue, { color: theme.primary, fontWeight: 'bold' }]}>
                  ${appointment.service?.price || '0'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Duration
                </Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {appointment.durationMinutes || appointment.service?.durationMinutes || 'Unknown'} minutes
                </Text>
              </View>
            </View>
          </View>
          
          {/* Date and time */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Date & Time
            </Text>
            
            <View style={[styles.detailsCard, { backgroundColor: theme.backgroundLight }]}>
              <View style={styles.detailRow}>
                <View style={styles.dateTimeItem}>
                  <FontAwesome5 name="calendar-alt" size={16} color={theme.primary} style={styles.dateTimeIcon} />
                  <Text style={[styles.dateTimeLabel, { color: theme.textSecondary }]}>Date</Text>
                  <Text style={[styles.dateTimeValue, { color: theme.textPrimary }]}>
                    {appointment.date ? formatDate(appointment.date) : 'No date'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.dateTimeItem}>
                  <FontAwesome5 name="clock" size={16} color={theme.primary} style={styles.dateTimeIcon} />
                  <Text style={[styles.dateTimeLabel, { color: theme.textSecondary }]}>Time</Text>
                  <Text style={[styles.dateTimeValue, { color: theme.textPrimary }]}>
                    {appointment.time || 'No time'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.rescheduleButton, { borderColor: theme.border }]}
                onPress={() => navigation.navigate('RescheduleAppointment', { 
                  appointmentId, 
                  appointment 
                })}
              >
                <FontAwesome5 name="calendar-alt" size={14} color={theme.textSecondary} style={styles.rescheduleIcon} />
                <Text style={[styles.rescheduleText, { color: theme.textSecondary }]}>
                  Reschedule
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Notes */}
          {appointment.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Notes
              </Text>
              
              <View style={[styles.notesCard, { backgroundColor: theme.backgroundLight }]}>
                <Text style={[styles.notesText, { color: theme.textPrimary }]}>
                  {appointment.notes}
                </Text>
              </View>
            </View>
          )}
          
          {/* Creation info */}
          <View style={styles.section}>
            <Text style={[styles.creationInfo, { color: theme.textLight }]}>
              Created on {new Date(appointment.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        {/* Action buttons */}
        <View style={[styles.actionButtons, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('CustomerChat', { customerId: appointment.customerId })}
          >
            <FontAwesome5 name="comment" size={16} color={theme.white} style={styles.actionButtonIcon} />
            <Text style={[styles.actionButtonText, { color: theme.white }]}>
              Message Customer
            </Text>
          </TouchableOpacity>
        </View>
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
    marginTop: '12@vs',
    fontSize: '14@s',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: '3@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  editButton: {
    padding: '3@s',
  },
  statusSection: {
    padding: '12@s',
    marginBottom: '10@vs',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12@vs',
  },
  statusLabel: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  statusActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '6@vs',
    paddingHorizontal: '12@s',
    borderRadius: '6@s',
    marginRight: '10@s',
  },
  statusButtonText: {
    fontSize: '12@s',
    fontWeight: '600',
    marginLeft: '4@s',
  },
  section: {
    padding: '12@s',
  },
  sectionTitle: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '10@vs',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '12@s',
    borderRadius: '10@s',
  },
  customerImage: {
    width: '48@s',
    height: '48@s',
    borderRadius: '24@s',
  },
  initialsContainer: {
    width: '48@s',
    height: '48@s',
    borderRadius: '24@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  customerInfo: {
    flex: 1,
    marginLeft: '12@s',
  },
  customerName: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '3@vs',
  },
  viewProfileText: {
    fontSize: '12@s',
    fontWeight: '500',
  },
  customerActions: {
    flexDirection: 'row',
  },
  customerAction: {
    width: '32@s',
    height: '32@s',
    borderRadius: '16@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '6@s',
  },
  detailsCard: {
    padding: '12@s',
    borderRadius: '10@s',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  detailLabel: {
    fontSize: '14@s',
  },
  detailValue: {
    fontSize: '14@s',
  },
  dateTimeItem: {
    flex: 1,
  },
  dateTimeIcon: {
    marginBottom: '3@vs',
  },
  dateTimeLabel: {
    fontSize: '12@s',
    marginBottom: '3@vs',
  },
  dateTimeValue: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10@s',
    borderRadius: '6@s',
    borderWidth: 1,
    marginTop: '6@vs',
  },
  rescheduleIcon: {
    marginRight: '6@s',
  },
  rescheduleText: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  notesCard: {
    padding: '12@s',
    borderRadius: '10@s',
  },
  notesText: {
    fontSize: '14@s',
    lineHeight: '20@s',
  },
  creationInfo: {
    fontSize: '12@s',
    textAlign: 'center',
  },
  bottomPadding: {
    height: '60@vs',
  },
  actionButtons: {
    padding: '12@s',
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12@s',
    borderRadius: '6@s',
  },
  messageButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonIcon: {
    marginRight: '6@s',
  },
  actionButtonText: {
    fontSize: '14@s',
    fontWeight: '600',
  },
});

export default AppointmentDetailsScreen;

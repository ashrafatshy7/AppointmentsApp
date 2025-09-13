// src/Dashboard/AddAppointment/RescheduleScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimeSelector from './DateTimeSelector';
import { useTheme } from '../../Context/ThemeContext';
import { getAppointmentById, rescheduleAppointment } from '../Service/AppointmentService';

const RescheduleScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { appointmentId, appointment: appointmentData } = route.params;
  
  const [appointment] = useState(appointmentData);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize date and time from appointment data
  useEffect(() => {
    if (!appointment) {
      Alert.alert('Error', 'No appointment data provided');
      navigation.goBack();
      return;
    }
    
    // Set initial date and time values from the appointment
    let appointmentDateTime = new Date();
    
    if (appointment.date) {
      try {
        // Try different date parsing methods
        if (appointment.time) {
          // If we have both date and time
          appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
        } else {
          // If we only have date
          appointmentDateTime = new Date(appointment.date);
        }
        
        // Check if the parsed date is valid
        if (isNaN(appointmentDateTime.getTime())) {
          // Try parsing with different format
          appointmentDateTime = new Date(appointment.date.replace(/-/g, '/'));
          
          if (appointment.time && !isNaN(appointmentDateTime.getTime())) {
            const [hours, minutes] = appointment.time.split(':');
            appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
          }
        }
        
        // Final fallback if still invalid
        if (isNaN(appointmentDateTime.getTime())) {
          appointmentDateTime = new Date();
        }
      } catch (error) {
        console.log('Error parsing appointment date:', error);
        appointmentDateTime = new Date();
      }
    }
    
    setSelectedDateTime(new Date(appointmentDateTime));
  }, [appointment, navigation]);
  
  // Format date for display
  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  // Check if the date/time has changed
  const hasChanges = () => {
    if (!appointment) return false;
    
    const originalDateTime = appointment.date && appointment.time 
      ? new Date(`${appointment.date}T${appointment.time}`)
      : new Date(appointment.dateTime || Date.now());
    
    return Math.abs(originalDateTime.getTime() - selectedDateTime.getTime()) > 60000; // 1 minute tolerance
  };
  
  // Handle reschedule
  const handleReschedule = async () => {
    if (!hasChanges()) {
      Alert.alert('No Changes', 'Please select a different date or time');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newDateStr = selectedDateTime.toISOString().split('T')[0];
      const newTimeStr = selectedDateTime.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      await rescheduleAppointment(appointmentId, {
        date: newDateStr,
        time: newTimeStr,
        dateTime: selectedDateTime.toISOString()
      });
      
      Alert.alert(
        'Appointment Rescheduled',
        'The appointment has been successfully rescheduled.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('AppointmentDetails', { 
              appointmentId,
              refresh: true // Signal to refresh the appointment details
            }) 
          }
        ]
      );
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert('Error', 'Failed to reschedule appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Error state if no appointment data
  if (!appointment) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.primary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.white }]}>
            No appointment data available
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.white, marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.cancelButtonText, { color: theme.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.primary }]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <View style={styles.container}>
        {/* Green Header */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.white} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.white }]}>
            Reschedule Appointment
          </Text>
        </View>
        
        {/* Content with rounded top */}
        <View style={[styles.contentWrapper, { backgroundColor: theme.background }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Current appointment details */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Current Details
            </Text>
            
            <View style={styles.appointmentDetails}>
              <View style={styles.detailItem}>
                <FontAwesome5 name="user" size={16} color={theme.textLight} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.textPrimary }]}>
                  {appointment.user?.name || appointment.customerName || 'Unknown Customer'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <FontAwesome5 name="cut" size={16} color={theme.textLight} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.textPrimary }]}>
                  {appointment.service?.name || appointment.serviceName || 'Unknown Service'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <FontAwesome5 name="calendar-day" size={16} color={theme.textLight} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.textPrimary }]}>
                  {appointment.date ? formatDate(new Date(appointment.date)) : 'Invalid Date'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <FontAwesome5 name="clock" size={16} color={theme.textLight} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.textPrimary }]}>
                  {appointment.time || 'No time set'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* New date & time selector */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              New Date & Time
            </Text>
            
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Select a new date and time for this appointment
            </Text>
            
            <DateTimeSelector
              selectedDateTime={selectedDateTime}
              onDateTimeSelect={setSelectedDateTime}
              selectedService={appointment.service}
              theme={theme}
            />
          </View>
          
            {/* Summary */}
            <View style={[styles.summarySection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>
              Summary of Changes
            </Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryColumn}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Original Date & Time
                </Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {appointment.date ? formatDate(new Date(appointment.date)) : 'Invalid Date'}
                </Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {appointment.time || 'No time set'}
                </Text>
              </View>
              
              <FontAwesome5 name="arrow-right" size={16} color={theme.textLight} style={styles.arrowIcon} />
              
              <View style={styles.summaryColumn}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  New Date & Time
                </Text>
                <Text style={[
                  styles.summaryValue, 
                  { 
                    color: appointment.date && selectedDateTime.toDateString() !== new Date(appointment.date).toDateString() 
                      ? theme.primary 
                      : theme.textPrimary,
                    fontWeight: appointment.date && selectedDateTime.toDateString() !== new Date(appointment.date).toDateString() 
                      ? 'bold' 
                      : 'normal',
                  }
                ]}>
                  {formatDate(selectedDateTime)}
                </Text>
                <Text style={[
                  styles.summaryValue,
                  {
                    color: appointment.time && formatTime(selectedDateTime) !== appointment.time
                      ? theme.primary 
                      : theme.textPrimary,
                    fontWeight: appointment.time && formatTime(selectedDateTime) !== appointment.time
                      ? 'bold' 
                      : 'normal',
                  }
                ]}>
                  {formatTime(selectedDateTime)}
                </Text>
              </View>
              </View>
            </View>
          </ScrollView>
          
          {/* Action buttons */}
          <View style={[styles.actionButtons, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.rescheduleButton, 
              { 
                backgroundColor: theme.primary,
                opacity: (!hasChanges() || isSubmitting) ? 0.6 : 1
              }
            ]}
            onPress={handleReschedule}
            disabled={!hasChanges() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <>
                <FontAwesome5 
                  name="calendar-check" 
                  size={16} 
                  color={theme.white} 
                  style={styles.rescheduleButtonIcon} 
                />
                <Text style={[styles.rescheduleButtonText, { color: theme.white }]}>
                  Confirm Reschedule
                </Text>
              </>
            )}
          </TouchableOpacity>
          </View>
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
    marginTop: '16@vs',
    fontSize: '16@s',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
  },
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: '20@s',
    borderTopRightRadius: '20@s',
    marginTop: '-10@vs',
    paddingTop: '10@vs',
  },
  backButton: {
    marginRight: '16@s',
    padding: '4@s',
  },
  headerTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    padding: '20@s',
    margin: '16@s',
    marginBottom: '12@vs',
    borderRadius: '16@s',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: '18@s',
    fontWeight: '600',
    marginBottom: '8@vs',
  },
  sectionSubtitle: {
    fontSize: '14@s',
    marginBottom: '16@vs',
  },
  appointmentDetails: {
    marginTop: '8@vs',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  detailIcon: {
    width: '24@s',
    marginRight: '12@s',
  },
  detailText: {
    fontSize: '16@s',
  },
  summarySection: {
    margin: '16@s',
    marginTop: '8@vs',
    padding: '20@s',
    borderRadius: '16@s',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: '18@s',
    fontWeight: '600',
    marginBottom: '16@vs',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryColumn: {
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: '16@s',
  },
  summaryLabel: {
    fontSize: '14@s',
    marginBottom: '8@vs',
  },
  summaryValue: {
    fontSize: '16@s',
    marginBottom: '4@vs',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: '20@s',
    borderTopWidth: 0,
    paddingBottom: '24@vs',
  },
  cancelButton: {
    flex: 1,
    height: '52@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '12@s',
    borderWidth: 2,
    marginRight: '12@s',
  },
  cancelButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  rescheduleButton: {
    flex: 2,
    height: '52@vs',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '12@s',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rescheduleButtonIcon: {
    marginRight: '8@s',
  },
  rescheduleButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
});

export default RescheduleScreen;

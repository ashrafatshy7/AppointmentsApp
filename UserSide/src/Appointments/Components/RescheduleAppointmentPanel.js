// src/AppointmentsPage/RescheduleAppointmentPanel.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../Constants/Colors';
import { ScaledSheet } from "react-native-size-matters";
import { useTheme } from '../../Context/ThemeContext';

import AppointmentEventEmitter from '../../Utils/AppointmentEventEmitter';
import AppointmentService from '../Service/AppointmentService';
// import { fetchBusinessDetails } from '../../BusinessSearch/Service/DataService'; // Removed - file deleted
// import { businessBookedTimes } from '../../BusinessSearch/Service/MockData'; // Removed - using dynamic data
import { generateTimeSlots, removeBookedTimeSlot } from '../../BusinessSearch/Service/TimeUtils'; 

// Memoized Calendar component to prevent re-renders
const MemoizedCalendar = React.memo(Calendar);

// Separate component for time slot selection to reduce re-renders
const TimeSlotSelection = React.memo(({ availableTimes, selectedTime, onTimeSelect, onBackPress, isLoading, selectedDate, formatDate }) => {
  const { theme } = useTheme();
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  if (availableTimes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="calendar-times" size={50} color={theme.disabled} />
        <Text style={[styles.emptyText, { color: theme.textLight }]}>No available times for this date</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.backgroundLight }]}
          onPress={onBackPress}
        >
          <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>Select Another Date</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Select a new time</Text>
      <Text style={[styles.selectedDateText, { color: theme.primary }]}>{formatDate(selectedDate)}</Text>
      <ScrollView>
        <View style={styles.timeContainer}>
          {availableTimes.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeButton,
                { 
                  backgroundColor: selectedTime === time ? theme.primary : theme.backgroundLight,
                  shadowColor: theme.black 
                }
              ]}
              onPress={() => onTimeSelect(time)}
            >
              <Text style={[
                styles.timeText,
                { color: selectedTime === time ? theme.white : theme.textPrimary }
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

const RescheduleAppointmentPanel = (props) => {
  const { theme } = useTheme();
  const { visible, appointment, onClose, onReschedule } = props || {};
  
  // Component state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [businessData, setBusinessData] = useState(null);
  const [openHours, setOpenHours] = useState(null);
  
  // Initialize when component becomes visible
  useEffect(() => {
    if (visible && appointment) {
      console.log('Initializing with appointment:', appointment.id);
      
      // Reset to initial state
      setCurrentStep(1);
      setSelectedDate('');
      setSelectedTime('');
      setAvailableTimes([]);
      
      // Fetch business details to get open hours and other business data
      loadBusinessData();
    }
  }, [visible, appointment]);
  
  // Load business data using the same method as BusinessDetailsPage
  const loadBusinessData = useCallback(async () => {
    if (!appointment || !appointment.businessId) {
      console.error('No business ID available in appointment data');
      return;
    }
    
    setIsLoading(true);
    try {
      // Use the same fetch function as BusinessDetailsPage
      const result = await fetchBusinessDetails(appointment.businessId, false);
      setBusinessData(result.businessData);
      setOpenHours(result.openHours);
      
      // Generate calendar marked dates after getting business data
      generateMarkedDates(result.openHours);
    } catch (error) {
      console.error('Error loading business details:', error);
      Alert.alert(
        'Error',
        'Failed to load business information. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointment]);
  
  // Extract service duration from appointment - memoized to avoid recalculation
  const serviceDuration = useMemo(() => {
    // First try to get from the serviceDuration property
    if (appointment && appointment.serviceDuration) {
      return appointment.serviceDuration;
    }
    
    // If that doesn't exist, try to parse from service duration string
    if (appointment && appointment.serviceDuration) {
      return extractDurationMinutes(appointment.serviceDuration);
    }
    
    // Default to 60 minutes
    return 60;
  }, [appointment]);
  
  // Helper function to extract minutes from duration string
  const extractDurationMinutes = (durationStr) => {
    if (!durationStr) return 60; // Default to 60 minutes
    
    // Handle different formats:
    // "30 min" -> 30
    // "1 hour" -> 60
    // "1.5 hours" -> 90
    // "2 hours 30 min" -> 150
    
    let minutes = 0;
    
    // Extract hours
    const hoursMatch = durationStr.match(/(\d+\.?\d*)\s*hours?/i);
    if (hoursMatch) {
      minutes += parseFloat(hoursMatch[1]) * 60;
    }
    
    // Extract minutes
    const minutesMatch = durationStr.match(/(\d+)\s*min/i);
    if (minutesMatch) {
      minutes += parseInt(minutesMatch[1], 10);
    }
    
    return minutes > 0 ? minutes : 60; // Return at least 60 minutes as default
  };
  
  // Generate marked dates for the calendar
  const generateMarkedDates = useCallback((businessHours) => {
    if (!appointment || !businessHours) return;
    
    console.log('Generating marked dates');
    const today = new Date();
    const markedDatesObj = {};
    
    // Get current date and max date (30 days from now)
    const currentDate = new Date();
    const maxDate = new Date();
    maxDate.setDate(currentDate.getDate() + 30);
    
    // Process all dates for the next 30 days
    for (let d = new Date(currentDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Get the day of week
      const dayOfWeek = getDayOfWeek(dateStr);
      
      // Check if business is closed on this day
      if (!businessHours[dayOfWeek] || !businessHours[dayOfWeek].start || !businessHours[dayOfWeek].end) {
        // Business is closed - mark as disabled
        markedDatesObj[dateStr] = {
          disabled: true,
          disableTouchEvent: true
        };
        continue;
      }
      
      // Get business-specific booked times for this date
      const businessId = appointment.businessId.toString();
      const bookedTimes = businessId && businessBookedTimes[businessId] && businessBookedTimes[businessId][dateStr] 
        ? businessBookedTimes[businessId][dateStr] 
        : [];
      
      // Calculate available slots using the same function as BusinessDetailsPage
      const availableSlots = generateTimeSlots(dateStr, businessHours, bookedTimes, businessId, serviceDuration);
      
      if (availableSlots.length === 0) {
        // Fully booked - mark red
        markedDatesObj[dateStr] = {
          marked: true,
          dotColor: theme.danger,
          disabled: true,
          disableTouchEvent: true
        };
      } else {
        // Available - mark green
        markedDatesObj[dateStr] = {
          marked: true,
          dotColor: theme.primary
        };
      }
    }
    
    // Mark current appointment date
    if (appointment.date) {
      markedDatesObj[appointment.date] = {
        ...markedDatesObj[appointment.date],
        marked: true,
        dotColor: theme.info // Blue dot for current appointment
      };
    }
    
    console.log('Generated marked dates');
    setMarkedDates(markedDatesObj);
  }, [appointment, serviceDuration, theme]);
  
  // Get the day of week from a date string
  const getDayOfWeek = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    } catch (error) {
      console.error('Error getting day of week:', error);
      return 'monday'; // default to Monday as fallback
    }
  }, []);
  
  // Update marked dates when a date is selected
  const updateMarkedDates = useCallback((dateString) => {
    setMarkedDates(prevMarkedDates => {
      const newMarkedDates = { ...prevMarkedDates };
      
      // Reset any previously selected date
      Object.keys(newMarkedDates).forEach(date => {
        if (newMarkedDates[date]?.selected) {
          newMarkedDates[date] = {
            ...newMarkedDates[date],
            selected: false,
          };
        }
      });
      
      // Mark the newly selected date
      newMarkedDates[dateString] = {
        ...newMarkedDates[dateString],
        selected: true,
        selectedColor: theme.primary,
      };
      
      return newMarkedDates;
    });
  }, [theme]);
  
  // Handle date selection
  const handleDateSelect = useCallback((day) => {
    try {
      console.log('Date selected:', day);
      
      if (!day || !day.dateString) {
        console.error('Invalid day object');
        return;
      }
      
      if (!openHours) {
        console.error('Business hours not available');
        Alert.alert('Error', 'Business hours information not available. Please try again.');
        return;
      }
      
      const dateString = day.dateString;
      setSelectedDate(dateString);
      setSelectedTime('');
      setIsLoading(true);
      
      // Update marked dates in calendar
      updateMarkedDates(dateString);
      
      // Get available time slots with a slight delay
      setTimeout(() => {
        try {
          // Get business-specific booked times
          const businessId = appointment.businessId?.toString();
          const bookedTimes = businessId && businessBookedTimes[businessId] && businessBookedTimes[businessId][dateString]
            ? businessBookedTimes[businessId][dateString]
            : [];
          
          // Get available time slots using the generateTimeSlots function with service duration
          const times = generateTimeSlots(
            dateString, 
            openHours, 
            bookedTimes, 
            businessId, 
            serviceDuration
          );
          console.log('Generated time slots:', times.length);
          
          // Filter out current appointment time if on same date
          const filteredTimes = appointment?.date === dateString 
            ? times.filter(t => t !== appointment.time) 
            : times;
          
          setAvailableTimes(filteredTimes);
        } catch (error) {
          console.error('Error generating time slots:', error);
          setAvailableTimes([]);
        } finally {
          setIsLoading(false);
          setCurrentStep(2);
        }
      }, 300);
    } catch (error) {
      console.error('Error in date selection:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to select date. Please try again.');
    }
  }, [openHours, appointment, updateMarkedDates, serviceDuration]);
  
  // Handle time selection
  const handleTimeSelect = useCallback((timeString) => {
    setSelectedTime(timeString);
  }, []);
  
  // Format date for display
  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString || 'Invalid date';
    }
  }, []);
  
  // Handle reschedule confirmation
  const handleConfirmReschedule = useCallback(() => {
    // Validate selection
    if (!selectedDate || !selectedTime) {
      Alert.alert('Please select both a date and time');
      return;
    }
    
    // Check if actually changed
    if (selectedDate === appointment?.date && selectedTime === appointment?.time) {
      Alert.alert('No Change', 'You selected the same date and time');
      return;
    }
    
    // Confirm with user
    Alert.alert(
      'Confirm Reschedule',
      `Reschedule to ${formatDate(selectedDate)} at ${selectedTime}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => processReschedule()
        }
      ]
    );
  }, [selectedDate, selectedTime, appointment, formatDate]);
  

  const processReschedule = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Create updated appointment object
      const updatedAppointment = {
        ...appointment,
        date: selectedDate,
        time: selectedTime
      };
      
      // Update booked time slots in the shared businessBookedTimes
      if (appointment.businessId && appointment.date && appointment.time) {
        const businessId = appointment.businessId.toString();
        
        // Use the imported removeBookedTimeSlot function
        removeBookedTimeSlot(
          businessId,
          appointment.date,
          appointment.time,
          businessBookedTimes
        );
        
        // Add the new time slot
        if (!businessBookedTimes[businessId]) {
          businessBookedTimes[businessId] = {};
        }
        
        if (!businessBookedTimes[businessId][selectedDate]) {
          businessBookedTimes[businessId][selectedDate] = [];
        }
        
        // Add as object with time and duration
        businessBookedTimes[businessId][selectedDate].push({
          time: selectedTime,
          duration: serviceDuration
        });
        // Log for debugging
        console.log('Removed old time slot:', appointment.date, appointment.time);
        console.log('Added new time slot:', selectedDate, selectedTime);
      }
      
      // Call service to update appointment
      await AppointmentService.rescheduleAppointment(
        updatedAppointment.id,
        updatedAppointment.date,
        updatedAppointment.time,
        serviceDuration
      );
      
      // Notify parent component
      if (onReschedule) {
        await onReschedule(updatedAppointment);
      }
      
      // Emit events
      AppointmentEventEmitter.emit('appointmentRescheduled', updatedAppointment);
      AppointmentEventEmitter.emit('appointmentsUpdated');
      AppointmentEventEmitter.emit('timeSlotBooked', {
        businessId: appointment.businessId?.toString(),
        date: selectedDate,
        time: selectedTime,
        duration: serviceDuration
      });
      
      // Show success message
      Alert.alert(
        'Success',
        'Your appointment has been rescheduled.',
        [{ text: 'OK' }]
      );
      
      // Close modal
      if (onClose) onClose();
    } catch (error) {
      console.error('Error in reschedule process:', error);
      
      // Show error message
      Alert.alert(
        'Error',
        'Failed to reschedule appointment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointment, selectedDate, selectedTime, serviceDuration, onReschedule, onClose]);
  
  // If not visible, render nothing
  if (!visible) return null;
  
  // Render date selection step with calendar
  const renderDateSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Select a new date</Text>
      
      <MemoizedCalendar
        current={appointment?.date || new Date().toISOString().split('T')[0]}
        minDate={new Date().toISOString().split('T')[0]}
        maxDate={(() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date.toISOString().split('T')[0];
        })()}
        onDayPress={handleDateSelect}
        markedDates={markedDates}
        enableSwipeMonths={true}
        theme={{
          calendarBackground: theme.background,
          textSectionTitleColor: theme.primary,
          selectedDayBackgroundColor: theme.primary,
          selectedDayTextColor: theme.white,
          todayTextColor: theme.primary,
          arrowColor: theme.primary,
          dotColor: theme.primary,
          selectedDotColor: theme.white,
          monthTextColor: theme.textPrimary,
          dayTextColor: theme.textPrimary,
          textDisabledColor: theme.textMuted,
        }}
      />
      
      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.legendText, { color: theme.textLight }]}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.info }]} />
          <Text style={[styles.legendText, { color: theme.textLight }]}>Current Appointment</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
          <Text style={[styles.legendText, { color: theme.textLight }]}>Fully Booked</Text>
        </View>
      </View>
      
      {/* Display service duration information */}
      <View style={[styles.serviceDurationContainer, { backgroundColor: theme.primaryBackground }]}>
        <FontAwesome5 name="clock" size={16} color={theme.primary} style={styles.durationIcon} />
        <Text style={[styles.serviceDurationText, { color: theme.primary }]}>
          Service Duration: {serviceDuration} minutes
        </Text>
      </View>
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Reschedule Appointment</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <FontAwesome5 name="times" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.scrollContent}>
            {currentStep === 1 ? 
              renderDateSelection() : 
              <TimeSlotSelection 
                availableTimes={availableTimes}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                onBackPress={() => setCurrentStep(1)}
                isLoading={isLoading}
                selectedDate={selectedDate}
                formatDate={formatDate}
              />
            }
          </ScrollView>
          
          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            {currentStep === 1 ? (
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: theme.backgroundLight }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.backButton, { backgroundColor: theme.backgroundLight }]}
                  onPress={() => setCurrentStep(1)}
                >
                  <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.confirmButton,
                    { backgroundColor: selectedTime ? theme.primary : theme.disabled }
                  ]}
                  onPress={handleConfirmReschedule}
                  disabled={!selectedTime}
                >
                  <Text style={[styles.confirmButtonText, { color: theme.white }]}>Confirm</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    width: '90%',
    borderTopLeftRadius: '20@s',
    borderTopRightRadius: '20@s',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20@s',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: '5@s',
  },
  scrollContent: {
    maxHeight: 500,
  },
  stepContainer: {
    padding: '16@s',
  },
  stepTitle: {
    fontSize: '16@s',
    fontWeight: 'bold',
    marginBottom: '16@s',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: '16@s',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: '10@s',
    marginBottom: '5@s',
  },
  legendDot: {
    width: '10@s',
    height: '10@s',
    borderRadius: '5@s',
    marginRight: '6@s',
  },
  legendText: {
    fontSize: '12@s',
  },
  serviceDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '12@s',
    padding: '10@s',
    borderRadius: '8@s',
  },
  durationIcon: {
    marginRight: '8@s',
  },
  serviceDurationText: {
    fontSize: '14@s',
    fontWeight: 'bold',
  },
  selectedDateText: {
    fontSize: '16@s',
    textAlign: 'center',
    marginBottom: '16@s',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: '4@s',
  },
  timeButton: {
    width: '48%',
    padding: '14@s',
    marginVertical: '6@s',
    marginHorizontal: '2@s',
    borderRadius: '8@s',
    alignItems: 'center',
    shadowOffset: { width: 0, height: '1@s' },
    shadowOpacity: 0.1,
    shadowRadius: '2@s',
    elevation: 2,
  },
  timeText: {
    fontSize: '14@s',
  },
  loadingContainer: {
    padding: '20@s',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: '20@s',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: '16@s',
    marginVertical: '16@s',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: '16@s',
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    padding: '12@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: '16@s',
  },
  backButton: {
    flex: 1,
    padding: '12@s',
    borderRadius: '8@s',
    alignItems: 'center',
    marginRight: '8@s',
  },
  backButtonText: {
    fontSize: '16@s',
  },
  confirmButton: {
    flex: 1,
    padding: '12@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: '16@s',
    fontWeight: 'bold',
  },
});

export default React.memo(RescheduleAppointmentPanel);
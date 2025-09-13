// src/BusinessSearch/Components/BookingModal.js
import React, { useMemo, useCallback, useState, useEffect } from "react";
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { FontAwesome5 } from "@expo/vector-icons";
import { Calendar } from 'react-native-calendars';
import { generateTimeSlots, getDayOfWeek } from "../Service/TimeUtils";
import { appointmentApi } from "../../Auth/Services/ApiService";
import { useTheme } from '../../Context/ThemeContext';
import { useAuth } from '../../Auth/Context/AuthContext';

// Memoized Calendar component to prevent re-renders
const MemoizedCalendar = React.memo(Calendar);

// Memoized time item component
const TimeItem = React.memo(({ item, selectedTime, onTimeSelect }) => {
  const { theme } = useTheme();
  const isSelected = item === selectedTime;
  
  return (
    <TouchableOpacity 
      style={[
        styles.timeItem, 
        { backgroundColor: theme.backgroundGray },
        isSelected && [styles.selectedTimeItem, { backgroundColor: theme.primary }]
      ]}
      onPress={() => onTimeSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.timeText, 
        { color: theme.textPrimary },
        isSelected && [styles.selectedTimeText, { color: theme.white }]
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );
});

const BookingModal = ({ 
  visible, 
  selectedService, 
  businessData,
  openHours,
  onClose,
  onBookingSuccess
}) => {
  const { theme } = useTheme();
  const { user, userToken } = useAuth();
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState({});
  
  // Calculate the date range for available dates
  const dateRange = useMemo(() => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30); // Allow booking up to 30 days in advance
    
    return {
      todayStr: today.toISOString().split('T')[0],
      maxDateStr: maxDate.toISOString().split('T')[0]
    };
  }, []);
  
  // Memoize marked dates to avoid recalculation on every render
  const markedDates = useMemo(() => {
    const result = {};
    
    // Mark selected date
    if (selectedDate) {
      result[selectedDate] = {
        selected: true,
        selectedColor: theme.primary,
      };
    }

    const businessId = businessData?.id?.toString();
    
    
    // Only process dates if we have business data and open hours
    if (businessId && openHours) {
      

      const today = new Date();
      
      // Process all dates for the next 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip if we've already processed this date
        if (result[dateStr]) continue;
        
        // Get the day of week and map to openHours format
        const dayOfWeek = getDayOfWeek(dateStr);
        const dayKey = dayOfWeek.substring(0, 3); // Convert to 'sun', 'mon', etc.
        
        
        // Check if business is closed on this day
        if (!openHours[dayKey] || !openHours[dayKey].open || !openHours[dayKey].close) {
          // Business is closed - mark as disabled
          result[dateStr] = {
            disabled: true,
            disableTouchEvent: true
          };
          continue;
        }
        
        // Check if there are temporary closures for this date
        const hasTemporaryClosure = businessData.temporaryClosures?.some(closure => 
          closure.startDate <= dateStr && closure.endDate >= dateStr
        );
        
        if (hasTemporaryClosure) {
          console.log(`Temporary closure on ${dateStr}`);
          result[dateStr] = {
            disabled: true,
            disableTouchEvent: true
          };
          continue;
        }
        
        // Get booked appointments for this date
        const bookedTimes = bookedAppointments[dateStr] || [];
        
        // Calculate available slots using service-specific duration
        const serviceDuration = selectedService?.durationMinutes || 60;
        
        const availableSlots = generateTimeSlots(
          dateStr, 
          openHours, 
          bookedTimes, 
          businessId, 
          serviceDuration
        );
        
        
        if (availableSlots.length === 0) {
          // Fully booked - mark red
          result[dateStr] = {
            marked: true,
            dotColor: theme.danger,
            disabled: true,
            disableTouchEvent: true
          };
        } else {
          // Available - mark green
          result[dateStr] = {
            marked: true,
            dotColor: theme.primary
          };
        }
      }
    }
    
    return result;
  }, [selectedDate, businessData, openHours, selectedService, bookedAppointments, theme]);

  // Handle date selection
  const handleDateSelect = useCallback((dateString) => {
    setSelectedDate(dateString);
    setSelectedTime(null);
    setAvailableTimes([]);
    
    // Generate available time slots for the selected date
    if (businessData?.id) {
      const dayOfWeek = getDayOfWeek(dateString);
      const dayKey = dayOfWeek.substring(0, 3);
      
      
      if (openHours[dayKey] && openHours[dayKey].open && openHours[dayKey].close) {
        const bookedTimes = bookedAppointments[dateString] || [];
        
        const availableSlots = generateTimeSlots(
          dateString, 
          openHours, 
          bookedTimes, 
          businessData.id.toString(), 
          selectedService?.durationMinutes || 60
        );
        
        
        // Set available times directly from generated slots
        setAvailableTimes(availableSlots);
      } else {
      }
    }
    
    setBookingStep(2);
  }, [businessData, openHours, selectedService, bookedAppointments]);

  // Handle time selection
  const handleTimeSelect = useCallback((time) => {
    setSelectedTime(time);
  }, []);

  // Handle step change
  const handleStepChange = useCallback((step) => {
    setBookingStep(step);
    if (step === 1) {
      setSelectedTime(null);
      setAvailableTimes([]);
    }
  }, []);

  // Refresh available times for current selected date
  const refreshAvailableTimes = useCallback(async () => {
    if (!selectedDate || !businessData?.id || !selectedService) return;
    
    console.log('🔄 Refreshing available times for', selectedDate);
    
    // Re-fetch existing appointments to get latest data
    await fetchExistingAppointments();
    
    // Regenerate time slots with updated data
    const dayOfWeek = getDayOfWeek(selectedDate);
    const dayKey = dayOfWeek.substring(0, 3);
    
    if (openHours[dayKey] && openHours[dayKey].open && openHours[dayKey].close) {
      const bookedTimes = bookedAppointments[selectedDate] || [];
      
      const availableSlots = generateTimeSlots(
        selectedDate, 
        openHours, 
        bookedTimes, 
        businessData.id.toString(), 
        selectedService.durationMinutes || 60
      );
      
      console.log('🕐 Updated available slots:', availableSlots);
      setAvailableTimes(availableSlots);
      
      // Clear selected time if it's no longer available
      if (selectedTime && !availableSlots.includes(selectedTime)) {
        setSelectedTime(null);
      }
      
      return availableSlots;
    }
    
    return [];
  }, [selectedDate, businessData?.id, selectedService, openHours, bookedAppointments, selectedTime, fetchExistingAppointments, setAvailableTimes, setSelectedTime]);

  // Handle booking confirmation
  const handleBookingConfirm = useCallback(async () => {
    if (!selectedService || !selectedDate || !selectedTime || !businessData) {
      Alert.alert("Error", "Please select all required fields.");
      return;
    }

    setLoading(true);
    
    try {
      // Check if user is authenticated
      if (!user?.phone) {
        Alert.alert("Error", "Please log in to book an appointment.");
        return;
      }

      if (!userToken) {
        Alert.alert("Error", "Please log in to book an appointment.");
        return;
      }

      // Create appointment data
      const appointmentData = {
        business: businessData.id,
        user: user.phone, // Use authenticated user's phone number
        service: selectedService._id,
        date: selectedDate,
        time: selectedTime,
        durationMinutes: selectedService.durationMinutes || 60
      };

      // Make API call to create appointment using the appointment API
      const result = await appointmentApi.create(appointmentData, userToken);
      
      if (!result.success) {
        // Check if this is a booking conflict that requires time refresh
        if (result.error === 'TIME_CONFLICT' || 
            result.error === 'RACE_CONDITION' || 
            result.error === 'DUPLICATE_BOOKING' ||
            result.error === 'DURATION_OVERLAP') {
          
          // Refresh available times to show updated availability
          const updatedSlots = await refreshAvailableTimes();
          
          if (updatedSlots && updatedSlots.length > 0) {
            // Show conflict alert with available alternatives
            Alert.alert(
              "Time Slot Unavailable", 
              `The selected time slot is no longer available. Please choose from the updated available times.`,
              [{ text: "OK" }]
            );
            return; // Exit function - don't throw error
          } else {
            // No times available - user must go back to calendar
            Alert.alert(
              "No Times Available", 
              `Unfortunately, there are no available time slots for ${selectedDate}. Please select a different date.`,
              [
                { 
                  text: "Choose Different Date", 
                  onPress: () => {
                    setBookingStep(1);
                    setSelectedTime(null);
                    setAvailableTimes([]);
                  }
                }
              ]
            );
            return; // Exit function - don't throw error
          }
        }
        
        // For other errors, extract the most specific error message available
        let errorMessage = 'Failed to create appointment';
        
        if (result.error) {
          errorMessage = result.error;
        } else if (result.details?.message) {
          errorMessage = result.details.message;
        } else if (result.details?.error) {
          errorMessage = result.details.error;
        }
        
        // If we have validation conflicts, show those too
        if (result.details?.conflicts && result.details.conflicts.length > 0) {
          const conflictMessages = result.details.conflicts.map(c => c.message).join(', ');
          errorMessage += `\n\nDetails: ${conflictMessages}`;
        }
        
        throw new Error(errorMessage);
      }

      const newAppointment = result.data;
      
      // Update local booked appointments
      const businessId = businessData.id.toString();
      if (!bookedAppointments[selectedDate]) {
        bookedAppointments[selectedDate] = [];
      }
      bookedAppointments[selectedDate].push({
        time: selectedTime,
        duration: selectedService.durationMinutes || 60
      });
      setBookedAppointments({...bookedAppointments});

      // Show success message
      Alert.alert(
        "Booking Confirmed!", 
        `Your appointment for ${selectedService.name} on ${selectedDate} at ${selectedTime} has been booked successfully.`,
        [
          { 
            text: "OK", 
            onPress: () => {
              if (onBookingSuccess) {
                onBookingSuccess(newAppointment);
              }
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      // Show generic error message for non-conflict errors
      Alert.alert(
        "Booking Failed", 
        error.message || "There was an error creating your appointment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedService, selectedDate, selectedTime, businessData, bookedAppointments, onBookingSuccess, onClose, userToken, user, refreshAvailableTimes]);

  // Reset state when modal closes and fetch appointments when modal opens
  useEffect(() => {
    if (!visible) {
      setBookingStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableTimes([]);
    } else if (businessData?.id) {
      // Fetch existing appointments for this business to populate booked times
      fetchExistingAppointments();
      
      
      if (!openHours) {
      }
    }
  }, [visible, businessData?.id, fetchExistingAppointments]);

  // Fetch existing appointments for the business
  const fetchExistingAppointments = useCallback(async () => {
    if (!businessData?.id) return;
    
    try {
      const result = await appointmentApi.getByBusiness(businessData.id);
      if (result.success) {
        // Group appointments by date
        const appointmentsByDate = {};
        result.data.forEach(appointment => {
          if (!appointmentsByDate[appointment.date]) {
            appointmentsByDate[appointment.date] = [];
          }
          appointmentsByDate[appointment.date].push({
            time: appointment.time,
            duration: appointment.durationMinutes
          });
        });
        setBookedAppointments(appointmentsByDate);
      }
    } catch (error) {
      console.error('Error fetching existing appointments:', error);
    }
  }, [businessData?.id]);

  // Memoized time item renderer
  const renderTimeItem = useCallback(({ item }) => (
    <TimeItem 
      item={item} 
      selectedTime={selectedTime} 
      onTimeSelect={handleTimeSelect}
    />
  ), [selectedTime, handleTimeSelect]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.modalFullScreen, { backgroundColor: theme.background }]}>
        {/* Custom header with back button */}
        <View style={[styles.modalNavBar, { 
          backgroundColor: theme.primary,
          shadowColor: theme.black
        }]}>
          <TouchableOpacity 
            style={styles.modalBackButton}
            onPress={() => {
              if (bookingStep > 1) {
                handleStepChange(bookingStep - 1);
              } else {
                onClose();
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Back button"
            accessibilityRole="button"
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.white} />
          </TouchableOpacity>
          <Text style={[styles.modalNavTitle, { color: theme.white }]}>
            {bookingStep === 1 ? "Select Date" : "Select Time"}
          </Text>
          <View style={styles.modalNavSpacer} />
        </View>
        
        {/* Selected service card */}
        {selectedService && (
          <View style={[styles.serviceCard, { 
            backgroundColor: theme.background,
            borderBottomColor: theme.border
          }]}>
            <View style={styles.serviceCardContent}>
              <Text style={[styles.serviceCardTitle, { color: theme.textPrimary }]}>
                {selectedService.name}
              </Text>
              <Text style={[styles.serviceCardDescription, { color: theme.textLight }]} numberOfLines={1}>
                {selectedService.description || 'No description available'}
              </Text>
              <View style={styles.serviceCardMeta}>
                <Text style={[styles.serviceCardDuration, { color: theme.textLight }]}>
                  <FontAwesome5 name="clock" size={12} color={theme.textLight} /> {selectedService.durationMinutes} min
                </Text>
                <Text style={[styles.serviceCardPrice, { color: theme.primary }]}>
                  ${selectedService.price}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Step progress bar */}
        <View style={[styles.progressContainer, { backgroundColor: theme.backgroundLight }]}>
          <View style={[styles.progressBar, { backgroundColor: theme.disabled }]}>
            <View style={[styles.progressFill, { 
              width: bookingStep === 1 ? '50%' : '100%',
              backgroundColor: theme.primary 
            }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { 
              color: bookingStep >= 1 ? theme.primary : theme.textLight,
              fontWeight: bookingStep === 1 ? 'bold' : 'normal'
            }]}>Date</Text>
            <Text style={[styles.progressLabel, { 
              color: bookingStep >= 2 ? theme.primary : theme.textLight,
              fontWeight: bookingStep === 2 ? 'bold' : 'normal'
            }]}>Time</Text>
          </View>
        </View>
        
        {/* Date selection screen */}
        {bookingStep === 1 && (
          <View style={styles.screenContainer}>
            {!openHours ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textLight }]}>
                  Loading available dates...
                </Text>
              </View>
            ) : (
              <>
                {/* Legend for calendar */}
                <View style={styles.calendarLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                    <Text style={[styles.legendText, { color: theme.textLight }]}>Available</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
                    <Text style={[styles.legendText, { color: theme.textLight }]}>Fully Booked</Text>
                  </View>
                </View>
            
            <MemoizedCalendar
              current={dateRange.todayStr}
              minDate={dateRange.todayStr}
              maxDate={dateRange.maxDateStr}
              onDayPress={(day) => handleDateSelect(day.dateString)}
              markedDates={markedDates}
              enableSwipeMonths={true}
              theme={{
                calendarBackground: theme.background,
                textSectionTitleColor: theme.primary,
                selectedDayBackgroundColor: theme.primary,
                selectedDayTextColor: theme.white,
                todayTextColor: theme.primary,
                dayTextColor: theme.textPrimary,
                textDisabledColor: theme.textMuted,
                dotColor: theme.primary,
                selectedDotColor: theme.white,
                arrowColor: theme.primary,
                monthTextColor: theme.textPrimary,
                indicatorColor: theme.primary,
                textDayFontFamily: 'Inter-Regular',
                textMonthFontFamily: 'Inter-SemiBold',
                textDayHeaderFontFamily: 'Inter-Medium',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendarContainer}
              accessibilityLabel="Calendar for selecting appointment date"
            />
            
                <Text style={[styles.dateInstructions, { color: theme.textLight }]}>
                  Please select a date to continue
                </Text>
              </>
            )}
          </View>
        )}
        
        {/* Time selection screen */}
        {bookingStep === 2 && (
          <View style={styles.screenContainer}>
            <View style={[styles.selectedDateHeader, { backgroundColor: theme.backgroundGray }]}>
              <Text style={[styles.selectedDateText, { color: theme.textPrimary }]}>
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            
            {availableTimes.length > 0 ? (
              <>
                <Text style={[styles.timeSelectionHeader, { color: theme.textPrimary }]}>
                  Available Time Slots ({availableTimes.length} slots)
                </Text>
                <FlatList
                  data={availableTimes}
                  renderItem={renderTimeItem}
                  keyExtractor={(item) => item}
                  numColumns={2}
                  contentContainerStyle={styles.timeGrid}
                  initialNumToRender={10}
                  maxToRenderPerBatch={20}
                  windowSize={10}
                  accessibilityLabel="List of available time slots"
                />
                
                {/* Confirm booking button */}
                <TouchableOpacity
                  style={[
                    styles.confirmButton, 
                    { 
                      backgroundColor: selectedTime ? theme.primary : theme.disabled,
                      marginTop: 20
                    }
                  ]}
                  onPress={handleBookingConfirm}
                  disabled={!selectedTime || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.white} size="small" />
                  ) : (
                    <Text style={[styles.confirmButtonText, { color: theme.white }]}>
                      Confirm Booking
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noTimesContainer}>
                <FontAwesome5 name="calendar-times" size={50} color={theme.disabled} />
                <Text style={[styles.noTimesText, { color: theme.textLight }]}>
                  No available times for this date
                </Text>
                <TouchableOpacity 
                  style={[styles.changeDateButton, { backgroundColor: theme.backgroundGray }]}
                  onPress={() => handleStepChange(1)}
                  accessibilityLabel="Change date button"
                  accessibilityRole="button"
                >
                  <Text style={[styles.changeDateButtonText, { color: theme.primary }]}>
                    Change Date
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  modalFullScreen: {
    flex: 1,
  },
  modalNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: "15@s",
    paddingHorizontal: "15@s",
    paddingTop: "30@s",
    elevation: 4,
    shadowOffset: { width: 0, height: "2@s" },
    shadowOpacity: 0.2,
    shadowRadius: "2@s",
  },
  modalBackButton: {
    width: "44@s",
    height: "44@s",
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: "22@s",
  },
  modalNavTitle: {
    fontSize: "18@s",
    fontFamily: "Inter-SemiBold",
    textAlign: 'center',
    flex: 1,
    marginLeft: "-40@s",
  },
  modalNavSpacer: {
    width: "40@s",
  },
  serviceCard: {
    padding: "16@s",
    borderBottomWidth: "1@s",
  },
  serviceCardContent: {
    justifyContent: 'space-between',
    minHeight: "60@s",
  },
  serviceCardTitle: {
    fontSize: "16@s",
    fontFamily: "Inter-SemiBold",
    marginBottom: "4@s",
  },
  serviceCardDescription: {
    fontSize: "13@s",
    fontFamily: "Inter-Regular",
    marginBottom: "8@s",
  },
  serviceCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceCardDuration: {
    fontSize: "13@s",
    fontFamily: "Inter-Regular",
  },
  serviceCardPrice: {
    fontSize: "16@s",
    fontFamily: "Inter-Bold",
  },
  progressContainer: {
    padding: "15@s",
  },
  progressBar: {
    height: "4@s",
    borderRadius: "2@s",
    marginBottom: "10@s",
  },
  progressFill: {
    height: "4@s",
    borderRadius: "2@s",
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: "12@s",
    fontFamily: "Inter-Regular",
  },
  screenContainer: {
    flex: 1,
    padding: "15@s",
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: "10@s",
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: "10@s",
  },
  legendDot: {
    width: "8@s",
    height: "8@s",
    borderRadius: "4@s",
    marginRight: "5@s",
  },
  legendText: {
    fontSize: "12@s",
    fontFamily: "Inter-Regular",
  },
  calendarContainer: {
    marginBottom: "15@s",
  },
  dateInstructions: {
    fontSize: "14@s",
    fontFamily: "Inter-Regular",
    textAlign: 'center',
    marginTop: "20@s",
  },
  selectedDateHeader: {
    alignItems: 'center',
    marginBottom: "20@s",
    paddingVertical: "10@s",
    borderRadius: "8@s",
  },
  selectedDateText: {
    fontSize: "16@s",
    fontFamily: "Inter-Medium",
  },
  timeSelectionHeader: {
    fontSize: "16@s",
    fontFamily: "Inter-SemiBold",
    marginBottom: "15@s",
  },
  timeGrid: {
    paddingBottom: "20@s",
  },
  timeItem: {
    flex: 1,
    margin: "8@s",
    paddingVertical: "14@s",
    borderRadius: "8@s",
    alignItems: 'center',
  },
  selectedTimeItem: {
    // Background color is set dynamically
  },
  timeText: {
    fontSize: "14@s",
    fontFamily: "Inter-Medium",
  },
  selectedTimeText: {
    // Color is set dynamically
  },
  noTimesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: "20@s",
  },
  noTimesText: {
    fontSize: "16@s",
    fontFamily: "Inter-Regular",
    textAlign: 'center',
    marginTop: "15@s",
    marginBottom: "25@s",
  },
  changeDateButton: {
    paddingVertical: "10@s",
    paddingHorizontal: "20@s",
    borderRadius: "8@s",
  },
  changeDateButtonText: {
    fontSize: "14@s",
    fontFamily: "Inter-Medium",
  },
  confirmButton: {
    borderRadius: "8@s",
    paddingVertical: "15@s",
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: "16@s",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: "20@s",
  },
  loadingText: {
    marginTop: "15@s",
    fontSize: "14@s",
    fontFamily: "Inter-Regular",
  },
});

export default React.memo(BookingModal);
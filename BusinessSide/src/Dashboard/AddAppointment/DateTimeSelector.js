// src/Dashboard/AddAppointment/DateTimeSelector.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import ApiService from '../Service/ApiService';
import CustomDatePickerModal from '../Components/CustomDatePickerModal';
import CustomTimePickerModal from '../Components/CustomTimePickerModal';

const DateTimeSelector = ({ selectedDateTime, onDateTimeSelect, selectedService, theme }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  // Get business ID when component loads
  useEffect(() => {
    getBusinessId();
  }, []);

  // Load available slots when date or service changes
  useEffect(() => {
    if (businessId && selectedDateTime) {
      loadAvailableSlots();
    }
  }, [businessId, selectedDateTime.toDateString(), selectedService?.id]);

  const getBusinessId = async () => {
    try {
      const businessData = await ApiService.getBusinessData();
      const id = businessData?.businessId || businessData?.business?.id;
      setBusinessId(id);
    } catch (error) {
      console.error('Error getting business ID:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!businessId) return;
    
    setIsLoadingSlots(true);
    try {
      const date = selectedDateTime.toISOString().split('T')[0]; // YYYY-MM-DD format
      const serviceId = selectedService?.id;
      
      // Make API call to get available slots using ApiService
      const data = await ApiService.getAvailableSlots(businessId, date, serviceId);
      
      let slots = data.slots || [];
      
      // Filter out past times if the selected date is today
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        slots = slots.filter(slot => {
          if (!slot.time) return false;
          
          // Parse the slot time (format: "HH:mm" or "H:mm")
          const [hourStr, minuteStr] = slot.time.split(':');
          const slotHour = parseInt(hourStr, 10);
          const slotMinute = parseInt(minuteStr, 10);
          
          // Keep slot only if it's in the future
          return slotHour > currentHour || (slotHour === currentHour && slotMinute > currentMinute);
        });
      }
      
      setAvailableSlots(slots);
    } catch (error) {
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Helper function to filter out past times for today
  const filterPastTimes = (times) => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDate = selectedDateTime.toISOString().split('T')[0];
    
    // Only filter if selected date is today
    if (selectedDate !== today) {
      return times;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return times.filter(time => {
      // Parse the time string (format: "HH:mm")
      const [hourStr, minuteStr] = time.split(':');
      const timeHour = parseInt(hourStr, 10);
      const timeMinute = parseInt(minuteStr, 10);
      
      // Keep time only if it's in the future
      return timeHour > currentHour || (timeHour === currentHour && timeMinute > currentMinute);
    });
  };

  // Format date for display
  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (date) => {
    const options = { hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleTimeString(undefined, options);
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || selectedDateTime;
    
    // Hide picker after selection on both platforms
    if (event.type === 'set' || event.type === 'dismissed') {
      setShowDatePicker(false);
    }
    
    // Only update if user actually selected a date
    if (event.type === 'set' && selectedDate) {
      // Create new datetime with selected date but keep current time
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setFullYear(currentDate.getFullYear());
      newDateTime.setMonth(currentDate.getMonth());
      newDateTime.setDate(currentDate.getDate());
      
      onDateTimeSelect(newDateTime);
    }
  };

  // Handle time change
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || selectedDateTime;
    
    // Hide picker after selection on both platforms
    if (event.type === 'set' || event.type === 'dismissed') {
      setShowTimePicker(false);
    }
    
    // Only update if user actually selected a time
    if (event.type === 'set' && selectedTime) {
      // Create new datetime with selected time but keep current date
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(currentTime.getHours());
      newDateTime.setMinutes(currentTime.getMinutes());
      
      onDateTimeSelect(newDateTime);
    }
  };

  // Handle quick time selection
  const handleQuickTimeSelect = (timeSlot) => {
    const [hours, minutes] = timeSlot.time.split(':').map(Number);
    const newDateTime = new Date(selectedDateTime);
    newDateTime.setHours(hours, minutes, 0, 0);
    onDateTimeSelect(newDateTime);
  };

  // Handle preset time button (fallback if no API slots)
  const handlePresetTimeSelect = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    const newDateTime = new Date(selectedDateTime);
    newDateTime.setHours(hour, minute);
    onDateTimeSelect(newDateTime);
  };

  // Check if selected time matches a slot
  const isTimeSelected = (timeSlot) => {
    const slotTime = timeSlot.time;
    const currentTime = `${selectedDateTime.getHours().toString().padStart(2, '0')}:${selectedDateTime.getMinutes().toString().padStart(2, '0')}`;
    return slotTime === currentTime;
  };

  // Check if selected time matches preset
  const isPresetSelected = (time) => {
    const currentTime = `${selectedDateTime.getHours().toString().padStart(2, '0')}:${selectedDateTime.getMinutes().toString().padStart(2, '0')}`;
    return time === currentTime;
  };

  // Check if date is today
  const isToday = () => {
    const today = new Date();
    return selectedDateTime.toDateString() === today.toDateString();
  };

  // Check if date is in the past
  const isPastDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(selectedDateTime);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  // Quick date buttons (Today, Tomorrow, etc.)
  const getQuickDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    return [
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: tomorrow },
      { label: dayAfter.toLocaleDateString(undefined, { weekday: 'short' }), date: dayAfter }
    ];
  };

  const quickDates = getQuickDates();

  return (
    <View style={styles.container}>
      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Date</Text>
        
        {/* Quick Date Buttons */}
        <View style={styles.quickDateContainer}>
          {quickDates.map((quickDate, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickDateButton,
                { 
                  backgroundColor: selectedDateTime.toDateString() === quickDate.date.toDateString() 
                    ? theme.primary 
                    : theme.backgroundLight 
                }
              ]}
              onPress={() => {
                const newDateTime = new Date(quickDate.date);
                newDateTime.setHours(selectedDateTime.getHours());
                newDateTime.setMinutes(selectedDateTime.getMinutes());
                onDateTimeSelect(newDateTime);
              }}
            >
              <Text style={[
                styles.quickDateText,
                { 
                  color: selectedDateTime.toDateString() === quickDate.date.toDateString() 
                    ? theme.white 
                    : theme.textPrimary 
                }
              ]}>
                {quickDate.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Date Picker */}
        <TouchableOpacity
          style={[styles.dateTimeCard, { backgroundColor: theme.background, borderColor: theme.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.dateTimeHeader}>
            <FontAwesome5 name="calendar-alt" size={16} color={theme.primary} />
            <Text style={[styles.dateTimeLabel, { color: theme.textSecondary }]}>Custom Date</Text>
          </View>
          <Text style={[styles.dateTimeValue, { color: theme.textPrimary }]}>
            {formatDate(selectedDateTime)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <View style={styles.timeHeader}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Time</Text>
          {isLoadingSlots && (
            <ActivityIndicator size="small" color={theme.primary} />
          )}
        </View>

        {/* Available Time Slots */}
        {availableSlots.length > 0 && (
          <View style={styles.availableSlotsContainer}>
            <Text style={[styles.subsectionLabel, { color: theme.textSecondary }]}>
              Available Times:
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.slotsScrollContainer}
            >
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlotButton,
                    { 
                      backgroundColor: isTimeSelected(slot) 
                        ? theme.primary 
                        : theme.backgroundLight,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => handleQuickTimeSelect(slot)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    { 
                      color: isTimeSelected(slot) 
                        ? theme.white 
                        : theme.textPrimary 
                    }
                  ]}>
                    {new Date(`2000-01-01T${slot.time}`).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Fallback Quick Times (when no API slots available) */}
        {availableSlots.length === 0 && !isLoadingSlots && (
          <View style={styles.quickTimeContainer}>
            <Text style={[styles.subsectionLabel, { color: theme.textSecondary }]}>
              Quick Times:
            </Text>
            <View style={styles.quickTimeButtons}>
              {filterPastTimes(['09:00', '12:00', '14:00', '16:00']).map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.quickTimeButton,
                    { 
                      backgroundColor: isPresetSelected(time) 
                        ? theme.primary 
                        : theme.backgroundLight 
                    }
                  ]}
                  onPress={() => handlePresetTimeSelect(time)}
                >
                  <Text style={[
                    styles.quickTimeText,
                    { 
                      color: isPresetSelected(time) 
                        ? theme.white 
                        : theme.textPrimary 
                    }
                  ]}>
                    {new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Custom Time Picker */}
        <TouchableOpacity
          style={[styles.dateTimeCard, { backgroundColor: theme.background, borderColor: theme.border }]}
          onPress={() => setShowTimePicker(true)}
        >
          <View style={styles.dateTimeHeader}>
            <FontAwesome5 name="clock" size={16} color={theme.primary} />
            <Text style={[styles.dateTimeLabel, { color: theme.textSecondary }]}>Custom Time</Text>
          </View>
          <Text style={[styles.dateTimeValue, { color: theme.textPrimary }]}>
            {formatTime(selectedDateTime)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warning Messages */}
      {isPastDate() && (
        <View style={[styles.warningContainer, { backgroundColor: theme.danger + '20' }]}>
          <FontAwesome5 name="exclamation-triangle" size={14} color={theme.danger} />
          <Text style={[styles.warningText, { color: theme.danger }]}>
            Selected date is in the past
          </Text>
        </View>
      )}

      {availableSlots.length === 0 && !isLoadingSlots && !isPastDate() && (
        <View style={[styles.warningContainer, { backgroundColor: theme.warning + '20' }]}>
          <FontAwesome5 name="info-circle" size={14} color={theme.warning} />
          <Text style={[styles.warningText, { color: theme.warning }]}>
            No available slots found for this date
          </Text>
        </View>
      )}

      {/* Custom Date Picker Modal */}
      <CustomDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={(date) => {
          onDateTimeSelect(date);
          setShowDatePicker(false);
        }}
        selectedDate={selectedDateTime}
        theme={theme}
        minimumDate={new Date()}
      />

      {/* Custom Time Picker Modal */}
      <CustomTimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={(time) => {
          onDateTimeSelect(time);
          setShowTimePicker(false);
        }}
        selectedTime={selectedDateTime}
        theme={theme}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: '16@vs',
  },
  sectionLabel: {
    fontSize: '14@s',
    fontWeight: '600',
    marginBottom: '10@vs',
  },
  subsectionLabel: {
    fontSize: '12@s',
    fontWeight: '500',
    marginBottom: '6@vs',
  },
  quickDateContainer: {
    flexDirection: 'row',
    marginBottom: '10@vs',
  },
  quickDateButton: {
    paddingVertical: '8@vs',
    paddingHorizontal: '16@s',
    borderRadius: '20@s',
    marginRight: '8@s',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  quickDateText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
  },
  dateTimeCard: {
    borderRadius: '16@s',
    padding: '16@s',
    borderWidth: 2,
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  dateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '6@vs',
  },
  dateTimeLabel: {
    fontSize: '14@s',
    marginLeft: '8@s',
    fontFamily: 'Poppins-Medium',
  },
  dateTimeValue: {
    fontSize: '16@s',
    fontFamily: 'Poppins-SemiBold',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10@vs',
  },
  availableSlotsContainer: {
    marginBottom: '12@vs',
  },
  slotsScrollContainer: {
    paddingRight: '16@s',
  },
  timeSlotButton: {
    paddingVertical: '8@vs',
    paddingHorizontal: '14@s',
    borderRadius: '20@s',
    marginRight: '8@s',
    borderWidth: 2,
    minWidth: '70@s',
    alignItems: 'center',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  timeSlotText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
  },
  quickTimeContainer: {
    marginBottom: '12@vs',
  },
  quickTimeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickTimeButton: {
    paddingVertical: '8@vs',
    paddingHorizontal: '14@s',
    borderRadius: '20@s',
    marginRight: '8@s',
    marginBottom: '8@vs',
    minWidth: '70@s',
    alignItems: 'center',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  quickTimeText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '10@s',
    borderRadius: '8@s',
    marginTop: '6@vs',
  },
  warningText: {
    fontSize: '12@s',
    marginLeft: '6@s',
    fontWeight: '500',
  },
});

export default DateTimeSelector;
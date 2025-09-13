// src/Dashboard/AddAppointment/CustomDatePickerModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomDatePickerModal = ({ visible, onClose, onDateSelect, selectedDate, theme, minimumDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    } else {
      setCurrentMonth(new Date());
    }
  }, [selectedDate]);

  // Get month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get day names
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Navigate to previous month
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Check if date is today
  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (day) => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Check if date is disabled (in the past)
  const isDisabled = (day) => {
    if (!minimumDate) return false;
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const minDate = new Date(minimumDate);
    minDate.setHours(0, 0, 0, 0);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < minDate;
  };

  // Handle date selection
  const handleDateSelect = (day) => {
    if (isDisabled(day)) return;
    
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Preserve time from selected date if it exists and is valid
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else {
      // Set default time if no valid time exists
      newDate.setHours(9, 0, 0, 0); // Default to 9:00 AM
    }
    onDateSelect(newDate);
    onClose();
  };

  // Generate calendar grid with proper week structure
  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const weeks = [];
    let currentWeek = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      
      // If we've filled a week (7 days), start a new week
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill the last week with empty cells if needed
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    
    // Add the last week if it has any days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Ensure we always have 6 rows for consistent height
    while (weeks.length < 6) {
      weeks.push(new Array(7).fill(null));
    }

    return weeks;
  };

  const calendarWeeks = generateCalendarGrid();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background || theme.surface || '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
              <FontAwesome5 name="chevron-left" size={18} color={theme.primary || '#007AFF'} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.monthYearButton}>
              <Text style={[styles.monthYearText, { color: theme.textPrimary || '#000000' }]}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <FontAwesome5 name="chevron-down" size={12} color={theme.primary || '#007AFF'} style={styles.dropdownIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <FontAwesome5 name="chevron-right" size={18} color={theme.primary || '#007AFF'} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            {dayNames.map((day) => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={[styles.dayHeaderText, { color: theme.textSecondary || '#666666' }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((day, dayIndex) => (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.dayCell,
                      day && isSelected(day) && { backgroundColor: theme.primary || '#007AFF' },
                      day && isToday(day) && !isSelected(day) && { borderColor: theme.primary || '#007AFF', borderWidth: 2 },
                    ]}
                    onPress={() => day && handleDateSelect(day)}
                    disabled={!day || isDisabled(day)}
                  >
                    {day && (
                      <Text
                        style={[
                          styles.dayText,
                          { color: theme.textPrimary || '#000000' },
                          isSelected(day) && { color: '#FFFFFF' },
                          isDisabled(day) && { color: theme.textLight || '#AAAAAA', opacity: 0.5 },
                        ]}
                      >
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary || '#666666' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                if (selectedDate) {
                  onDateSelect(selectedDate);
                }
                onClose();
              }} 
              style={[styles.okButton, { backgroundColor: theme.primary || '#007AFF' }]}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@s',
  },
  modalContainer: {
    borderRadius: '16@s',
    padding: '20@s',
    width: width * 0.9,
    maxWidth: '400@s',
    height: '480@s',
    shadowOffset: { width: 0, height: '10@s' },
    shadowOpacity: 0.25,
    shadowRadius: '20@s',
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20@s',
  },
  navButton: {
    padding: '8@s',
    borderRadius: '8@s',
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '12@s',
    paddingVertical: '8@s',
  },
  monthYearText: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
  },
  dropdownIcon: {
    marginLeft: '8@s',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: '10@s',
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: '8@s',
  },
  dayHeaderText: {
    fontSize: '12@s',
    fontFamily: 'Inter-SemiBold',
  },
  calendarGrid: {
    flex: 1,
    marginBottom: '20@s',
  },
  weekRow: {
    flexDirection: 'row',
    flex: 1,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: '2@s',
    borderRadius: '8@s',
  },
  dayText: {
    fontSize: '16@s',
    fontFamily: 'Inter-Medium',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: '16@s',
    paddingVertical: '8@s',
    marginRight: '12@s',
  },
  cancelButtonText: {
    fontSize: '16@s',
    fontFamily: 'Inter-Medium',
  },
  okButton: {
    paddingHorizontal: '20@s',
    paddingVertical: '10@s',
    borderRadius: '8@s',
  },
  okButtonText: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});

export default CustomDatePickerModal;
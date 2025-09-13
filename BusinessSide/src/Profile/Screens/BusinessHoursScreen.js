// src/BusinessProfile/Screens/BusinessHoursScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';

const BusinessHoursScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { businessHours, updateBusinessHours } = useBusiness();
  
  // State
  const [hours, setHours] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('open'); // 'open' or 'close'
  const [selectedDay, setSelectedDay] = useState('');
  
  // Load business hours
  useEffect(() => {
    if (businessHours) {
      setHours({...businessHours});
      setIsLoading(false);
    }
  }, [businessHours]);
  
  // Days of the week configuration
  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];
  
  // Format time for display (HH:MM 24-hour format)
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return 'Closed';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const parsedHours = parseInt(hours, 10);
      const formattedHours = parsedHours.toString().padStart(2, '0');
      return `${formattedHours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };
  
  // Parse time string to Date object
  const parseTimeString = (timeString) => {
    if (!timeString) return new Date();
    
    const date = new Date();
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(0);
    
    return date;
  };
  
  // Format date to time string
  const formatTimeString = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Handle day toggle (open/closed)
  const handleToggleDay = (day) => {
    setHours(prevHours => {
      const updatedHours = {...prevHours};
      
      if (updatedHours[day].open) {
        // Day was open, now closing
        updatedHours[day] = { open: null, close: null };
      } else {
        // Day was closed, now opening with default hours
        updatedHours[day] = { open: '09:00', close: '17:00' };
      }
      
      return updatedHours;
    });
  };
  
  // Open time picker
  const openTimePicker = (day, mode) => {
    setSelectedDay(day);
    setTimePickerMode(mode);
    setTimePickerVisible(true);
  };
  
  // Handle time selection
  const handleTimeConfirm = (date) => {
    setTimePickerVisible(false);
    
    if (!selectedDay) return;
    
    setHours(prevHours => {
      const updatedHours = {...prevHours};
      const timeString = formatTimeString(date);
      
      if (timePickerMode === 'open') {
        updatedHours[selectedDay].open = timeString;
      } else {
        updatedHours[selectedDay].close = timeString;
      }
      
      return updatedHours;
    });
  };
  
  // Handle cancel time picker
  const handleTimeCancel = () => {
    setTimePickerVisible(false);
  };
  
  // Copy hours from previous day
  const copyFromPreviousDay = (dayIndex) => {
    if (dayIndex <= 0) return;
    
    const previousDay = daysOfWeek[dayIndex - 1].key;
    const currentDay = daysOfWeek[dayIndex].key;
    
    setHours(prevHours => {
      const updatedHours = {...prevHours};
      updatedHours[currentDay] = {...prevHours[previousDay]};
      return updatedHours;
    });
  };
  
  // Save business hours
  const saveBusinessHours = async () => {
    setIsSubmitting(true);
    
    try {
      await updateBusinessHours(hours);
      
      Alert.alert(
        'Success',
        'Business hours updated successfully',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating business hours:', error);
      Alert.alert(
        'Error',
        'Failed to update business hours. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render day item
  const renderDayItem = (day, index) => {
    const dayKey = day.key;
    const dayHours = hours[dayKey] || { open: null, close: null };
    const isOpen = !!dayHours.open;
    
    return (
      <View 
        key={dayKey} 
        style={[
          styles.dayItem, 
          { borderBottomColor: theme.border }
        ]}
      >
        <View style={styles.dayHeader}>
          <Text style={[styles.dayLabel, { color: theme.textPrimary }]}>
            {day.label}
          </Text>
          
          <View style={styles.dayToggle}>
            <Text style={[
              styles.statusLabel, 
              { 
                color: isOpen ? theme.success : theme.textLight 
              }
            ]}>
              {isOpen ? 'Open' : 'Closed'}
            </Text>
            <Switch
              value={isOpen}
              onValueChange={() => handleToggleDay(dayKey)}
              trackColor={{ false: theme.border, true: theme.primary + '50' }}
              thumbColor={isOpen ? theme.primary : '#f4f3f4'}
              style={styles.switch}
            />
          </View>
        </View>
        
        {isOpen && (
          <View style={styles.hoursContainer}>
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
                Open
              </Text>
              <TouchableOpacity
                style={[
                  styles.timeButton, 
                  { backgroundColor: theme.backgroundLight, borderColor: theme.border }
                ]}
                onPress={() => openTimePicker(dayKey, 'open')}
              >
                <Text style={[styles.timeValue, { color: theme.textPrimary }]}>
                  {formatTimeDisplay(dayHours.open)}
                </Text>
                <FontAwesome5 name="clock" size={16} color={theme.primary} style={styles.timeIcon} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
                Close
              </Text>
              <TouchableOpacity
                style={[
                  styles.timeButton, 
                  { backgroundColor: theme.backgroundLight, borderColor: theme.border }
                ]}
                onPress={() => openTimePicker(dayKey, 'close')}
              >
                <Text style={[styles.timeValue, { color: theme.textPrimary }]}>
                  {formatTimeDisplay(dayHours.close)}
                </Text>
                <FontAwesome5 name="clock" size={16} color={theme.primary} style={styles.timeIcon} />
              </TouchableOpacity>
            </View>
            
            {index > 0 && (
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyFromPreviousDay(index)}
              >
                <FontAwesome5 name="copy" size={14} color={theme.primary} style={styles.copyIcon} />
                <Text style={[styles.copyText, { color: theme.primary }]}>
                  Copy from {daysOfWeek[index - 1].label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
            Loading business hours...
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
            Business Hours
          </Text>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.infoContainer}>
            <FontAwesome5 name="info-circle" size={18} color={theme.primary} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Set your regular business hours. Customers will be able to book appointments during these hours.
            </Text>
          </View>
          
          <View style={styles.hoursSection}>
            {daysOfWeek.map((day, index) => renderDayItem(day, index))}
          </View>
          
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { 
                backgroundColor: theme.primary,
                opacity: isSubmitting ? 0.7 : 1
              }
            ]}
            onPress={saveBusinessHours}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.white }]}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          minuteInterval={15}
          date={parseTimeString(selectedDay && hours[selectedDay] ? 
            (timePickerMode === 'open' ? hours[selectedDay].open : hours[selectedDay].close) : 
            null
          )}
          onConfirm={handleTimeConfirm}
          onCancel={handleTimeCancel}
        />
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
    borderBottomWidth: 1,
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
  infoContainer: {
    flexDirection: 'row',
    padding: '16@s',
    backgroundColor: '#E8F5E9',
    margin: '16@s',
    borderRadius: '8@s',
  },
  infoIcon: {
    marginRight: '10@s',
    marginTop: '2@vs',
  },
  infoText: {
    flex: 1,
    fontSize: '14@s',
    lineHeight: '20@s',
  },
  hoursSection: {
    margin: '16@s',
    marginTop: '0@vs',
  },
  dayItem: {
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: '16@s',
    fontWeight: '500',
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: '14@s',
    marginRight: '8@s',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  hoursContainer: {
    marginTop: '12@vs',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8@vs',
  },
  timeLabel: {
    fontSize: '14@s',
    width: '60@s',
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10@s',
    borderRadius: '8@s',
    borderWidth: 1,
  },
  timeValue: {
    fontSize: '14@s',
  },
  timeIcon: {
    marginLeft: '8@s',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '8@vs',
    alignSelf: 'flex-end',
  },
  copyIcon: {
    marginRight: '6@s',
  },
  copyText: {
    fontSize: '14@s',
  },
  saveButton: {
    marginHorizontal: '16@s',
    marginVertical: '24@vs',
    padding: '16@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
});

export default BusinessHoursScreen;

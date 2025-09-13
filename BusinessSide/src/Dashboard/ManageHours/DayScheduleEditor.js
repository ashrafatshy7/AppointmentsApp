
// src/Dashboard/Components/DayScheduleEditor.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomTimePickerModal from '../Components/CustomTimePickerModal';

const DayScheduleEditor = ({ dayKey, dayLabel, schedule, onUpdate, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [showBreakStartPicker, setShowBreakStartPicker] = useState(false);
  const [showBreakEndPicker, setShowBreakEndPicker] = useState(false);
  const [editingBreakIndex, setEditingBreakIndex] = useState(-1);
  const [currentTimeForPicker, setCurrentTimeForPicker] = useState(new Date());

  const isOpen = schedule && schedule.open && schedule.close;
  const breaks = schedule?.breaks || [];

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const timeStringToDate = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const dateToTimeString = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const toggleDay = () => {
    if (isOpen) {
      // Close the day
      onUpdate(null);
    } else {
      // Open the day with default hours
      onUpdate({
        open: '09:00',
        close: '17:00',
        breaks: []
      });
    }
  };

  const handleTimeUpdate = (field, selectedTime) => {
    const timeString = dateToTimeString(selectedTime);
    const updatedSchedule = { ...schedule, [field]: timeString };
    onUpdate(updatedSchedule);
    
    setShowOpenTimePicker(false);
    setShowCloseTimePicker(false);
  };

  const addBreak = () => {
    const newBreak = { start: '12:00', end: '13:00' };
    const updatedSchedule = {
      ...schedule,
      breaks: [...breaks, newBreak]
    };
    onUpdate(updatedSchedule);
  };

  const removeBreak = (index) => {
    Alert.alert(
      'Remove Break',
      'Are you sure you want to remove this break?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: () => {
            const updatedBreaks = breaks.filter((_, i) => i !== index);
            const updatedSchedule = { ...schedule, breaks: updatedBreaks };
            onUpdate(updatedSchedule);
          }
        }
      ]
    );
  };

  const handleBreakTimeUpdate = (field, selectedTime) => {
    const timeString = dateToTimeString(selectedTime);
    const updatedBreaks = [...breaks];
    updatedBreaks[editingBreakIndex] = {
      ...updatedBreaks[editingBreakIndex],
      [field]: timeString
    };
    
    const updatedSchedule = { ...schedule, breaks: updatedBreaks };
    onUpdate(updatedSchedule);
    
    setShowBreakStartPicker(false);
    setShowBreakEndPicker(false);
    setEditingBreakIndex(-1);
  };

  const openBreakTimePicker = (field, index) => {
    setEditingBreakIndex(index);
    if (field === 'start') {
      setShowBreakStartPicker(true);
    } else {
      setShowBreakEndPicker(true);
    }
  };

  return (
    <View style={[styles.dayContainer, { borderColor: theme.border }]}>
      {/* Day Header */}
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.dayHeaderLeft}>
          <TouchableOpacity
            style={[
              styles.dayToggle,
              isOpen ? { backgroundColor: theme.primary } : { backgroundColor: theme.backgroundGray }
            ]}
            onPress={toggleDay}
          >
            {isOpen && <FontAwesome5 name="check" size={12} color={theme.white} />}
          </TouchableOpacity>
          
          <View style={styles.dayInfo}>
            <Text style={[styles.dayLabel, { color: theme.textPrimary }]}>
              {dayLabel}
            </Text>
            <Text style={[styles.dayStatus, { color: theme.textSecondary }]}>
              {isOpen 
                ? `${formatTime(schedule.open)} - ${formatTime(schedule.close)}`
                : 'Closed'
              }
            </Text>
          </View>
        </View>

        {isOpen && (
          <FontAwesome5 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={14} 
            color={theme.textLight} 
          />
        )}
      </TouchableOpacity>

      {/* Day Details */}
      {isOpen && isExpanded && (
        <View style={styles.dayDetails}>
          {/* Working Hours */}
          <View style={styles.timingSection}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Working Hours
            </Text>
            
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: theme.backgroundLight }]}
                onPress={() => {
                  setCurrentTimeForPicker(timeStringToDate(schedule.open));
                  setShowOpenTimePicker(true);
                }}
              >
                <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Open</Text>
                <Text style={[styles.timeValue, { color: theme.textPrimary }]}>
                  {formatTime(schedule.open)}
                </Text>
              </TouchableOpacity>

              <View style={styles.timeSeparator}>
                <Text style={[styles.separatorText, { color: theme.textLight }]}>to</Text>
              </View>

              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: theme.backgroundLight }]}
                onPress={() => {
                  setCurrentTimeForPicker(timeStringToDate(schedule.close));
                  setShowCloseTimePicker(true);
                }}
              >
                <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Close</Text>
                <Text style={[styles.timeValue, { color: theme.textPrimary }]}>
                  {formatTime(schedule.close)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Breaks */}
          <View style={styles.breaksSection}>
            <View style={styles.breaksSectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Breaks
              </Text>
              <TouchableOpacity
                style={[styles.addBreakButton, { backgroundColor: theme.primary + '20' }]}
                onPress={addBreak}
              >
                <FontAwesome5 name="plus" size={12} color={theme.primary} />
                <Text style={[styles.addBreakText, { color: theme.primary }]}>
                  Add Break
                </Text>
              </TouchableOpacity>
            </View>

            {breaks.length === 0 ? (
              <Text style={[styles.noBreaksText, { color: theme.textLight }]}>
                No breaks scheduled
              </Text>
            ) : (
              breaks.map((breakTime, index) => (
                <View key={index} style={[styles.breakItem, { backgroundColor: theme.backgroundLight }]}>
                  <View style={styles.breakTimes}>
                    <TouchableOpacity
                      style={styles.breakTimeButton}
                      onPress={() => {
                        setCurrentTimeForPicker(timeStringToDate(breakTime.start));
                        openBreakTimePicker('start', index);
                      }}
                    >
                      <Text style={[styles.breakTimeText, { color: theme.textPrimary }]}>
                        {formatTime(breakTime.start)}
                      </Text>
                    </TouchableOpacity>
                    
                    <Text style={[styles.breakSeparator, { color: theme.textSecondary }]}>-</Text>
                    
                    <TouchableOpacity
                      style={styles.breakTimeButton}
                      onPress={() => {
                        setCurrentTimeForPicker(timeStringToDate(breakTime.end));
                        openBreakTimePicker('end', index);
                      }}
                    >
                      <Text style={[styles.breakTimeText, { color: theme.textPrimary }]}>
                        {formatTime(breakTime.end)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeBreakButton}
                    onPress={() => removeBreak(index)}
                  >
                    <FontAwesome5 name="trash" size={12} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Time Pickers */}
      <CustomTimePickerModal
        visible={showOpenTimePicker}
        onClose={() => setShowOpenTimePicker(false)}
        onTimeSelect={(time) => handleTimeUpdate('open', time)}
        selectedTime={currentTimeForPicker}
        theme={theme}
      />

      <CustomTimePickerModal
        visible={showCloseTimePicker}
        onClose={() => setShowCloseTimePicker(false)}
        onTimeSelect={(time) => handleTimeUpdate('close', time)}
        selectedTime={currentTimeForPicker}
        theme={theme}
      />

      <CustomTimePickerModal
        visible={showBreakStartPicker}
        onClose={() => {
          setShowBreakStartPicker(false);
          setEditingBreakIndex(-1);
        }}
        onTimeSelect={(time) => handleBreakTimeUpdate('start', time)}
        selectedTime={currentTimeForPicker}
        theme={theme}
      />

      <CustomTimePickerModal
        visible={showBreakEndPicker}
        onClose={() => {
          setShowBreakEndPicker(false);
          setEditingBreakIndex(-1);
        }}
        onTimeSelect={(time) => handleBreakTimeUpdate('end', time)}
        selectedTime={currentTimeForPicker}
        theme={theme}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  dayContainer: {
    marginHorizontal: '16@s',
    marginBottom: '12@vs',
    borderRadius: '12@s',
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16@s',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayToggle: {
    width: '24@s',
    height: '24@s',
    borderRadius: '12@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@s',
  },
  dayInfo: {
    flex: 1,
  },
  dayLabel: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  dayStatus: {
    fontSize: '14@s',
    marginTop: '2@vs',
  },
  dayDetails: {
    paddingHorizontal: '16@s',
    paddingBottom: '16@vs',
  },
  timingSection: {
    marginBottom: '20@vs',
  },
  sectionTitle: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '12@vs',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    flex: 1,
    padding: '12@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: '12@s',
    marginBottom: '4@vs',
  },
  timeValue: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  timeSeparator: {
    paddingHorizontal: '16@s',
  },
  separatorText: {
    fontSize: '14@s',
  },
  breaksSection: {
    marginTop: '8@vs',
  },
  breaksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12@vs',
  },
  addBreakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '6@vs',
    paddingHorizontal: '12@s',
    borderRadius: '16@s',
  },
  addBreakText: {
    fontSize: '12@s',
    fontWeight: '500',
    marginLeft: '4@s',
  },
  noBreaksText: {
    fontSize: '14@s',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: '16@vs',
  },
  breakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12@s',
    borderRadius: '8@s',
    marginBottom: '8@vs',
  },
  breakTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakTimeButton: {
    paddingVertical: '4@vs',
    paddingHorizontal: '8@s',
  },
  breakTimeText: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  breakSeparator: {
    marginHorizontal: '8@s',
    fontSize: '14@s',
  },
  removeBreakButton: {
    padding: '8@s',
  },
});

export default DayScheduleEditor;
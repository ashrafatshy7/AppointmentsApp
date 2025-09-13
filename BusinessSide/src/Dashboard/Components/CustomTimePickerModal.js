// src/Dashboard/AddAppointment/CustomTimePickerModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';

const { width } = Dimensions.get('window');

const CustomTimePickerModal = ({ visible, onClose, onTimeSelect, selectedTime, theme }) => {
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);

  useEffect(() => {
    if (selectedTime && !isNaN(selectedTime.getTime())) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      
      setSelectedHour(hours);
      setSelectedMinute(minutes);
    } else {
      // Set default values if selectedTime is invalid
      setSelectedHour(9);
      setSelectedMinute(0);
    }
  }, [selectedTime]);

  const handleTimeConfirm = () => {
    // Create a new date, handling invalid selectedTime
    const newTime = selectedTime && !isNaN(selectedTime.getTime()) 
      ? new Date(selectedTime) 
      : new Date();
    
    // Set the time directly (already in 24-hour format)
    newTime.setHours(selectedHour);
    newTime.setMinutes(selectedMinute);
    newTime.setSeconds(0);
    
    onTimeSelect(newTime);
    onClose();
  };

  // Generate hours (0-23) and minutes
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute intervals

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
            <Text style={[styles.headerTitle, { color: theme.textPrimary || '#000000' }]}>Select Time</Text>
          </View>

          {/* Current Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={[styles.timeText, { color: theme.primary || '#007AFF' }]}>
              {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
            </Text>
          </View>

          {/* Time Selection */}
          <View style={styles.selectionContainer}>
            {/* Hours */}
            <View style={styles.timeSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary || '#666666' }]}>Hour</Text>
              <ScrollView style={styles.hoursScrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.numbersGrid}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.numberButton,
                        { borderColor: theme.border || '#E0E0E0' },
                        selectedHour === hour && { backgroundColor: theme.primary || '#007AFF' }
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text
                        style={[
                          styles.numberText,
                          { color: selectedHour === hour ? '#FFFFFF' : (theme.textPrimary || '#000000') }
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Minutes */}
            <View style={styles.timeSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary || '#666666' }]}>Minute</Text>
              <View style={styles.numbersGrid}>
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.numberButton,
                      { borderColor: theme.border || '#E0E0E0' },
                      selectedMinute === minute && { backgroundColor: theme.primary || '#007AFF' }
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        styles.numberText,
                        { color: selectedMinute === minute ? '#FFFFFF' : (theme.textPrimary || '#000000') }
                      ]}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary || '#666666' }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleTimeConfirm}
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
    width: width * 0.85,
    maxWidth: '350@s',
    shadowOffset: { width: 0, height: '10@s' },
    shadowOpacity: 0.25,
    shadowRadius: '20@s',
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: '15@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: '20@s',
  },
  timeText: {
    fontSize: '32@s',
    fontFamily: 'Inter-Bold',
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '20@s',
  },
  timeSection: {
    flex: 1,
    marginHorizontal: '5@s',
  },
  sectionLabel: {
    fontSize: '14@s',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: '10@s',
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  numberButton: {
    width: '32@s',
    height: '32@s',
    borderRadius: '16@s',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '2@s',
    borderWidth: 1,
    // borderColor will be set dynamically via theme
  },
  numberText: {
    fontSize: '12@s',
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
  hoursScrollContainer: {
    maxHeight: '120@s',
  },
});

export default CustomTimePickerModal;
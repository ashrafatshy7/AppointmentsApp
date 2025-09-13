// src/Dashboard/Components/TemporaryBreaksTab.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomDatePickerModal from '../Components/CustomDatePickerModal';
import CustomTimePickerModal from '../Components/CustomTimePickerModal';
import ApiService from '../Service/ApiService';
import AffectedAppointmentsModal from './AffectedAppointmentsModal';

const TemporaryBreaksTab = ({ breaks, businessId, onAdd, onRefresh, theme }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [affectedAppointments, setAffectedAppointments] = useState([]);
  const [showAffectedModal, setShowAffectedModal] = useState(false);
  const [pendingBreak, setPendingBreak] = useState(null);

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const dateToTimeString = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date());
    setReason('');
    setAffectedAppointments([]);
    setPendingBreak(null);
  };

  const handleAddBreak = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the break');
      return;
    }

    if (startTime >= endTime) {
      Alert.alert('Error', 'Start time must be before end time');
      return;
    }

    if (!businessId) {
      Alert.alert('Error', 'Business ID not found. Please try again.');
      return;
    }

    try {
      const breakData = {
        date: date.toISOString().split('T')[0],
        startTime: dateToTimeString(startTime),
        endTime: dateToTimeString(endTime),
        reason: reason.trim()
      };


      // First, get affected appointments
      const affected = await ApiService.getAffectedAppointments(businessId, breakData);
      
      if (affected && affected.appointments && affected.appointments.length > 0) {
        // Store the break data for later creation
        setPendingBreak({ breakData });
        setAffectedAppointments(affected.appointments);
        
        setShowAddModal(false);
        
        // Wait for add modal to close, then show affected modal
        setTimeout(() => {
          setShowAffectedModal(true);
        }, 300);
      } else {
        // No affected appointments, add directly
        const result = await onAdd(breakData);
        setShowAddModal(false);
        resetForm();
        Alert.alert('Success', 'Temporary break added successfully');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to add temporary break: ${error.message}`);
    }
  };

  const handleConfirmBreak = async () => {
    if (!pendingBreak || !pendingBreak.breakData) return;

    try {
      // First, create the break
      const result = await onAdd(pendingBreak.breakData);
      
      if (result && result.break) {
        // Then confirm it (which cancels appointments)
        await ApiService.confirmTemporaryBreak(businessId, result.break._id);
        
        setShowAffectedModal(false);
        setShowAddModal(false);
        resetForm();
        onRefresh();
        Alert.alert('Success', `Temporary break confirmed. ${affectedAppointments.length} appointments have been cancelled.`);
      } else {
        throw new Error('Failed to create break');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm break: ' + error.message);
    }
  };

  const handleDeleteBreak = (breakItem) => {
    Alert.alert(
      'Delete Break',
      'Are you sure you want to delete this temporary break?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteTemporaryBreak(businessId, breakItem._id);
              onRefresh();
              Alert.alert('Success', 'Temporary break deleted successfully');
            } catch (error) {
              console.error('Error deleting break:', error);
              Alert.alert('Error', 'Failed to delete break');
            }
          }
        }
      ]
    );
  };

  const onDateChange = (selectedDate) => {
    setShowDatePicker(false);
    setDate(selectedDate);
  };

  const onStartTimeChange = (selectedTime) => {
    setShowStartTimePicker(false);
    setStartTime(selectedTime);
    // If end time is before start time, adjust it
    if (selectedTime >= endTime) {
      const newEndTime = new Date(selectedTime);
      newEndTime.setHours(newEndTime.getHours() + 1);
      setEndTime(newEndTime);
    }
  };

  const onEndTimeChange = (selectedTime) => {
    setShowEndTimePicker(false);
    setEndTime(selectedTime);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: theme.textSecondary }]}>
            Add temporary breaks for specific time periods on certain days. Appointments during these times will be automatically cancelled.
          </Text>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <FontAwesome5 name="plus" size={16} color={theme.white} style={styles.addButtonIcon} />
            <Text style={[styles.addButtonText, { color: theme.white }]}>
              Add Break
            </Text>
          </TouchableOpacity>
        </View>

        {breaks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="pause-circle" size={48} color={theme.textLight} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No Temporary Breaks
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Add temporary breaks for appointments, extended lunch breaks, or other time-specific closures.
            </Text>
          </View>
        ) : (
          <View style={styles.breaksContainer}>
            {breaks.map((breakItem, index) => (
              <View key={breakItem._id || index} style={[styles.breakCard, { backgroundColor: theme.backgroundLight }]}>
                <View style={styles.breakHeader}>
                  <View style={styles.breakInfo}>
                    <Text style={[styles.breakReason, { color: theme.textPrimary }]}>
                      {breakItem.reason}
                    </Text>
                    <Text style={[styles.breakDateTime, { color: theme.textSecondary }]}>
                      {formatDateShort(breakItem.date)} • {formatTime(breakItem.startTime)} - {formatTime(breakItem.endTime)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteBreak(breakItem)}
                  >
                    <FontAwesome5 name="trash" size={16} color={theme.danger} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.breakDetails}>
                  <FontAwesome5 name="pause-circle" size={14} color={theme.warning} style={styles.detailIcon} />
                  <Text style={[styles.breakDetailText, { color: theme.textSecondary }]}>
                    Added on {new Date(breakItem.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Break Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}>
              <Text style={[styles.modalCancelText, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Add Temporary Break
            </Text>
            
            <TouchableOpacity onPress={handleAddBreak}>
              <Text style={[styles.modalSaveText, { color: theme.primary }]}>Check Conflicts</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Date
              </Text>
              
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.backgroundLight }]}
                onPress={() => setShowDatePicker(true)}
              >
                <FontAwesome5 name="calendar-alt" size={16} color={theme.primary} style={styles.dateIcon} />
                <Text style={[styles.dateValue, { color: theme.textPrimary }]}>
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Time Period
              </Text>
              
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: theme.backgroundLight }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Start</Text>
                  <Text style={[styles.timeValue, { color: theme.textPrimary }]}>
                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Text>
                </TouchableOpacity>

                <View style={styles.timeSeparator}>
                  <Text style={[styles.separatorText, { color: theme.textLight }]}>to</Text>
                </View>

                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: theme.backgroundLight }]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>End</Text>
                  <Text style={[styles.timeValue, { color: theme.textPrimary }]}>
                    {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Reason for Break
              </Text>
              <TextInput
                style={[styles.reasonInput, { 
                  backgroundColor: theme.backgroundLight,
                  borderColor: theme.border,
                  color: theme.textPrimary 
                }]}
                placeholder="e.g., Personal appointment, Extended break..."
                placeholderTextColor={theme.textLight}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.previewSection}>
              <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>
                Break Preview
              </Text>
              <View style={[styles.previewCard, { backgroundColor: theme.backgroundLight }]}>
                <Text style={[styles.previewText, { color: theme.textSecondary }]}>
                  Business will be closed on {formatDate(date)} from {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} to {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}.
                </Text>
                {reason.trim() && (
                  <Text style={[styles.previewReason, { color: theme.textPrimary }]}>
                    Reason: {reason.trim()}
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Date and Time Pickers */}
        <CustomDatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={onDateChange}
          selectedDate={date}
          minimumDate={new Date()}
          theme={theme}
        />

        <CustomTimePickerModal
          visible={showStartTimePicker}
          onClose={() => setShowStartTimePicker(false)}
          onTimeSelect={onStartTimeChange}
          selectedTime={startTime}
          theme={theme}
        />

        <CustomTimePickerModal
          visible={showEndTimePicker}
          onClose={() => setShowEndTimePicker(false)}
          onTimeSelect={onEndTimeChange}
          selectedTime={endTime}
          theme={theme}
        />
      </Modal>

      {/* Affected Appointments Modal - MOVED OUTSIDE FOR BETTER Z-INDEX */}
      <AffectedAppointmentsModal
        visible={showAffectedModal || (affectedAppointments.length > 0 && pendingBreak !== null)}
        appointments={affectedAppointments}
        onConfirm={handleConfirmBreak}
        onCancel={() => {
          setShowAffectedModal(false);
          setShowAddModal(false);
          resetForm();
        }}
        title="Confirm Temporary Break"
        message="The following appointments will be cancelled:"
        theme={theme}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    padding: '16@s',
  },
  headerText: {
    fontSize: '14@s',
    lineHeight: '20@vs',
    marginBottom: '16@vs',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@vs',
    paddingHorizontal: '20@s',
    borderRadius: '8@s',
  },
  addButtonIcon: {
    marginRight: '8@s',
  },
  addButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '60@vs',
    paddingHorizontal: '32@s',
  },
  emptyTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    marginTop: '16@vs',
    marginBottom: '8@vs',
  },
  emptySubtext: {
    fontSize: '16@s',
    textAlign: 'center',
    lineHeight: '22@vs',
  },
  breaksContainer: {
    paddingHorizontal: '16@s',
  },
  breakCard: {
    borderRadius: '12@s',
    padding: '16@s',
    marginBottom: '12@vs',
  },
  breakHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '8@vs',
  },
  breakInfo: {
    flex: 1,
  },
  breakReason: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '4@vs',
  },
  breakDateTime: {
    fontSize: '14@s',
  },
  deleteButton: {
    padding: '4@s',
  },
  breakDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: '6@s',
  },
  breakDetailText: {
    fontSize: '12@s',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
  },
  modalCancelText: {
    fontSize: '16@s',
  },
  modalTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  modalSaveText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: '16@s',
  },
  formSection: {
    marginTop: '24@vs',
    marginBottom: '24@vs',
  },
  formLabel: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '12@vs',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '12@s',
    borderRadius: '8@s',
  },
  dateIcon: {
    marginRight: '12@s',
  },
  dateValue: {
    fontSize: '16@s',
    fontWeight: '500',
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
  reasonInput: {
    borderWidth: 1,
    borderRadius: '8@s',
    padding: '12@s',
    fontSize: '16@s',
    minHeight: '80@vs',
  },
  previewSection: {
    marginBottom: '32@vs',
  },
  previewTitle: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '12@vs',
  },
  previewCard: {
    padding: '16@s',
    borderRadius: '8@s',
  },
  previewText: {
    fontSize: '14@s',
    lineHeight: '20@vs',
    marginBottom: '8@vs',
  },
  previewReason: {
    fontSize: '14@s',
    fontWeight: '500',
  },
});

export default TemporaryBreaksTab;
// src/Dashboard/Components/TemporaryClosuresTab.js
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
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomDatePickerModal from '../Components/CustomDatePickerModal';
import ApiService from '../Service/ApiService';
import AffectedAppointmentsModal from './AffectedAppointmentsModal';

const TemporaryClosuresTab = ({ closures, businessId, onAdd, onRefresh, theme }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [affectedAppointments, setAffectedAppointments] = useState([]);
  const [showAffectedModal, setShowAffectedModal] = useState(false);
  const [pendingClosure, setPendingClosure] = useState(null);

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

  const resetForm = () => {
    setStartDate(new Date());
    setEndDate(new Date());
    setReason('');
    setAffectedAppointments([]);
    setPendingClosure(null);
  };

  const handleAddClosure = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the closure');
      return;
    }

    if (startDate > endDate) {
      Alert.alert('Error', 'Start date cannot be after end date');
      return;
    }

    if (!businessId) {
      Alert.alert('Error', 'Business ID not found. Please try again.');
      return;
    }

    try {
      const closureData = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason: reason.trim()
      };


      // First, get affected appointments
      const affected = await ApiService.getAffectedAppointments(businessId, closureData);
      
      if (affected && affected.appointments && affected.appointments.length > 0) {
        // Store the closure data for later creation
        setPendingClosure({ closureData });
        setAffectedAppointments(affected.appointments);
        
        setShowAddModal(false);
        
        // Wait for add modal to close, then show affected modal
        setTimeout(() => {
          setShowAffectedModal(true);
        }, 300);
      } else {
        // No affected appointments, add directly
        const result = await onAdd(closureData);
        setShowAddModal(false);
        resetForm();
        Alert.alert('Success', 'Temporary closure added successfully');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to add temporary closure: ${error.message}`);
    }
  };

  const handleConfirmClosure = async () => {
    if (!pendingClosure || !pendingClosure.closureData) return;

    try {
      // First, create the closure
      const result = await onAdd(pendingClosure.closureData);
      
      if (result && result.closure) {
        // Then confirm it (which cancels appointments)
        await ApiService.confirmTemporaryClosure(businessId, result.closure._id);
        
        setShowAffectedModal(false);
        setShowAddModal(false);
        resetForm();
        onRefresh();
        Alert.alert('Success', `Temporary closure confirmed. ${affectedAppointments.length} appointments have been cancelled.`);
      } else {
        throw new Error('Failed to create closure');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm closure: ' + error.message);
    }
  };

  const handleDeleteClosure = (closure) => {
    Alert.alert(
      'Delete Closure',
      'Are you sure you want to delete this temporary closure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteTemporaryClosure(businessId, closure._id);
              onRefresh();
              Alert.alert('Success', 'Temporary closure deleted successfully');
            } catch (error) {
              console.error('Error deleting closure:', error);
              Alert.alert('Error', 'Failed to delete closure');
            }
          }
        }
      ]
    );
  };

  const onStartDateChange = (selectedDate) => {
    setShowStartDatePicker(false);
    setStartDate(selectedDate);
    if (selectedDate > endDate) {
      setEndDate(selectedDate);
    }
  };

  const onEndDateChange = (selectedDate) => {
    setShowEndDatePicker(false);
    setEndDate(selectedDate);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: theme.textSecondary }]}>
            Add temporary closures for days when your business will be closed. All appointments during these periods will be automatically cancelled.
          </Text>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <FontAwesome5 name="plus" size={16} color={theme.white} style={styles.addButtonIcon} />
            <Text style={[styles.addButtonText, { color: theme.white }]}>
              Add Closure
            </Text>
          </TouchableOpacity>
        </View>

        {closures.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="calendar-times" size={48} color={theme.textLight} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No Temporary Closures
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Add temporary closures for vacation days, holidays, or unexpected business closures.
            </Text>
          </View>
        ) : (
          <View style={styles.closuresContainer}>
            {closures.map((closure, index) => (
              <View key={closure._id || index} style={[styles.closureCard, { backgroundColor: theme.backgroundLight }]}>
                <View style={styles.closureHeader}>
                  <View style={styles.closureInfo}>
                    <Text style={[styles.closureReason, { color: theme.textPrimary }]}>
                      {closure.reason}
                    </Text>
                    <Text style={[styles.closureDates, { color: theme.textSecondary }]}>
                      {formatDateShort(closure.startDate)} - {formatDateShort(closure.endDate)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteClosure(closure)}
                  >
                    <FontAwesome5 name="trash" size={16} color={theme.danger} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.closureDetails}>
                  <FontAwesome5 name="calendar-times" size={14} color={theme.warning} style={styles.detailIcon} />
                  <Text style={[styles.closureDetailText, { color: theme.textSecondary }]}>
                    Added on {new Date(closure.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Closure Modal */}
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
              Add Temporary Closure
            </Text>
            
            <TouchableOpacity onPress={handleAddClosure}>
              <Text style={[styles.modalSaveText, { color: theme.primary }]}>Check Conflicts</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Closure Period
              </Text>
              
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.backgroundLight }]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Start Date</Text>
                  <Text style={[styles.dateValue, { color: theme.textPrimary }]}>
                    {formatDateShort(startDate)}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dateSeparator}>
                  <Text style={[styles.separatorText, { color: theme.textLight }]}>to</Text>
                </View>

                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.backgroundLight }]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>End Date</Text>
                  <Text style={[styles.dateValue, { color: theme.textPrimary }]}>
                    {formatDateShort(endDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Reason for Closure
              </Text>
              <TextInput
                style={[styles.reasonInput, { 
                  backgroundColor: theme.backgroundLight,
                  borderColor: theme.border,
                  color: theme.textPrimary 
                }]}
                placeholder="e.g., Vacation, Holiday, Emergency..."
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
                Closure Preview
              </Text>
              <View style={[styles.previewCard, { backgroundColor: theme.backgroundLight }]}>
                <Text style={[styles.previewText, { color: theme.textSecondary }]}>
                  Your business will be closed from {formatDate(startDate)} to {formatDate(endDate)}.
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

        {/* Date Pickers */}
        <CustomDatePickerModal
          visible={showStartDatePicker}
          onClose={() => setShowStartDatePicker(false)}
          onDateSelect={onStartDateChange}
          selectedDate={startDate}
          minimumDate={new Date()}
          theme={theme}
        />

        <CustomDatePickerModal
          visible={showEndDatePicker}
          onClose={() => setShowEndDatePicker(false)}
          onDateSelect={onEndDateChange}
          selectedDate={endDate}
          minimumDate={startDate}
          theme={theme}
        />
      </Modal>

      {/* Affected Appointments Modal */}
      <AffectedAppointmentsModal
        visible={showAffectedModal}
        appointments={affectedAppointments}
        onConfirm={handleConfirmClosure}
        onCancel={() => {
          setShowAffectedModal(false);
          setShowAddModal(false);
          resetForm();
        }}
        title="Confirm Temporary Closure"
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
  closuresContainer: {
    paddingHorizontal: '16@s',
  },
  closureCard: {
    borderRadius: '12@s',
    padding: '16@s',
    marginBottom: '12@vs',
  },
  closureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '8@vs',
  },
  closureInfo: {
    flex: 1,
  },
  closureReason: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '4@vs',
  },
  closureDates: {
    fontSize: '14@s',
  },
  deleteButton: {
    padding: '4@s',
  },
  closureDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: '6@s',
  },
  closureDetailText: {
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    padding: '12@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: '12@s',
    marginBottom: '4@vs',
  },
  dateValue: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  dateSeparator: {
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

export default TemporaryClosuresTab;
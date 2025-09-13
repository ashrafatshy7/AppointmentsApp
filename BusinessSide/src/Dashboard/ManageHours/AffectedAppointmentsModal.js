// src/Dashboard/Components/AffectedAppointmentsModal.js
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';

const AffectedAppointmentsModal = ({ 
  visible, 
  appointments, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  theme 
}) => {
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const renderAppointmentItem = ({ item }) => (
    <View style={[styles.appointmentItem, { backgroundColor: theme.background }]}>
      <View style={styles.appointmentInfo}>
        <Text style={[styles.customerName, { color: theme.textPrimary }]}>
                          {item.user?.name || 'Unknown Customer'}
        </Text>
        <Text style={[styles.serviceName, { color: theme.textSecondary }]}>
          {item.service?.name || 'Unknown Service'}
        </Text>
        <Text style={[styles.appointmentDateTime, { color: theme.textLight }]}>
          {item.date} at {item.time}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: theme.danger + '20' }]}>
        <Text style={[styles.statusText, { color: theme.danger }]}>
          Will be cancelled
        </Text>
      </View>
    </View>
  );

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to cancel ${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: 'destructive',
          onPress: onConfirm 
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
      transparent={false}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={[styles.cancelText, { color: theme.primary }]}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
            {title}
          </Text>
          
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={[styles.confirmText, { color: theme.danger }]}>Confirm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.messageContainer}>
            <FontAwesome5 name="exclamation-triangle" size={24} color={theme.warning} style={styles.warningIcon} />
            <Text style={[styles.messageText, { color: theme.textPrimary }]}>
              {message}
            </Text>
            <Text style={[styles.countText, { color: theme.textSecondary }]}>
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} will be affected
            </Text>
          </View>

          {appointments.length > 0 && (
            <FlatList
              data={appointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item) => item._id || item.id}
              style={styles.appointmentsList}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              showsVerticalScrollIndicator={true}
            />
          )}

          <View style={styles.noteContainer}>
            <FontAwesome5 name="info-circle" size={16} color={theme.info} style={styles.noteIcon} />
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              Customers will need to be notified about the cancellation. Consider sending them a message to reschedule.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = ScaledSheet.create({
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
  cancelText: {
    fontSize: '16@s',
  },
  modalTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  confirmText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: '16@s',
  },
  messageContainer: {
    alignItems: 'center',
    paddingVertical: '24@vs',
  },
  warningIcon: {
    marginBottom: '12@vs',
  },
  messageText: {
    fontSize: '16@s',
    textAlign: 'center',
    marginBottom: '8@vs',
  },
  countText: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  appointmentsList: {
    flex: 1,
    marginVertical: '16@vs',
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12@s',
    borderRadius: '8@s',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  appointmentInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '2@vs',
  },
  serviceName: {
    fontSize: '14@s',
    marginBottom: '2@vs',
  },
  appointmentDateTime: {
    fontSize: '12@s',
  },
  statusBadge: {
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '12@s',
  },
  statusText: {
    fontSize: '12@s',
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: '16@vs',
    paddingHorizontal: '12@s',
  },
  noteIcon: {
    marginRight: '8@s',
    marginTop: '2@vs',
  },
  noteText: {
    flex: 1,
    fontSize: '14@s',
    lineHeight: '20@vs',
  },
});

export default AffectedAppointmentsModal;
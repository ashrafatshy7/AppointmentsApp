// src/AppointmentsPage/AppointmentDetailsModal.js

import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../Constants/Colors';
import { useTheme } from '../../Context/ThemeContext';

const AppointmentDetailsModal = ({ 
  visible, 
  appointment, 
  onClose,
  onCancel,
  onRequestReschedule,
  canCancel 
}) => {
  const { theme } = useTheme();
  
  // Guard clause to prevent crashes
  if (!visible || !appointment) return null;
  
  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Fallback to raw string
    }
  };

  // Get status color based on appointment status
  const getStatusColor = () => {
    switch (appointment.status) {
      case 'upcoming':
        return theme.success;  // Green
      case 'completed':
        return theme.info;     // Blue
      case 'canceled':
        return theme.danger;   // Red
      default:
        return theme.textLight; // Grey
    }
  };

  // Format the status for display
  const getStatusText = () => {
    switch (appointment.status) {
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };
  
  // Handle cancel appointment with confirmation
  const handleCancelAppointment = () => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            // Call the parent component's onCancel handler
            if (onCancel) {
              onCancel(appointment.id);
            }
          }
        }
      ]
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          {/* Header with close button */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Appointment Details
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <FontAwesome5 name="times" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.modalBody}>
            {/* Status banner */}
            <View style={[styles.statusBanner, { backgroundColor: getStatusColor() }]}>
              <FontAwesome5 
                name={appointment.status === 'upcoming' ? 'calendar-check' : 
                      appointment.status === 'completed' ? 'check-circle' : 'times-circle'} 
                size={18} 
                color={theme.white} 
              />
              <Text style={[styles.statusText, { color: theme.white }]}>
                {getStatusText()}
              </Text>
            </View>
            
            {/* Business info */}
            <View style={[styles.businessSection, { backgroundColor: theme.backgroundLight }]}>
              <Image 
                source={appointment.businessImage} 
                style={styles.businessImage}
              />
              <View style={styles.businessInfo}>
                <Text style={[styles.businessName, { color: theme.textPrimary }]}>
                  {appointment.businessName}
                </Text>
                <Text style={[styles.businessAddress, { color: theme.textLight }]}>
                  {appointment.businessAddress || "No address provided"}
                </Text>
              </View>
            </View>
            
            {/* Service details */}
            <View style={[styles.detailSection, { backgroundColor: theme.backgroundLight }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Service
              </Text>
              <View style={styles.serviceRow}>
                <Text style={[styles.serviceName, { color: theme.textPrimary }]}>
                  {appointment.serviceName}
                </Text>
                <Text style={[styles.servicePrice, { color: theme.primary }]}>
                  {appointment.price}
                </Text>
              </View>
              {appointment.serviceDescription && (
                <Text style={[styles.serviceDescription, { color: theme.textLight }]}>
                  {appointment.serviceDescription}
                </Text>
              )}
            </View>
            
            {/* Appointment time */}
            <View style={[styles.detailSection, { backgroundColor: theme.backgroundLight }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Date & Time
              </Text>
              <View style={styles.infoRow}>
                <FontAwesome5 name="calendar-alt" size={16} color={theme.textLight} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                  {formatDate(appointment.date)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <FontAwesome5 name="clock" size={16} color={theme.textLight} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                  {appointment.time}
                </Text>
              </View>
            </View>
            
            {/* Booking information */}
            <View style={[styles.detailSection, { backgroundColor: theme.backgroundLight }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Booking Information
              </Text>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textLight }]}>
                  Booking ID:
                </Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                  {appointment.id}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textLight }]}>
                  Booked on:
                </Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                  {formatDate(appointment.bookingDate)}
                </Text>
              </View>
            </View>
          </ScrollView>
          
          {/* Action buttons for upcoming appointments */}
          {canCancel && (
            <View style={[styles.actionContainer, { borderTopColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.rescheduleButton, { backgroundColor: theme.primary }]}
                onPress={onRequestReschedule}
              >
                <FontAwesome5 name="calendar-alt" size={16} color={theme.white} style={styles.buttonIcon} />
                <Text style={[styles.rescheduleButtonText, { color: theme.white }]}>
                  Reschedule
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: theme.danger }]}
                onPress={handleCancelAppointment}
              >
                <FontAwesome5 name="times-circle" size={16} color={theme.white} style={styles.buttonIcon} />
                <Text style={[styles.cancelButtonText, { color: theme.white }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  businessSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
  },
  detailSection: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 10,
    width: 20,
  },
  infoText: {
    fontSize: 15,
  },
  infoLabel: {
    fontSize: 14,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
  },
  rescheduleButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rescheduleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default AppointmentDetailsModal;
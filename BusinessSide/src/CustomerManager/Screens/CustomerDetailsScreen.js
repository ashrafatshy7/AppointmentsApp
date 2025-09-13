// src/CustomerManager/Screens/CustomerDetailsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

import CustomerService from '../Service/CustomerService';
import StatusBadge from '../../Dashboard/AppointmentDetails/StatusBadge';

const CustomerDetailsScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { customerId, customer: initialCustomer } = route.params;
  
  const [customer, setCustomer] = useState(initialCustomer || null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCustomerDetails();
      loadCustomerAppointments();
    }, [customerId])
  );

  const loadCustomerDetails = async () => {
    if (!initialCustomer) {
      try {
        setIsLoading(true);
        const customerData = await CustomerService.getCustomerById(customerId);
        setCustomer(customerData);
      } catch (error) {
        console.error('Error loading customer details:', error);
        Alert.alert('Error', 'Failed to load customer details');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const loadCustomerAppointments = async () => {
    try {
      setIsLoadingAppointments(true);
      const appointmentsData = await CustomerService.getCustomerAppointments(customerId);
      
      if (appointmentsData && Array.isArray(appointmentsData)) {
        // Sort appointments by date (newest first)
        const sortedAppointments = appointmentsData.sort((a, b) => 
          new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
        );
        setAppointments(sortedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading customer appointments:', error);
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const handleEditCustomer = () => {
    Alert.alert(
      'Edit Customer',
      'Customer profile information cannot be edited. You can only update business-specific notes.',
      [{ text: 'OK' }]
    );
  };

  const handleEditNotes = () => {
    Alert.prompt(
      'Edit Business Notes',
      'Add private notes about this customer for your business only:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: async (notes) => {
            try {
              await CustomerService.updateCustomerNotes(customer._id, notes || '');
              
              // Update local customer data
              setCustomer(prev => ({
                ...prev,
                businessSpecificData: {
                  ...prev.businessSpecificData,
                  notes: notes || ''
                }
              }));
              
              Alert.alert('Success', 'Notes updated successfully');
            } catch (error) {
              console.error('Error updating notes:', error);
              Alert.alert('Error', 'Failed to update notes');
            }
          },
        },
      ],
      'plain-text',
      customer.businessSpecificData?.notes || '',
      'default'
    );
  };

  const handleDeleteCustomer = () => {
    Alert.alert(
      'Remove Customer',
      'Customers cannot be deleted directly. To remove a customer from your list, delete or cancel all their appointments. Customers automatically appear when they have appointments.',
      [{ text: 'OK' }]
    );
  };


  const handleCallCustomer = () => {
    if (customer.phone) {
      const phoneNumber = customer.phone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleEmailCustomer = () => {
    if (customer.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };

  const handleBookAppointment = () => {
    navigation.navigate('AddAppointment', {
      preselectedCustomer: customer
    });
  };

  const handleAppointmentPress = (appointment) => {
    navigation.navigate('AppointmentDetails', {
      appointmentId: appointment._id
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderAppointmentItem = (appointment) => (
    <TouchableOpacity
      key={appointment._id}
      style={[styles.appointmentCard, { backgroundColor: theme.surface }]}
      onPress={() => handleAppointmentPress(appointment)}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={[styles.appointmentDate, { color: theme.textPrimary }]}>
            {formatDate(appointment.date)}
          </Text>
          <Text style={[styles.appointmentTime, { color: theme.textSecondary }]}>
            {formatTime(appointment.time)}
          </Text>
        </View>
        <StatusBadge status={appointment.status} />
      </View>
      
      <Text style={[styles.serviceName, { color: theme.textPrimary }]}>
        {appointment.serviceName || 'Unknown Service'}
      </Text>
      
      {appointment.notes && (
        <Text style={[styles.appointmentNotes, { color: theme.textSecondary }]} numberOfLines={2}>
          {appointment.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading customer details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-triangle" size={60} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            Customer not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Customer Details
        </Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleEditCustomer}
        >
          <FontAwesome5 name="edit" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Customer Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryBackground }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {getInitials(customer.name)}
            </Text>
          </View>
          
          <Text style={[styles.customerName, { color: theme.textPrimary }]}>
            {customer.name}
          </Text>
          
          <View style={styles.contactInfo}>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.primaryBackground }]}
              onPress={handleCallCustomer}
            >
              <FontAwesome5 name="phone" size={16} color={theme.primary} />
              <Text style={[styles.contactButtonText, { color: theme.primary }]}>
                Call
              </Text>
            </TouchableOpacity>
            
            {customer.email && (
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: theme.primaryBackground }]}
                onPress={handleEmailCustomer}
              >
                <FontAwesome5 name="envelope" size={16} color={theme.primary} />
                <Text style={[styles.contactButtonText, { color: theme.primary }]}>
                  Email
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: theme.primary }]}
            onPress={handleBookAppointment}
          >
            <FontAwesome5 name="plus" size={16} color={theme.white} />
            <Text style={[styles.bookButtonText, { color: theme.white }]}>
              Book Appointment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Details */}
        <View style={[styles.detailsSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Contact Information
          </Text>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="phone" size={16} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {customer.phone}
            </Text>
          </View>
          
          {customer.email && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="envelope" size={16} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {customer.email}
              </Text>
            </View>
          )}
          
          <View style={styles.notesSectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Business Notes
            </Text>
            <TouchableOpacity
              style={[styles.editNotesButton, { backgroundColor: theme.primaryBackground }]}
              onPress={handleEditNotes}
            >
              <FontAwesome5 name="edit" size={14} color={theme.primary} />
              <Text style={[styles.editNotesText, { color: theme.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
          
          {customer.businessSpecificData?.notes && customer.businessSpecificData.notes.trim().length > 0 ? (
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>
              {customer.businessSpecificData.notes}
            </Text>
          ) : (
            <Text style={[styles.noNotesText, { color: theme.textLight }]}>
              No notes added yet. Tap Edit to add private notes about this customer.
            </Text>
          )}
        </View>

        {/* Appointment History */}
        <View style={[styles.appointmentsSection, { backgroundColor: theme.surface }]}>
          <View style={styles.appointmentsSectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Appointment History ({appointments.length})
            </Text>
          </View>
          
          {isLoadingAppointments ? (
            <View style={styles.appointmentsLoading}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading appointments...
              </Text>
            </View>
          ) : appointments.length > 0 ? (
            appointments.map(renderAppointmentItem)
          ) : (
            <View style={styles.noAppointments}>
              <FontAwesome5 name="calendar-times" size={40} color={theme.textLight} />
              <Text style={[styles.noAppointmentsText, { color: theme.textSecondary }]}>
                No appointments yet
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.primaryBackground }]}>
          <FontAwesome5 name="info-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            Customer information is automatically managed through appointments. To remove a customer, cancel or delete all their appointments.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    padding: '8@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: '16@s',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: '24@s',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  avatar: {
    width: '80@s',
    height: '80@s',
    borderRadius: '40@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  avatarText: {
    fontSize: '32@s',
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: '24@s',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '16@vs',
  },
  contactInfo: {
    flexDirection: 'row',
    gap: '12@s',
    marginBottom: '20@vs',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '8@vs',
    borderRadius: '20@s',
    gap: '6@s',
  },
  contactButtonText: {
    fontSize: '14@s',
    fontWeight: '600',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '24@s',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    gap: '8@s',
  },
  bookButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  detailsSection: {
    padding: '16@s',
    marginBottom: '16@vs',
  },
  sectionTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    marginBottom: '12@vs',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs',
    gap: '12@s',
  },
  detailText: {
    fontSize: '16@s',
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  editNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '6@s',
    gap: '6@s',
  },
  editNotesText: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  notesText: {
    fontSize: '16@s',
    lineHeight: '22@s',
  },
  noNotesText: {
    fontSize: '14@s',
    fontStyle: 'italic',
    lineHeight: '20@s',
  },
  appointmentsSection: {
    padding: '16@s',
    marginBottom: '16@vs',
  },
  appointmentsSectionHeader: {
    marginBottom: '16@vs',
  },
  appointmentsLoading: {
    alignItems: 'center',
    paddingVertical: '20@vs',
    gap: '8@vs',
  },
  appointmentCard: {
    padding: '16@s',
    borderRadius: '8@s',
    marginBottom: '8@vs',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8@vs',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '2@vs',
  },
  appointmentTime: {
    fontSize: '14@s',
  },
  serviceName: {
    fontSize: '16@s',
    fontWeight: '500',
    marginBottom: '4@vs',
  },
  appointmentNotes: {
    fontSize: '14@s',
    fontStyle: 'italic',
  },
  noAppointments: {
    alignItems: 'center',
    paddingVertical: '32@vs',
    gap: '12@vs',
  },
  noAppointmentsText: {
    fontSize: '16@s',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@s',
    marginHorizontal: '16@s',
    marginBottom: '32@vs',
    borderRadius: '8@s',
    gap: '12@s',
  },
  infoText: {
    flex: 1,
    fontSize: '14@s',
    lineHeight: '18@s',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16@vs',
  },
  loadingText: {
    fontSize: '16@s',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16@vs',
  },
  errorText: {
    fontSize: '18@s',
    fontWeight: '600',
  },
});

export default CustomerDetailsScreen;
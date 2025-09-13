// src/Dashboard/AddAppointment/EditAppointmentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import { getAppointmentById, updateAppointment } from '../Service/AppointmentService';

// Import customer search component
//import CustomerLookup from '../ManualBooking/CustomerLookup';

const EditAppointmentScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { businessServices } = useBusiness();
  const { appointmentId } = route.params;
  
  // State
  const [appointment, setAppointment] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load appointment data
  useEffect(() => {
    const loadAppointment = async () => {
      setIsLoading(true);
      try {
        const appointmentData = await getAppointmentById(appointmentId);
        
        if (!appointmentData) {
          Alert.alert('Error', 'Appointment not found');
          navigation.goBack();
          return;
        }
        
        setAppointment(appointmentData);
        
        // Set form values from appointment data
        setSelectedCustomer({
          id: appointmentData.customerId,
          name: appointmentData.customerName,
          image: appointmentData.customerImage,
        });
        
        setSelectedService({
          id: appointmentData.serviceId,
          name: appointmentData.serviceName,
          price: appointmentData.price,
          duration: appointmentData.duration,
        });
        
        const appointmentDateTime = new Date(appointmentData.dateTime);
        setAppointmentDate(appointmentDateTime);
        setAppointmentTime(appointmentDateTime);
        
        setNotes(appointmentData.notes || '');
      } catch (error) {
        console.error('Error loading appointment:', error);
        Alert.alert('Error', 'Failed to load appointment details');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAppointment();
  }, [appointmentId, navigation]);
  
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
    const currentDate = selectedDate || appointmentDate;
    setShowDatePicker(Platform.OS === 'ios');
    setAppointmentDate(currentDate);
  };
  
  // Handle time change
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || appointmentTime;
    setShowTimePicker(Platform.OS === 'ios');
    setAppointmentTime(currentTime);
  };
  
  // Combine date and time into a single Date object
  const getCombinedDateTime = () => {
    const combinedDate = new Date(appointmentDate);
    combinedDate.setHours(
      appointmentTime.getHours(),
      appointmentTime.getMinutes(),
      0,
      0
    );
    return combinedDate;
  };
  
  // Check if form has changes
  const hasChanges = () => {
    if (!appointment) return false;
    
    // Check customer
    if (selectedCustomer.id !== appointment.customerId) return true;
    
    // Check service
    if (selectedService.id !== appointment.serviceId) return true;
    
    // Check date and time
    const originalDateTime = new Date(appointment.dateTime);
    const updatedDateTime = getCombinedDateTime();
    if (originalDateTime.getTime() !== updatedDateTime.getTime()) return true;
    
    // Check notes
    if (notes !== (appointment.notes || '')) return true;
    
    return false;
  };
  
  // Validate form before submission
  const validateForm = () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return false;
    }
    
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSaveAppointment = async () => {
    if (!validateForm()) return;
    
    // Check if anything has changed
    if (!hasChanges()) {
      Alert.alert('No Changes', 'No changes have been made to the appointment');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerImage: selectedCustomer.image,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        dateTime: getCombinedDateTime().toISOString(),
        duration: selectedService.duration,
        price: selectedService.price,
        notes: notes,
      };
      
      const result = await updateAppointment(appointmentId, updatedData);
      
      Alert.alert(
        'Success',
        'Appointment updated successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('AppointmentDetails', { appointmentId }) 
          }
        ]
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render service selection section
  const renderServiceSelection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Select Service</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.servicesContainer}
      >
        {businessServices.map(service => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              { 
                backgroundColor: theme.background,
                borderColor: selectedService?.id === service.id ? theme.primary : theme.border 
              }
            ]}
            onPress={() => setSelectedService(service)}
          >
            <View style={[
              styles.serviceIconContainer,
              { backgroundColor: selectedService?.id === service.id ? theme.primaryBackground : theme.backgroundGray }
            ]}>
              <FontAwesome5
                name="cut"
                size={22}
                color={selectedService?.id === service.id ? theme.primary : theme.textLight}
              />
            </View>
            
            <Text style={[
              styles.serviceName,
              { color: theme.textPrimary }
            ]} numberOfLines={1}>
              {service.name}
            </Text>
            
            <Text style={[styles.servicePrice, { color: theme.textSecondary }]}>
              {service.price}
            </Text>
            
            <Text style={[styles.serviceDuration, { color: theme.textLight }]}>
              {service.duration} min
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading appointment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Edit Appointment
          </Text>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Customer selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Customer</Text>
            {/* <CustomerLookup
              onSelectCustomer={setSelectedCustomer}
              selectedCustomer={selectedCustomer}
            /> */}
          </View>
          
          {/* Service selection */}
          {renderServiceSelection()}
          
          {/* Date and Time selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Date & Time</Text>
            
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[
                  styles.dateTimeCard,
                  { 
                    backgroundColor: theme.background,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateTimeHeader}>
                  <FontAwesome5 name="calendar-alt" size={16} color={theme.primary} />
                  <Text style={[styles.dateTimeLabel, { color: theme.textSecondary }]}>Date</Text>
                </View>
                <Text style={[styles.dateTimeValue, { color: theme.textPrimary }]}>
                  {formatDate(appointmentDate)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dateTimeCard,
                  { 
                    backgroundColor: theme.background,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.dateTimeHeader}>
                  <FontAwesome5 name="clock" size={16} color={theme.primary} />
                  <Text style={[styles.dateTimeLabel, { color: theme.textSecondary }]}>Time</Text>
                </View>
                <Text style={[styles.dateTimeValue, { color: theme.textPrimary }]}>
                  {formatTime(appointmentTime)}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Date Picker Dialog */}
            {showDatePicker && (
              <DateTimePicker
                value={appointmentDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            
            {/* Time Picker Dialog */}
            {showTimePicker && (
              <DateTimePicker
                value={appointmentTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>
          
          {/* Notes section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notes (Optional)</Text>
            <TextInput
              style={[
                styles.notesInput,
                { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.textPrimary
                }
              ]}
              placeholder="Add any special requests or notes..."
              placeholderTextColor={theme.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Status section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Current Status</Text>
            
            <View style={[styles.statusContainer, { backgroundColor: theme.backgroundLight }]}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
                This appointment is currently
              </Text>
              <View style={[styles.statusBadge, { 
                backgroundColor: 
                  appointment.status === 'confirmed' ? theme.primaryBackground : 
                  appointment.status === 'completed' ? '#E6F9F0' :
                  appointment.status === 'canceled' ? '#FEEEEE' : '#FEF3D7'
              }]}>
                <Text style={[styles.statusText, { 
                  color: 
                    appointment.status === 'confirmed' ? theme.primary : 
                    appointment.status === 'completed' ? theme.success :
                    appointment.status === 'canceled' ? theme.danger : theme.warning
                }]}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Text>
              </View>
              <Text style={[styles.statusNote, { color: theme.textLight }]}>
                Note: To change the appointment status, please use the options on the appointment details screen.
              </Text>
            </View>
          </View>
          
          {/* Summary section */}
          <View style={[styles.summarySection, { backgroundColor: theme.backgroundLight }]}>
            <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>Appointment Summary</Text>
            
            {selectedCustomer && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Customer:</Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {selectedCustomer.name}
                </Text>
              </View>
            )}
            
            {selectedService && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Service:</Text>
                  <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                    {selectedService.name}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Price:</Text>
                  <Text style={[styles.summaryValue, { color: theme.primary, fontWeight: 'bold' }]}>
                    {selectedService.price}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Duration:</Text>
                  <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                    {selectedService.duration} minutes
                  </Text>
                </View>
              </>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Date & Time:</Text>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                {formatDate(appointmentDate)} at {formatTime(appointmentTime)}
              </Text>
            </View>
          </View>
          
          {/* Bottom padding for scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        {/* Action buttons */}
        <View style={[styles.actionContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { 
                backgroundColor: theme.primary,
                opacity: isSubmitting ? 0.7 : 1
              }
            ]}
            onPress={handleSaveAppointment}
            disabled={isSubmitting || !hasChanges()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.white }]}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    fontFamily: 'Poppins-SemiBold',
  },
  section: {
    padding: '16@s',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: '18@s',
    fontFamily: 'Inter-SemiBold',
    marginBottom: '12@s',
  },
  servicesContainer: {
    paddingVertical: '8@vs',
  },
  serviceCard: {
    width: '120@s',
    borderRadius: '12@s',
    padding: '12@s',
    marginRight: '12@s',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.05,
    shadowRadius: '4@s',
    elevation: 1,
  },
  serviceIconContainer: {
    width: '50@s',
    height: '50@s',
    borderRadius: '25@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  serviceName: {
    fontSize: '14@s',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '4@vs',
  },
  servicePrice: {
    fontSize: '14@s',
    fontWeight: '600',
    marginBottom: '2@vs',
  },
  serviceDuration: {
    fontSize: '12@s',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeCard: {
    width: '48%',
    borderRadius: '12@s',
    padding: '12@s',
    borderWidth: 1,
  },
  dateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  dateTimeLabel: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
    marginLeft: '8@s',
  },
  dateTimeValue: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: '12@s',
    padding: '12@s',
    height: '100@vs',
    fontSize: '16@s',
  },
  statusContainer: {
    padding: '16@s',
    borderRadius: '12@s',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
    marginBottom: '8@s',
  },
  statusBadge: {
    paddingHorizontal: '16@s',
    paddingVertical: '6@s',
    borderRadius: '12@s',
    marginBottom: '8@s',
  },
  statusText: {
    fontSize: '14@s',
    fontFamily: 'Inter-SemiBold',
  },
  statusNote: {
    fontSize: '12@s',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: '8@s',
  },
  summarySection: {
    margin: '16@s',
    borderRadius: '12@s',
    padding: '16@s',
  },
  summaryTitle: {
    fontSize: '18@s',
    fontFamily: 'Inter-SemiBold',
    marginBottom: '16@s',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '12@s',
  },
  summaryLabel: {
    fontSize: '16@s',
    fontFamily: 'Inter-Regular',
  },
  summaryValue: {
    fontSize: '16@s',
    fontFamily: 'Inter-Regular',
  },
  bottomPadding: {
    height: '40@s',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: '16@s',
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: '50@s',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8@s',
    borderWidth: 1,
    marginRight: '12@s',
  },
  cancelButtonText: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    flex: 2,
    height: '50@s',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8@s',
  },
  saveButtonText: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
  }
});

export default EditAppointmentScreen;

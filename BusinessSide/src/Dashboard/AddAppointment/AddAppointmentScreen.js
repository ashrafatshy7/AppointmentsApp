// src/Dashboard/AddAppointment/AddAppointmentScreen.js
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
import { useFocusEffect } from '@react-navigation/native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import { createAppointment } from '../Service/AppointmentService';
import CustomerSelectorModal from './CustomerSelectorModal';
import ServiceSelector from './ServiceSelector';
import DateTimeSelector from './DateTimeSelector';

const AddAppointmentScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { activeBusiness } = useBusiness();
  const initialDate = route.params?.date ? new Date(route.params.date) : new Date();
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(initialDate);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  



  // Validation
  const isFormValid = selectedCustomer && selectedService && selectedDateTime;
  
  // Handle form submission
 const handleSaveAppointment = async () => {
  if (!isFormValid) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    // Handle different customer types
    let clientId;
    
    if (selectedCustomer.type === 'api_user') {
      // For existing users from your API, use their ObjectId
      clientId = selectedCustomer._id || selectedCustomer.id;
    } else {
      // For manual entries, you might need to create a client first
      // or handle it differently based on your backend logic
      if (selectedCustomer.type === 'manual') {
        // If it's a manual entry, use phone number
        // But your backend needs to handle this case
        clientId = selectedCustomer.phone;
      } else {
        clientId = selectedCustomer._id || selectedCustomer.id || selectedCustomer.phone;
      }
    }

    const appointmentData = {
      businessId: activeBusiness?._id || activeBusiness?.id,
      client: clientId,
      service: selectedService._id || selectedService.id,
      date: selectedDateTime.toISOString().split('T')[0],
      time: selectedDateTime.toTimeString().slice(0, 5),
      durationMinutes: selectedService.durationMinutes || selectedService.duration || 60,
      notes: notes.trim()
    };
    

    
    const result = await createAppointment(appointmentData);
    
    
    Alert.alert(
      'Success',
      'Appointment created successfully',
      [
        { 
          text: 'OK', 
          onPress: () => {
            // Navigate back and pass a flag to refresh dashboard
            navigation.goBack();
          }
        }
      ]
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    Alert.alert('Error', `Failed to create appointment: ${error.message}`);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };

  const renderSelectedCustomer = () => {
    if (!selectedCustomer) {
      return (
        <TouchableOpacity
          style={[styles.selectorButton, { backgroundColor: theme.backgroundLight, borderColor: theme.border }]}
          onPress={() => setShowCustomerModal(true)}
        >
          <FontAwesome5 name="user-plus" size={16} color={theme.textLight} style={styles.selectorIcon} />
          <Text style={[styles.selectorText, { color: theme.textLight }]}>
            Select Customer
          </Text>
          <FontAwesome5 name="chevron-right" size={14} color={theme.textLight} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.selectedCustomerCard, { backgroundColor: theme.backgroundLight }]}
        onPress={() => setShowCustomerModal(true)}
      >
        <View style={styles.selectedCustomerInfo}>
          <View style={[
            styles.selectedCustomerAvatar,
            { backgroundColor: getAvatarColor(selectedCustomer.type, theme) }
          ]}>
            <FontAwesome5 
              name={getAvatarIcon(selectedCustomer.type)} 
              size={16} 
              color={getAvatarIconColor(selectedCustomer.type, theme)} 
            />
          </View>
          
          <View style={styles.selectedCustomerDetails}>
            <Text style={[styles.selectedCustomerName, { color: theme.textPrimary }]}>
              {selectedCustomer.name || selectedCustomer.originalPhone || selectedCustomer.phone}
            </Text>
            {selectedCustomer.phone && selectedCustomer.name && (
              <Text style={[styles.selectedCustomerPhone, { color: theme.textSecondary }]}>
                {selectedCustomer.originalPhone || selectedCustomer.phone}
              </Text>
            )}
          </View>
          
          {selectedCustomer.type === 'api_user' && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
              <FontAwesome5 name="check" size={10} color={theme.white} />
            </View>
          )}
        </View>
        
        <View style={styles.selectedCustomerActions}>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setShowCustomerModal(true)}
          >
            <Text style={[styles.changeButtonText, { color: theme.primary }]}>Change</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setSelectedCustomer(null)}
          >
            <FontAwesome5 name="times" size={14} color={theme.textLight} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getAvatarColor = (type, theme) => {
    switch (type) {
      case 'api_user': return theme.success + '20';
      case 'contact': return theme.info + '20';
      case 'recent':
      case 'manual': return theme.primary + '20';
      default: return theme.backgroundGray;
    }
  };

  const getAvatarIcon = (type) => {
    switch (type) {
      case 'api_user': return 'user-check';
      case 'contact': return 'address-book';
      case 'recent':
      case 'manual': return 'user';
      default: return 'user';
    }
  };

  const getAvatarIconColor = (type, theme) => {
    switch (type) {
      case 'api_user': return theme.success;
      case 'contact': return theme.info;
      case 'recent':
      case 'manual': return theme.primary;
      default: return theme.textLight;
    }
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Add Appointment
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Customer *
            </Text>
            {renderSelectedCustomer()}
          </View>
          
          {/* Service Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Service *
            </Text>
            <ServiceSelector
              selectedService={selectedService}
              onServiceSelect={setSelectedService}
              theme={theme}
            />
          </View>
          
          {/* Date & Time Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Date & Time *
            </Text>
            <DateTimeSelector
              selectedDateTime={selectedDateTime}
              onDateTimeSelect={setSelectedDateTime}
              theme={theme}
            />
          </View>
          
          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Notes (Optional)
            </Text>
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
          
          {/* Summary */}
          {isFormValid && (
            <View style={[styles.summarySection, { backgroundColor: theme.backgroundLight }]}>
              <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>
                Appointment Summary
              </Text>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Customer:</Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {selectedCustomer.name || selectedCustomer.phone}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Service:</Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {selectedService.name}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Date & Time:</Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {selectedDateTime.toLocaleDateString()} at {selectedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
              </View>
              
              {selectedService.price && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Price:</Text>
                  <Text style={[styles.summaryValue, { color: theme.primary, fontWeight: 'bold' }]}>
                    ${selectedService.price}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        {/* Action Buttons */}
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
                backgroundColor: isFormValid ? theme.primary : theme.textLight,
                opacity: isSubmitting ? 0.7 : 1
              }
            ]}
            onPress={handleSaveAppointment}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.white }]}>
                Create Appointment
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Customer Selector Modal */}
        <CustomerSelectorModal
          visible={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onCustomerSelect={handleCustomerSelect}
          theme={theme}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: '3@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
  },
  placeholder: {
    width: '28@s',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: '18@s',
    paddingVertical: '8@vs',
    marginBottom: '6@vs',
  },
  sectionTitle: {
    fontSize: '16@s',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '10@s',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '12@s',
    borderRadius: '16@s',
    borderWidth: 2,
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  selectorIcon: {
    marginRight: '10@s',
  },
  selectorText: {
    flex: 1,
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
  },
  selectedCustomerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12@s',
    borderRadius: '16@s',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  selectedCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedCustomerAvatar: {
    width: '36@s',
    height: '36@s',
    borderRadius: '18@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10@s',
  },
  selectedCustomerDetails: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
  },
  selectedCustomerPhone: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Regular',
    marginTop: '1@s',
  },
  verifiedBadge: {
    width: '16@s',
    height: '16@s',
    borderRadius: '8@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '6@s',
  },
  selectedCustomerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeButton: {
    paddingHorizontal: '10@s',
    paddingVertical: '4@vs',
    marginRight: '6@s',
  },
  changeButtonText: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Medium',
  },
  removeButton: {
    padding: '4@s',
  },
  notesInput: {
    borderWidth: 2,
    borderRadius: '16@s',
    padding: '12@s',
    height: '80@vs',
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    shadowOffset: { width: 0, height: '1@s' },
    shadowOpacity: 0.05,
    shadowRadius: '2@s',
    elevation: 1,
  },
  summarySection: {
    marginHorizontal: '18@s',
    marginVertical: '10@vs',
    borderRadius: '20@s',
    padding: '16@s',
    shadowOffset: { width: 0, height: '3@s' },
    shadowOpacity: 0.1,
    shadowRadius: '6@s',
    elevation: 3,
  },
  summaryTitle: {
    fontSize: '16@s',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '12@vs',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
    paddingVertical: '1@vs',
  },
  summaryLabel: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  summaryValue: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
    flex: 2,
    textAlign: 'right',
  },
  bottomPadding: {
    height: '20@vs',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: '18@s',
    paddingTop: '16@vs',
    paddingBottom: '24@vs',
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: '44@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '22@s',
    borderWidth: 2,
    marginRight: '12@s',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
  },
  saveButton: {
    flex: 2,
    height: '44@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '22@s',
    shadowOffset: { width: 0, height: '4@s' },
    shadowOpacity: 0.15,
    shadowRadius: '8@s',
    elevation: 4,
  },
  saveButtonText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
  }
});

export default AddAppointmentScreen;
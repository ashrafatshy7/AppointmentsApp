// src/CustomerManager/Screens/AddCustomerScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

import CustomerService from '../Service/CustomerService';

const AddCustomerScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { customer, isEditing = false } = route.params || {};
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing && customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        notes: customer.notes || '',
      });
    }
  }, [customer, isEditing]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateAndSave = async () => {
    // Validate form data
    const validation = CustomerService.validateCustomerData(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing) {
        await CustomerService.updateCustomer(customer._id, formData);
        Alert.alert('Success', 'Customer updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await CustomerService.createCustomer(formData);
        Alert.alert('Success', 'Customer added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert(
        'Error', 
        `Failed to ${isEditing ? 'update' : 'add'} customer. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneInput = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits for US numbers
    const limited = cleaned.substring(0, 10);
    
    // Format as user types
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneInput(text);
    handleInputChange('phone', formatted);
  };

  const renderInputField = (
    label,
    field,
    placeholder,
    options = {}
  ) => {
    const {
      multiline = false,
      keyboardType = 'default',
      autoCapitalize = 'words',
      maxLength,
      numberOfLines = 1
    } = options;

    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
          {label}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            { 
              backgroundColor: theme.backgroundGray,
              color: theme.textPrimary,
              borderColor: errors[field] ? theme.danger : 'transparent'
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.textLight}
          value={formData[field]}
          onChangeText={(text) => 
            field === 'phone' ? handlePhoneChange(text) : handleInputChange(field, text)
          }
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoCorrect={!['email', 'phone'].includes(field)}
        />
        {errors[field] && (
          <Text style={[styles.errorText, { color: theme.danger }]}>
            {errors[field]}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="times" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isEditing ? 'Edit Customer' : 'Add Customer'}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.headerButton,
              styles.saveButton,
              { backgroundColor: theme.primary }
            ]}
            onPress={validateAndSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <FontAwesome5 name="check" size={16} color={theme.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primaryBackground }]}>
              <FontAwesome5 name="user" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>
              {isEditing ? `Editing ${customer?.name || 'customer'}` : 'New customer profile'}
            </Text>
          </View>

          {/* Form Fields */}
          {renderInputField(
            'Full Name *',
            'name',
            'Enter customer\'s full name',
            { autoCapitalize: 'words' }
          )}

          {renderInputField(
            'Phone Number *',
            'phone',
            '(123) 456-7890',
            { 
              keyboardType: 'phone-pad',
              autoCapitalize: 'none',
              maxLength: 14 // Formatted length: (123) 456-7890
            }
          )}

          {renderInputField(
            'Email Address',
            'email',
            'customer@example.com',
            { 
              keyboardType: 'email-address',
              autoCapitalize: 'none'
            }
          )}

          {renderInputField(
            'Notes',
            'notes',
            'Add any notes about this customer...',
            { 
              multiline: true,
              numberOfLines: 4,
              autoCapitalize: 'sentences',
              maxLength: 500
            }
          )}

          {/* Character counter for notes */}
          <Text style={[styles.characterCounter, { color: theme.textLight }]}>
            {formData.notes.length}/500 characters
          </Text>

          {/* Save Button (Mobile friendly) */}
          <TouchableOpacity
            style={[
              styles.saveButtonMobile,
              { backgroundColor: theme.primary }
            ]}
            onPress={validateAndSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <>
                <FontAwesome5 name="check" size={16} color={theme.white} />
                <Text style={[styles.saveButtonText, { color: theme.white }]}>
                  {isEditing ? 'Update Customer' : 'Add Customer'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  saveButton: {
    width: '36@s',
    height: '36@s',
    borderRadius: '18@s',
    justifyContent: 'center',
    alignItems: 'center',
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
  formContainer: {
    padding: '16@s',
    paddingBottom: '32@vs',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: '32@vs',
  },
  avatarPlaceholder: {
    width: '80@s',
    height: '80@s',
    borderRadius: '40@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  avatarHint: {
    fontSize: '14@s',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '20@vs',
  },
  inputLabel: {
    fontSize: '16@s',
    fontWeight: '600',
    marginBottom: '8@vs',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    fontSize: '16@s',
  },
  textInputMultiline: {
    minHeight: '80@vs',
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: '12@s',
    marginTop: '4@vs',
  },
  characterCounter: {
    fontSize: '12@s',
    textAlign: 'right',
    marginTop: '-16@vs',
    marginBottom: '24@vs',
  },
  saveButtonMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '16@vs',
    borderRadius: '8@s',
    marginTop: '16@vs',
    gap: '8@s',
  },
  saveButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
});

export default AddCustomerScreen;
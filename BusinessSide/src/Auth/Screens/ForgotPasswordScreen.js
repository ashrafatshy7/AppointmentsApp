// src/Auth/Screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { ScaledSheet } from 'react-native-size-matters';
import Colors from '../../Constants/Colors';
import AuthButton from '../Components/AuthButton';
import PhoneInput from '../Components/PhoneInput';
import { isValidEmail, isValidPhoneNumber } from '../Utils/validators';

const ForgotPasswordScreen = ({ navigation }) => {
  // Form state
  const [contactMethod, setContactMethod] = useState('email'); // 'email' or 'phone'
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Form validation state
  const [errors, setErrors] = useState({});
  
  // Toggle between email and phone methods
  const toggleContactMethod = () => {
    setContactMethod(prevMethod => prevMethod === 'email' ? 'phone' : 'email');
    setErrors({});
  };
  
  // Basic validation
  const validateForm = () => {
    let formErrors = {};
    
    if (contactMethod === 'email') {
      if (!email.trim()) {
        formErrors.email = 'Email is required';
      } else if (!isValidEmail(email)) {
        formErrors.email = 'Please enter a valid email';
      }
    } else {
      if (!phoneNumber.trim()) {
        formErrors.phone = 'Phone number is required';
      } else if (!isValidPhoneNumber(phoneNumber)) {
        formErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };
  
  // Handle password reset request
  const handleResetRequest = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would call your API to send a reset email or SMS
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (contactMethod === 'email') {
        // For email, show success message
        setEmailSent(true);
      } else {
        // For phone, navigate to OTP verification
        navigation.navigate('OTPVerification', {
          phoneNumber,
          verificationId: 'reset-' + Date.now(),
          isPasswordReset: true
        });
      }
    } catch (error) {
      Alert.alert(
        'Request Failed',
        'Unable to send reset instructions. Please try again later.'
      );
      console.error('Password reset error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <FontAwesome5 name="arrow-left" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
          </View>
          
          <View style={styles.form}>
            {emailSent ? (
              <View style={styles.successContainer}>
                <FontAwesome5 name="check-circle" size={60} color={Colors.primary} style={styles.successIcon} />
                <Text style={styles.successTitle}>Email Sent</Text>
                <Text style={styles.successMessage}>
                  We've sent password reset instructions to your email. Please check your inbox and follow the instructions.
                </Text>
                <AuthButton
                  title="Back to Login"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.backToLoginButton}
                  variant="outline"
                />
              </View>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  Enter your {contactMethod === 'email' ? 'email address' : 'phone number'} and we'll send you instructions to reset your password.
                </Text>
                
                {/* Toggle between email and phone */}
                <TouchableOpacity 
                  style={styles.toggleContainer}
                  onPress={toggleContactMethod}
                >
                  <Text style={styles.toggleText}>
                    Use {contactMethod === 'email' ? 'phone number' : 'email'} instead
                  </Text>
                </TouchableOpacity>
                
                {contactMethod === 'email' ? (
                  /* Email Input */
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) {
                          setErrors({...errors, email: null});
                        }
                      }}
                      placeholder="Enter your email"
                      returnKeyType="done"
                      onSubmitEditing={handleResetRequest}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>
                ) : (
                  /* Phone Input */
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Phone Number</Text>
                    <PhoneInput
                      value={phoneNumber}
                      onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (errors.phone) {
                          setErrors({...errors, phone: null});
                        }
                      }}
                      error={errors.phone}
                    />
                  </View>
                )}
                
                <AuthButton
                  title="Send Reset Instructions"
                  onPress={handleResetRequest}
                  loading={isSubmitting}
                  style={styles.resetButton}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: '16@s',
    padding: '4@s',
  },
  headerTitle: {
    fontSize: '20@s',
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
    flex: 1,
  },
  form: {
    padding: '20@s',
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: '16@s',
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginBottom: '24@s',
    lineHeight: '22@s',
  },
  toggleContainer: {
    alignSelf: 'flex-end',
    marginBottom: '16@vs',
  },
  toggleText: {
    color: Colors.primary,
    fontSize: '14@s',
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    marginBottom: '24@vs',
  },
  label: {
    fontSize: '16@s',
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: '8@s',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: '8@s',
    padding: '12@s',
    fontSize: '16@s',
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: '14@s',
    marginTop: '4@vs',
  },
  resetButton: {
    marginTop: '8@vs',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16@s',
  },
  successIcon: {
    marginBottom: '16@vs',
  },
  successTitle: {
    fontSize: '24@s',
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
    marginBottom: '16@s',
  },
  successMessage: {
    fontSize: '16@s',
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: '24@s',
    marginBottom: '32@s',
  },
  backToLoginButton: {
    marginTop: '16@vs',
  },
});

export default ForgotPasswordScreen;

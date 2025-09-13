// src/Auth/Screens/RegisterScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../Context/AuthContext';
import PhoneInput from '../Components/PhoneInput';
import AuthButton from '../Components/AuthButton';
import AuthHeader from '../Components/AuthHeader';
import { validatePhone, validateName, validateEmail } from '../Utils/validators';
import Colors from '../../Constants/Colors';
import { useTheme } from '../../Context/ThemeContext';
import { ThemedStatusBar } from '../../Components/Themed/ThemedStatusBar';

const RegisterScreen = () => {
  // Get theme context
  const { theme, isDarkMode } = useTheme();
  
  // Get auth context and navigation
  const { setPhone, sendOtp, error, clearError } = useAuth();
  const navigation = useNavigation();
  
  // Input state and refs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Error states
  const [firstNameError, setFirstNameError] = useState(null);
  const [lastNameError, setLastNameError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Input refs for focusing
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneInputRef = useRef(null);
  
  // Clear any auth errors when component mounts or unmounts
  useEffect(() => {
    clearError();
    return () => clearError();
  }, []);
  
  // Reset form errors when inputs change
  useEffect(() => {
    if (firstName && firstNameError) setFirstNameError(null);
    if (lastName && lastNameError) setLastNameError(null);
    if (email && emailError) setEmailError(null);
    if (phoneNumber && phoneError) setPhoneError(null);
  }, [firstName, lastName, email, phoneNumber, firstNameError, lastNameError, emailError, phoneError]);
  
  // Validate form
  const validateForm = useCallback(() => {
    let isValid = true;
    
    // Validate first name
    const firstNameValidation = validateName(firstName);
    if (!firstNameValidation.isValid) {
      setFirstNameError(firstNameValidation.error);
      isValid = false;
    }
    
    // Validate last name
    const lastNameValidation = validateName(lastName);
    if (!lastNameValidation.isValid) {
      setLastNameError(lastNameValidation.error);
      isValid = false;
    }
    
    // Validate email if provided
    if (email.trim() !== '') {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        setEmailError(emailValidation.error);
        isValid = false;
      }
    }
    
    // Validate phone
    const phoneValidation = validatePhone(phoneNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error);
      isValid = false;
    }
    
    return isValid;
  }, [firstName, lastName, email, phoneNumber]);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    
    // Validate form
    if (!validateForm()) {
      Alert.alert("error");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the full phone number with +972 prefix from PhoneInput
      const formattedPhone = phoneInputRef.current?.value || phoneNumber;
      
      // Prepare user data
      const userData = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email: email.trim() || undefined, // Only include if provided
        phone: formattedPhone,
      };
      
      // Save phone to context for OTP verification
      setPhone(formattedPhone);
      
      // Send OTP first
      const otpResult = await sendOtp(formattedPhone);
      
      if (otpResult.success) {
        // Navigate to OTP verification screen with user data
        navigation.navigate('OTPVerification', { 
          isLogin: false,
          userData
        });
      } else {
        // OTP sending failed - show error
        Alert.alert('OTP Error', otpResult.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Registration Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [firstName, lastName, email, phoneNumber, validateForm, setPhone, sendOtp, navigation]);
  
  // Navigate to login screen
  const navigateToLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);
  
  // Input styles for consistent look
  const inputStyle = {
    height: 50,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: theme.textPrimary,
    backgroundColor: theme.background,
  };
  
  // Error text style for consistent look
  const errorTextStyle = {
    color: theme.danger,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedStatusBar />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthHeader 
              title="Create Account"
              subtitle="Please fill in your details"
              showBackButton
              onBackPress={navigateToLogin}
            />
            
            <View style={styles.formContainer}>
              {/* First Name Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>First Name</Text>
                <TextInput
                  ref={firstNameRef}
                  style={[
                    inputStyle, 
                    firstNameError && [styles.inputError, { borderColor: theme.danger }]
                  ]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor={theme.textLight}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  blurOnSubmit={false}
                  maxLength={30}
                />
                {firstNameError && (
                  <Text style={errorTextStyle}>{firstNameError}</Text>
                )}
              </View>
              
              {/* Last Name Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Last Name</Text>
                <TextInput
                  ref={lastNameRef}
                  style={[
                    inputStyle, 
                    lastNameError && [styles.inputError, { borderColor: theme.danger }]
                  ]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  placeholderTextColor={theme.textLight}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                  maxLength={30}
                />
                {lastNameError && (
                  <Text style={errorTextStyle}>{lastNameError}</Text>
                )}
              </View>
              
              {/* Email Input (Optional) */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Email (Optional)</Text>
                <TextInput
                  ref={emailRef}
                  style={[
                    inputStyle, 
                    emailError && [styles.inputError, { borderColor: theme.danger }]
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {emailError && (
                  <Text style={errorTextStyle}>{emailError}</Text>
                )}
              </View>
              
              {/* Phone Input */}
              <PhoneInput
                ref={phoneInputRef}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                error={phoneError}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
                label="Phone Number"
                placeholder="Enter your phone number"
              />
              
              {/* Error from auth context */}
              {error && (
                <Text style={[styles.contextError, { color: theme.danger }]}>{error}</Text>
              )}
              
              {/* Register Button */}
              <AuthButton
                title="Continue"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!firstName || !lastName || !phoneNumber || isSubmitting}
                style={styles.submitButton}
              />
              
              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { color: theme.textLight }]}>
                  Already have an account?
                </Text>
                <TouchableWithoutFeedback onPress={navigateToLogin}>
                  <Text style={[styles.loginLink, { color: theme.primary }]}>Login</Text>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
  },
  inputError: {
    // borderColor is now set dynamically
  },
  submitButton: {
    marginTop: 24,
  },
  contextError: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Poppins-Regular',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 4,
  },
});

export default RegisterScreen;
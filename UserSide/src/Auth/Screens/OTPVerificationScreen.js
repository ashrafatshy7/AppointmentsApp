// src/Auth/Screens/OTPVerificationScreen.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ScaledSheet } from 'react-native-size-matters';
import { useAuth } from '../Context/AuthContext';
import OTPInput from '../Components/OTPInput';
import AuthButton from '../Components/AuthButton';
import Colors from '../../Constants/Colors';

const OTPVerificationScreen = () => {
  // Use useRef to track if this is the first mount
  const isFirstMount = useRef(true);
  const hasNavigated = useRef(false);
  
  // Track first mount
  if (isFirstMount.current) {
    isFirstMount.current = false;
  }

  // Get auth context, navigation and route
  const { 
    tempPhone, 
    isOtpVerified, 
    verifyOtp, 
    error, 
    clearError,
    clearOtp,
    userToken
  } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get data from navigation params
  const { isLogin, userData } = route.params || {};
  
  // Get params
  
  // Input state
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResendActive, setIsResendActive] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Format phone number for display - UserSide style (show real number without dots)
  const maskedPhone = useMemo(() => {
    if (!tempPhone) return '';
    
    // UserSide: Show the real phone number without masking
    return tempPhone;
  }, [tempPhone]);
  
  // Setup resend cooldown timer
  useEffect(() => {
    let timer;
    if (isResendActive && resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    } else if (resendCooldown === 0) {
      setIsResendActive(false);
    }
    
    return () => clearTimeout(timer);
  }, [resendCooldown, isResendActive]);
  
  // Clear any auth errors when component mounts or unmounts
  useEffect(() => {
    clearError();
    return () => {
      clearError();
      clearOtp();
    };
  }, [clearError, clearOtp]);
  
  // Reset OTP error when input changes - only when there's actually an error
  useEffect(() => {
    if (otpCode && otpError) {
      setOtpError(null);
    }
  }, [otpError]); // Remove otpCode dependency to prevent re-renders on every keystroke
  
  // Single navigation effect to handle both OTP verification and registration success
  useEffect(() => {
    // Prevent multiple executions
    if (hasNavigated.current) return;
    
    // If we have a userToken, it means registration was successful
    if (userToken) {
      hasNavigated.current = true;
      
      // Navigate to homepage
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'App' }],
        })
      );
      return;
    }
    
    // Handle OTP verification completion
    if (isOtpVerified) {
      hasNavigated.current = true;
      
      // Navigate to homepage
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'App' }],
        })
      );
    }
  }, [userToken, isOtpVerified, navigation]);
  
  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Component unmounting
    };
  }, []);
  
  // Validate form
  const validateForm = useCallback(() => {
    // Check OTP length
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code');
      return false;
    }
    
    // Check if OTP contains only numbers
    if (!/^\d+$/.test(otpCode)) {
      setOtpError('The verification code must contain only numbers');
      return false;
    }
    
    return true;
  }, [otpCode]);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Verify OTP code with phone number and user data (for registration)
      const result = await verifyOtp(tempPhone, otpCode, userData);
      
      if (!result.success) {
        setOtpError(result.error || 'Invalid verification code');
      } else if (result.action === 'registered') {
        // Registration successful - navigate to home page
        // The auth state will automatically update and trigger navigation
      } else if (result.action === 'logged_in') {
        // Login successful - navigate to home page
        // The auth state will automatically update and trigger navigation
      } else if (result.action === 'otp_verified') {
        // OTP verified but no user data - this shouldn't happen in normal flow
        setOtpError('Registration data missing. Please try again.');
      }
    } catch (err) {
      setOtpError('Failed to verify code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [otpCode, validateForm, verifyOtp, tempPhone, userData]);
  
  // Handle resend OTP
  const handleResendOTP = useCallback(() => {
    // Reset OTP input
    setOtpCode('');
    setOtpError(null);
    
    // Reset cooldown
    setResendCooldown(60);
    setIsResendActive(true);
    
    // In a real app, you would call the API to resend OTP
    Alert.alert(
      'OTP Resent',
      'A new verification code has been sent to your phone number.',
      [{ text: 'OK' }]
    );
  }, []);
  
  // Navigate back
  const handleGoBack = useCallback(() => {
    clearOtp();
    navigation.goBack();
  }, [navigation, clearOtp]);
  
  // If user is being authenticated and navigated, show a loading screen
  if (isAuthenticating) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {isLogin ? 'Logging in...' : 'Creating your account...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <View style={styles.screen}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/images/loginBackground.png')}
          style={styles.heroImg}
        />
        {/* Color Overlay */}
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.heroContent}>
          {/* Back Button in Hero Section */}
          <TouchableOpacity 
            style={styles.heroBackButton}
            onPress={handleGoBack}
          >
            <FontAwesome5 name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Verification</Text>
            <Text style={styles.welcomeSubtext}>Enter the code sent to your phone</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Form Container */}
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View 
            style={styles.formView}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.otpCard}>
              <View style={styles.cardContent}>
                {/* Instructions */}
                <View style={styles.instructionContainer}>
                  <Text style={styles.instructionText}>
                    We've sent a 6-digit verification code to
                  </Text>
                  <Text style={styles.phoneText}>
                    {maskedPhone}
                  </Text>
                </View>
                
                {/* OTP Input */}
                <OTPInput
                  length={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  error={otpError || error}
                  disabled={isSubmitting}
                  resendOtp={handleResendOTP}
                />
                
                {/* Verify Button */}
                <AuthButton
                  title="Verify & Continue"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={otpCode.length !== 6 || isSubmitting}
                  style={styles.submitButton}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const R = 48; // Border radius
const IMAGE_HEIGHT = 350; // Image container height

const styles = ScaledSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT + R,
    overflow: 'hidden',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(46, 74, 61, 0.75)',
  },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: R,
    justifyContent: 'center',
    paddingHorizontal: "20@s",
    paddingBottom: "60@vs", // Move verification container up to match login position
  },
  heroBackButton: {
    position: 'absolute',
    top: "50@vs", // Position in hero section
    left: "20@s",
    width: "40@s",
    height: "40@s",
    borderRadius: "20@s",
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '16@s',
    paddingVertical: '16@vs',
    paddingHorizontal: '24@s',
    marginHorizontal: '20@s',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: "35@s",
  },
  welcomeText: {
    fontSize: "28@s",
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: '4@vs',
  },
  welcomeSubtext: {
    fontSize: "14@s",
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    position: 'absolute',
    top: IMAGE_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: R,
    borderTopRightRadius: R,
    borderCurve: 'continuous',
  },
  formView: {
    flex: 1,
  },
  otpCard: {
    flex: 1,
  },
  cardContent: {
    marginTop: "30@s",
    alignItems: 'center',
    paddingHorizontal: "24@s",
  },
  backButton: {
    position: 'absolute',
    top: "20@s",
    left: "24@s",
    width: "40@s",
    height: "40@s",
    borderRadius: "20@s",
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: "30@vs",
    marginTop: "20@vs",
  },
  instructionText: {
    fontSize: "14@s",
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: "16@vs",
    color: Colors.textExtraLight,
    opacity: 0.7,
  },
  phoneText: {
    fontSize: "18@s",
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
  },
  submitButton: {
    marginTop: "24@vs",
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: "12@s",
    paddingVertical: "18@vs",
    paddingHorizontal: "32@s",
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: "16@s",
    padding: "32@s",
    backgroundColor: Colors.backgroundLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '80%',
  },
  loadingText: {
    marginTop: "16@vs",
    fontSize: "16@s",
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
  }
});

export default OTPVerificationScreen;
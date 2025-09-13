// src/Auth/Screens/OTPVerificationScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  ActivityIndicator,
  Image
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { ScaledSheet } from "react-native-size-matters";
import Colors from "../../Constants/Colors";
import AuthButton from "../Components/AuthButton";
import OTPInput from "../Components/OTPInput";
import { useAuth } from "../Context/AuthContext";
import { verifyOTP, sendOTP } from "../Services/ApiService";

const OTPVerificationScreen = ({ navigation, route }) => {
  // Use useRef to track if this is the first mount
  const isFirstMount = useRef(true);
  const hasNavigated = useRef(false);

  // Track first mount
  if (isFirstMount.current) {
    isFirstMount.current = false;
  }

  // Get phone number from params
  const { phoneNumber } = route.params || {};

  // Auth context
  const { login } = useAuth();

  // Input state
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResendActive, setIsResendActive] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Format phone number for display - BusinessSide style (show real number without dots)
  const maskedPhone = useMemo(() => {
    if (!phoneNumber) return '';
    
    // BusinessSide: Show the real phone number without masking
    return phoneNumber;
  }, [phoneNumber]);

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

  // Reset OTP error when input changes - only when there's actually an error
  useEffect(() => {
    if (otpCode && otpError) {
      setOtpError(null);
    }
  }, [otpError]); // Remove otpCode dependency to prevent re-renders on every keystroke

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
      // Call real API to verify OTP
      const result = await verifyOTP(phoneNumber, otpCode);

      if (result.success) {
        if (result.hasBusinessAccount) {
          // User has business account - login and go to homepage
          await login(result.token, result.user);
        } else {
          // User doesn't have business account - go to create business screen
          navigation.navigate("BusinessRegister", {
            phoneNumber: phoneNumber,
            isFromOTPVerification: true,
          });
        }
      } else {
        setOtpError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      setOtpError('Failed to verify code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [otpCode, validateForm, verifyOTP, phoneNumber, login, navigation]);

  // Handle resend OTP
  const handleResendOTP = useCallback(() => {
    // Reset OTP input
    setOtpCode('');
    setOtpError(null);
    
    // Reset cooldown
    setResendCooldown(60);
    setIsResendActive(true);
    
    // Send new OTP
    sendOTP(phoneNumber).then((result) => {
      if (result.success) {
        Alert.alert(
          'OTP Resent',
          'A new verification code has been sent to your phone number.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Failed to Resend', result.message || 'Please try again.');
      }
    }).catch((error) => {
      Alert.alert(
        'Failed to Resend',
        error.message || 'There was a problem sending a new code. Please try again.'
      );
    });
  }, [phoneNumber]);
  
  // Navigate back
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // If user is being authenticated and navigated, show a loading screen
  if (isAuthenticating) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            Authenticating...
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
          
          <View style={styles.verificationContainer}>
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
                  error={otpError}
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
verificationContainer: {
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
  helpText: {
    fontSize: "14@s",
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: "30@vs",
    paddingHorizontal: "20@s",
    color: Colors.textSecondary,
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


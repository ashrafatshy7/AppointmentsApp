// src/Auth/Screens/BusinessLoginScreen.js
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScaledSheet } from "react-native-size-matters";
import Colors from "../../Constants/Colors";
import AuthButton from "../Components/AuthButton";
import PhoneInput from "../Components/PhoneInput";
import { isValidPhoneNumber } from "../Utils/validators";
import { checkUserExists, sendOTP } from "../Services/ApiService";

const BusinessLoginScreen = ({ navigation }) => {
  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation state
  const [errors, setErrors] = useState({});

  // Basic validation
  const validateForm = () => {
    let formErrors = {};

    if (!phoneNumber.trim()) {
      formErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(phoneNumber)) {
      formErrors.phone = "Please enter a valid phone number";
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  // Handle phone number submission - navigate to OTP verification
  const handleSendOTP = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // First, check if user exists
      const userCheckResult = await checkUserExists(phoneNumber);

      if (userCheckResult.success && userCheckResult.userExists) {
        // User exists, proceed with OTP
        const otpResult = await sendOTP(phoneNumber);

        if (otpResult.success) {
          // Navigate to OTP verification screen with phone number
          navigation.navigate("OTPVerification", {
            phoneNumber: phoneNumber,
          });
        } else {
          Alert.alert(
            "Error",
            otpResult.message || "Failed to send verification code"
          );
        }
      } else {
        // User doesn't exist - show error under input
        setErrors({
          ...errors,
          phone: "No account found. Please sign up below."
        });
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Failed to verify phone number. Please try again."
      );
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.welcomeSubtext}>Sign in to continue to your business</Text>
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
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.loginCard}>
              <View style={styles.cardContent}>
                <Text style={styles.welcomeSubtitle}>
                  Enter your phone number below
                </Text>

                {/* Phone Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.phoneInputWrapper}>
                    <PhoneInput
                      value={phoneNumber}
                      onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (errors.phone) {
                          setErrors({ ...errors, phone: null });
                        }
                      }}
                      error={errors.phone}
                      placeholder="phone number"
                      containerStyle={styles.phoneInputContainer}
                    />
                  </View>
                </View>

                {/* Sign In Button */}
                <AuthButton
                  title="Send Verification Code"
                  onPress={handleSendOTP}
                  loading={isSubmitting}
                  style={styles.signInButton}
                />

                {/* Sign Up Link */}
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('BusinessRegister')}>
                    <Text style={styles.signUpLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
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
    justifyContent: 'flex-end',
    paddingHorizontal: "20@s",
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
  formContent: {
    flexGrow: 1,
    padding: "24@s",
    paddingTop: "40@vs",
  },
  loginCard: {
    flex: 1,
  },
  cardContent: {
    marginTop: "50@s",
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: "28@s",
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: "8@vs",
    color: Colors.textPrimary,
  },
  welcomeSubtitle: {
    fontSize: "14@s",
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: "20@vs",
    color: Colors.textExtraLight,
    opacity: 0.7,
  },
  inputContainer: {
    width: '100%',
    marginBottom: "16@vs",
  },
  phoneInputWrapper: {
    minHeight: "85@vs", 
  },
  phoneInputContainer: {
    borderRadius: "6@s",
    paddingVertical: "12@vs",
    paddingHorizontal: "12@s",
    backgroundColor: 'transparent',
    minHeight: "44@vs",
  },
  signInButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: "12@s",
    paddingVertical: "18@vs",
    paddingHorizontal: "32@s",
    marginTop: "8@vs",
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: "20@vs",
  },
  signUpText: {
    fontSize: "14@s",
    color: Colors.textSecondary,
    fontFamily: 'Poppins-Regular',
  },
  signUpLink: {
    fontSize: "14@s",
    color: Colors.primary,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default BusinessLoginScreen;


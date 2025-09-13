// src/Auth/Components/OTPInput.js
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
  Text,
  TouchableOpacity
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../Constants/Colors';

// Highly optimized OTP input component
const OTPInput = ({
  length = 6,
  value = '',
  onChange,
  autoFocus = true,
  error = null,
  disabled = false,
  inputStyle = {},
  containerStyle = {},
  resendOtp = () => {},
}) => {
  // Create refs array for each digit input
  const inputRefs = useRef([]);
  
  // Track focused input index
  const [focusedInput, setFocusedInput] = useState(0);
  
  // Initialize refs when component mounts 
  useEffect(() => {
    inputRefs.current = Array(length).fill(null).map((_, i) => inputRefs.current[i] || React.createRef());
    
    if (autoFocus && !disabled) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [length, autoFocus, disabled]);
  
  // Handle text change for each input
  const handleChangeText = useCallback((text, index) => {
    // Allow only numbers
    if (!/^[0-9]?$/.test(text)) return;
    
    // Create new value array
    const valueArray = value.split('');
    valueArray[index] = text;
    
    // Update parent with new value
    onChange(valueArray.join(''));
    
    // If entered a digit and not the last input, focus next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [value, length, onChange]);
  
  // Handle key press (for backspace handling)
  const handleKeyPress = useCallback(({ nativeEvent: { key } }, index) => {
    // If backspace and current input is empty, focus previous input
    if (key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [value]);
  
  // Handle focus on input
  const handleFocus = useCallback((index) => {
    setFocusedInput(index);
  }, []);
  
  // Handle paste functionality
  const handlePaste = useCallback((text) => {
    // Extract only numbers and limit to OTP length
    const regex = /[0-9]/g;
    const pastedData = text.match(regex)?.join('').substring(0, length) || '';
    
    // Update parent with pasted value
    if (pastedData.length > 0) {
      onChange(pastedData.padEnd(length, ''));
      
      // Focus appropriate input based on paste length
      if (pastedData.length < length) {
        inputRefs.current[pastedData.length]?.focus();
      } else {
        inputRefs.current[length - 1]?.focus();
        // Dismiss keyboard if complete
        setTimeout(() => Keyboard.dismiss(), 100);
      }
    }
  }, [length, onChange]);
  
  // Create array for rendering inputs (memoized to prevent unnecessary recalculations)
  const inputs = useMemo(() => {
    return Array(length).fill(0).map((_, index) => {
      const isFocused = focusedInput === index;
      const inputProps = {
        value: value[index] || '',
        onChangeText: (text) => handleChangeText(text, index),
        onKeyPress: (e) => handleKeyPress(e, index),
        onFocus: () => handleFocus(index),
        maxLength: 1,
        keyboardType: 'number-pad',
        style: [
          styles.input,
          inputStyle,
          isFocused && styles.focusedInput,
          error && styles.errorInput,
          disabled && styles.disabledInput
        ],
        ref: (ref) => {
          inputRefs.current[index] = ref;
        },
        editable: !disabled,
        onPaste: handlePaste,
      };
      
      return (
        <TextInput
          key={`otp-input-${index}`}
          {...inputProps}
          selectTextOnFocus
          autoCorrect={false}
          spellCheck={false}
        />
      );
    });
  }, [length, value, focusedInput, error, disabled, handleChangeText, handleKeyPress, handleFocus, handlePaste, inputStyle]);
  
  // Use platform specific paste handler
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebPaste = (e) => {
        handlePaste(e.clipboardData.getData('text'));
      };
      document.addEventListener('paste', handleWebPaste);
      return () => document.removeEventListener('paste', handleWebPaste);
    }
  }, [handlePaste]);
  
  // Calculate countdown timer for resend OTP (60 seconds)
  const [countdown, setCountdown] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);
  
  useEffect(() => {
    let timer;
    if (isResendActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      setIsResendActive(false);
      setCountdown(60);
    }
    
    return () => clearTimeout(timer);
  }, [countdown, isResendActive]);
  
  const handleResendOTP = useCallback(() => {
    resendOtp();
    setIsResendActive(true);
  }, [resendOtp]);
  
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputsContainer}>
        {inputs}
      </View>
      
      {error && (
        <Text style={styles.errorText}>
          <FontAwesome5 name="exclamation-circle" size={12} color={Colors.danger} /> {error}
        </Text>
      )}
      
      <View style={styles.actionsContainer}>
        <Text style={styles.didntReceiveText}>Didn't receive the code?</Text>
        
        {/* Resend OTP button */}
        <TouchableOpacity 
          onPress={handleResendOTP} 
          style={styles.resendButton}
          disabled={isResendActive || disabled}
        >
          <FontAwesome5 name="paper-plane" size={12} color={isResendActive ? Colors.textLight : Colors.primary} />
          <Text style={[styles.resendText, isResendActive && styles.disabledText]}>
            {isResendActive ? `Resend in ${countdown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  input: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  focusedInput: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  errorInput: {
    borderColor: Colors.danger,
  },
  disabledInput: {
    backgroundColor: Colors.backgroundGray,
    color: Colors.textLight,
  },
  errorText: {
    width: '100%', 
    color: Colors.danger,
    fontSize: 12,
    marginVertical: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  didntReceiveText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.textSecondary,
    alignSelf: 'center',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  resendText: {
    marginLeft: 5,
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  disabledText: {
    color: Colors.textLight,
  }
});

export default React.memo(OTPInput);
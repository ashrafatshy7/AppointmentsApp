// src/Auth/Components/OTPInput.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet,
  Keyboard,
  Text,
  TouchableOpacity
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../Constants/Colors';

const OTPInput = ({
  length = 6,
  value = '',
  onChange,
  autoFocus = true,
  disabled = false,
  error = null,
  resendOtp = () => {},
}) => {
  const [localValue, setLocalValue] = useState(value.padEnd(length));
  const inputRefs = useRef([]);
  const [focusedInput, setFocusedInput] = useState(0);
  
  // Calculate countdown timer for resend OTP (60 seconds)
  const [countdown, setCountdown] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);
  
  // Initialize refs array
  useEffect(() => {
    inputRefs.current = Array(length).fill(0).map((_, i) => inputRefs.current[i] || React.createRef());
  }, [length]);
  
  // Update internal state when external value changes
  useEffect(() => {
    setLocalValue(value.padEnd(length));
  }, [value, length]);
  
  // Handle text change for a specific input
  const handleChange = (text, index) => {
    const newValue = localValue.split('');
    
    // Only accept single digits
    if (text.length > 0) {
      const lastChar = text[text.length - 1];
      newValue[index] = lastChar;
      
      // Move to next input if available
      if (index < length - 1) {
        inputRefs.current[index + 1].focus();
      } else {
        inputRefs.current[index].blur();
        Keyboard.dismiss();
      }
    } else {
      newValue[index] = ' ';
    }
    
    const updatedValue = newValue.join('').trim();
    setLocalValue(updatedValue.padEnd(length));
    
    if (onChange) {
      onChange(updatedValue);
    }
  };
  
  // Handle key press for backspace navigation
  const handleKeyPress = (e, index) => {
    const { key } = e.nativeEvent;
    
    if (key === 'Backspace' && index > 0 && !localValue[index].trim()) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  // Handle input focus
  const handleFocus = (index) => {
    setFocusedInput(index);
    // If the focused input already has a value, select it
    if (localValue[index].trim()) {
      inputRefs.current[index].setNativeProps({
        selection: { start: 0, end: 1 }
      });
    }
  };
  
  // Setup countdown timer for resend
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
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {Array(length).fill(0).map((_, index) => {
          const isFocused = focusedInput === index;
          const hasValue = localValue[index].trim();
          
          return (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.input,
                isFocused && styles.focusedInput,
                error && styles.errorInput,
                hasValue && styles.filledInput,
                disabled && styles.disabledInput
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={localValue[index] === ' ' ? '' : localValue[index]}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              autoFocus={autoFocus && index === 0}
              editable={!disabled}
              selectTextOnFocus
              autoCorrect={false}
              spellCheck={false}
            />
          );
        })}
      </View>
      
      {/* Error Text */}
      {error && (
        <Text style={styles.errorText}>
          <FontAwesome5 name="exclamation-circle" size={12} color={Colors.danger} /> {error}
        </Text>
      )}
      
      {/* Actions Container */}
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

export default OTPInput;

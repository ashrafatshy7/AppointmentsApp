// src/Auth/Components/AuthButton.js
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ScaledSheet } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../Constants/Colors';

const AuthButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style = {},
  textStyle = {},
  icon = null,
  iconPosition = 'left',
  variant = 'primary',
  useGradient = true,
}) => {
  // Determine button styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: Colors.primary,
          borderWidth: 1,
          textColor: Colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.backgroundGray,
          borderColor: Colors.border,
          borderWidth: 1,
          textColor: Colors.textPrimary,
        };
      case 'danger':
        return {
          backgroundColor: Colors.danger,
          borderColor: Colors.danger,
          borderWidth: 0,
          textColor: Colors.white,
        };
      case 'primary':
      default:
        return {
          backgroundColor: Colors.primary,
          borderColor: Colors.primary,
          borderWidth: 0,
          textColor: Colors.white,
        };
    }
  };

  const buttonStyles = getButtonStyles();
  const isDisabled = disabled || loading;

  const ButtonContent = ({ children }) => {
    if (useGradient && variant === 'primary' && !isDisabled) {
      return (
        <LinearGradient
          colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientButton, style]}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View
        style={[
          styles.button,
          {
            backgroundColor: buttonStyles.backgroundColor,
            borderColor: buttonStyles.borderColor,
            borderWidth: buttonStyles.borderWidth,
            opacity: isDisabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <ButtonContent>
        {loading ? (
          <ActivityIndicator color={buttonStyles.textColor} size="small" />
        ) : (
          <View style={styles.contentContainer}>
            {icon && iconPosition === 'left' && (
              <FontAwesome5
                name={icon}
                size={16}
                color={buttonStyles.textColor}
                style={styles.leftIcon}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                { color: buttonStyles.textColor },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <FontAwesome5
                name={icon}
                size={16}
                color={buttonStyles.textColor}
                style={styles.rightIcon}
              />
            )}
          </View>
        )}
      </ButtonContent>
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  button: {
    height: '56@vs',
    borderRadius: '12@s',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  gradientButton: {
    height: '56@vs',
    borderRadius: '12@s',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: '16@s',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  leftIcon: {
    marginRight: '8@s',
  },
  rightIcon: {
    marginLeft: '8@s',
  },
});

export default AuthButton;
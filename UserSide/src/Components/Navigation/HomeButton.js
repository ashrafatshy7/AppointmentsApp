// src/Components/Navigation/HomeButton.js
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { navigateToHome } from '../../Navigation/NavigationHelpers';
import { useTheme } from '../../Context/ThemeContext';

/**
 * Universal Home Button Component
 * Automatically handles proper navigation to Home with correct animations
 */
const HomeButton = ({ 
  style, 
  iconName = "home", 
  iconSize = 16, 
  iconColor, 
  onPress, 
  children,
  ...props 
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const handlePress = () => {
    // Call custom onPress if provided
    if (onPress) {
      onPress();
      return;
    }
    
    // Use our smart navigation helper
    navigateToHome(navigation);
  };
  
  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: theme.primary,
          borderRadius: 20,
          padding: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Navigate to Home"
      accessibilityHint="Returns to the home screen"
      {...props}
    >
      {children || (
        <FontAwesome5 
          name={iconName} 
          size={iconSize} 
          color={iconColor || theme.white} 
        />
      )}
    </TouchableOpacity>
  );
};

export default HomeButton;
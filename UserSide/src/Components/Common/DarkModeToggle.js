// src/Components/Common/DarkModeToggle.js
import React from 'react';
import { View, Switch, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ScaledSheet } from 'react-native-size-matters';
import { useTheme } from '../../Context/ThemeContext';

/**
 * Enhanced Dark Mode Toggle component with animation
 * 
 * @param {Object} props Component props
 * @param {Function} props.onToggle Custom toggle handler (optional)
 * @param {Object} props.style Additional styles
 */
const DarkModeToggle = ({ onToggle, style = {} }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  
  // Handle toggle with optional custom handler
  const handleToggle = () => {
    toggleDarkMode();
    if (onToggle) {
      onToggle();
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <FontAwesome5 
          name={isDarkMode ? "moon" : "sun"} 
          size={16} 
          color={theme.primary} 
        />
      </View>
      
      <Text style={[styles.label, { color: theme.textPrimary }]}>
        Dark Mode
      </Text>
      
      <Switch
        value={isDarkMode}
        onValueChange={handleToggle}
        trackColor={{ 
          false: theme.disabled, 
          true: theme.primaryLight 
        }}
        thumbColor={isDarkMode ? theme.primary : theme.white}
        ios_backgroundColor={theme.disabled}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '12@s',
  },
  iconContainer: {
    width: '24@s',
    marginRight: '10@s',
  },
  label: {
    fontSize: '15@s',
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
});

export default DarkModeToggle;
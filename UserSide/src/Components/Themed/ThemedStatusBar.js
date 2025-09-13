// src/Components/Themed/ThemedStatusBar.js
import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from '../../Context/ThemeContext';

export function ThemedStatusBar() {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <StatusBar 
      barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      backgroundColor={theme.background}
    />
  );
}
// src/Context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../Constants/Colors';

// Create theme context
const ThemeContext = createContext(null);

// Storage key for theme preference
const THEME_STORAGE_KEY = '@business_app:theme_mode';

// Provider component
export const ThemeProvider = ({ children }) => {
  // Get system color scheme
  const systemColorScheme = useColorScheme();
  
  // State for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        
        if (savedTheme !== null) {
          // Use saved preference
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Default to system preference
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Fallback to system preference
        setIsDarkMode(systemColorScheme === 'dark');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThemePreference();
  }, [systemColorScheme]);
  
  // Save preference when it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };
    
    saveThemePreference();
  }, [isDarkMode, isLoading]);
  
  // Toggle theme function
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);
  
  // Create the current theme by selecting properties from Colors
  const theme = isDarkMode ? {
    // Primary colors
    primary: Colors.dark.primary,
    primaryLight: Colors.dark.primaryLight,
    primaryDark: Colors.dark.primaryDark,
    primaryBackground: Colors.dark.primaryBackground,
    primaryBorder: Colors.dark.primaryBorder,
    primaryExtraLight: Colors.dark.primaryExtraLight,
    primaryUltraLight: Colors.dark.primaryUltraLight,
    
    // Background colors
    background: Colors.dark.background,
    backgroundLight: Colors.dark.backgroundLight,
    backgroundGray: Colors.dark.backgroundGray,
    backgroundExtraLight: Colors.dark.backgroundExtraLight,
    
    // Text colors
    textPrimary: Colors.dark.textPrimary,
    textSecondary: Colors.dark.textSecondary,
    textLight: Colors.dark.textLight,
    textExtraLight: Colors.dark.textExtraLight,
    textMuted: Colors.dark.textMuted,
    
    // Border colors
    border: Colors.dark.border,
    borderLight: Colors.dark.borderLight,
    
    // Status colors
    success: Colors.dark.success,
    info: Colors.dark.info,
    warning: Colors.dark.warning,
    danger: Colors.dark.danger,
    disabled: Colors.dark.disabled,
    
    // Common colors
    white: Colors.dark.white,
    black: Colors.dark.black,
    transparent: Colors.transparent,
    
    // Overlay colors
    overlay: Colors.dark.overlay,
    overlayLight: Colors.dark.overlayLight,
  } : Colors;
  
  // Provide context value
  const contextValue = {
    theme,
    isDarkMode,
    toggleDarkMode,
    isLoading
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

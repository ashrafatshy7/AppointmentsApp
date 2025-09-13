// src/Context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Create context
const UserContext = createContext();

// Supported languages
export const LANGUAGES = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'he', name: 'עברית', rtl: true },  // Hebrew
  { code: 'ar', name: 'العربية', rtl: true }  // Arabic
];

// Minimal default values for user preferences only
const defaultUserPreferences = {
  language: 'en', // Default language is English
  profileImageUri: null, // Will be null initially
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Get system color scheme
  const systemColorScheme = useColorScheme();

  // Load user data and preferences from AsyncStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load authenticated user data from AuthContext
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const authUserData = JSON.parse(storedUserData);
          // Merge with default preferences for any missing properties
          setUserData({
            ...defaultUserPreferences,
            ...authUserData,
          });
        } else {
          // No authenticated user data available
          setUserData(null);
        }
        
        // Load dark mode preference
        const darkModePref = await AsyncStorage.getItem('darkMode');
        if (darkModePref !== null) {
          setIsDarkMode(darkModePref === 'true');
        } else {
          // If no preference is saved, use system setting
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading user data or preferences:', error);
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [systemColorScheme]);

  // Save user data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveUserData = async () => {
      try {
        if (userData) {
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    };

    // Don't save on initial load and only save if userData exists
    if (!isLoading && userData) {
      saveUserData();
    }
  }, [userData, isLoading]);
  
  // Save dark mode preference whenever it changes
  useEffect(() => {
    const saveDarkModePref = async () => {
      try {
        await AsyncStorage.setItem('darkMode', isDarkMode.toString());
      } catch (error) {
        console.error('Error saving dark mode preference:', error);
      }
    };
    
    // Don't save on initial load
    if (!isLoading) {
      saveDarkModePref();
    }
  }, [isDarkMode, isLoading]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Function to update profile image
  const updateProfileImage = async (imageUri) => {
    setUserData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        profileImageUri: imageUri
      };
    });
  };

  // Function to update user info
  const updateUserInfo = (newUserData) => {
    setUserData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        ...newUserData
      };
    });
  };

  // Function to update language
  const updateLanguage = (languageCode) => {
    setUserData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        language: languageCode
      };
    });
  };

  // Get current language object
  const getCurrentLanguage = () => {
    const userLanguage = userData?.language || defaultUserPreferences.language;
    return LANGUAGES.find(lang => lang.code === userLanguage) || LANGUAGES[0];
  };

  return (
    <UserContext.Provider 
      value={{ 
        userData, 
        updateProfileImage, 
        updateUserInfo,
        updateLanguage,
        getCurrentLanguage,
        isDarkMode,
        toggleDarkMode,
        isLoading 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
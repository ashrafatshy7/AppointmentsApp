// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Custom Contexts
import { AuthProvider } from './src/Auth/Context/AuthContext';
import { UserProvider } from './src/Context/UserContext';
import { ThemeProvider } from './src/Context/ThemeContext';
import { LocationProvider } from './src/Context/LocationContext';

// Navigation
import Navigation from './src/Navigation/Navigation';
import AuthStack from './src/Auth/Navigation/AuthStack';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a main app wrapper to combine all providers
const AppWrapper = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <ThemeProvider>
            <LocationProvider>
              <App />
            </LocationProvider>
          </ThemeProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Auth');

  // Load fonts and check authentication state
  const prepareApp = useCallback(async () => {
    try {
      // Load fonts
      await Font.loadAsync({
        'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
        'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
        'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
        'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
        'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
        'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
        'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
      });

      // Check if user is logged in
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (userToken) {
        setInitialRoute('App');
      }
      
    } catch (error) {
      console.warn('Error preparing app:', error);
    } finally {
      // Tell the application to render
      setAppIsReady(true);
    }
  }, []);

  useEffect(() => {
    prepareApp();
  }, [prepareApp]);

  // This useEffect runs when appIsReady changes to true
  useEffect(() => {
    if (appIsReady) {
      // Hide the splash screen after everything is set up
      const hideSplash = async () => {
        await SplashScreen.hideAsync();
      };
      
      hideSplash();
    }
  }, [appIsReady]);

  // If the app is not ready, return an empty view
  // The splash screen will remain visible during this time
  if (!appIsReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <AuthStack />
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppWrapper;
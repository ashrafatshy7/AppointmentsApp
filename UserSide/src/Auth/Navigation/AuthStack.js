// src/Auth/Navigation/AuthStack.js
import React, { useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../Context/AuthContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '../../Constants/Colors';

// Auth screens
import LoginScreen from '../Screens/LoginScreen';
import RegisterScreen from '../Screens/RegisterScreen';
import OTPVerificationScreen from '../Screens/OTPVerificationScreen';

// App screens (or you could import your main app navigation)
import AppTabNavigator from '../../Navigation/Navigation'; // Adjust this import to your actual main navigation

const Stack = createStackNavigator();

// Loading component with a more attractive design
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingCard}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Preparing your experience...</Text>
    </View>
  </View>
);

/**
 * Authentication navigation stack
 * Handles the flow between login, registration, verification, and the main app
 */
const AuthStack = () => {
  const { userToken, isLoading } = useAuth();
  
  // Track state changes
  const prevState = useRef({ userToken, isLoading });
  if (prevState.current.userToken !== userToken || prevState.current.isLoading !== isLoading) {
    prevState.current = { userToken, isLoading };
  }

  // Show a loading screen while checking authentication status
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
        // Prevent flickering during transitions
        detachPreviousScreen: false,
        // Disable animation between auth and app for a smoother transition
        animationEnabled: false, 
      }}
    >
      {userToken ? (
        // User is signed in - Show main app
        <Stack.Screen 
          name="App" 
          component={AppTabNavigator}
          options={{
            // Use animation for screens within the app
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
              },
            }),
          }}
        />
      ) : (
        // User is not signed in - Show auth screens
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              animationEnabled: true,
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              }),
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ 
              animationEnabled: true,
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              }),
            }}
          />
          <Stack.Screen 
            name="OTPVerification" 
            component={OTPVerificationScreen}
            options={{ 
              animationEnabled: true,
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              }),
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: 'Poppins-Medium',
  },
});

export default AuthStack;
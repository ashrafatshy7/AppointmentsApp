// src/Navigation/Navigation.js

import { View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator, CardStyleInterpolators, TransitionSpecs } from "@react-navigation/stack";
import { FontAwesome5 } from "@expo/vector-icons";
import LocationGatekeeper from "../Utils/LocationGatekeeper";
import HomePage from "../BusinessSearch/Screens/HomePage.js";
import BusinessDetailsPage from "../BusinessSearch/Screens/BusinessDetailsPage.js";
import CategoryBusinessesPage from "../BusinessSearch/Screens/CategoryBusinessesPage.js";
import SearchPage from "../BusinessSearch/Screens/SearchPage.js";
import AppointmentsPage from "../Appointments/Screens/AppointmentsPage.js";
import ProfilePage from "../Profile/Screens/ProfilePage.js";
import Colors from "../Constants/Colors.js";
import AppointmentService from '../Appointments/Service/AppointmentService.js';
import AppointmentEventEmitter from "../Utils/AppointmentEventEmitter.js";
import { useTheme } from '../Context/ThemeContext';
import { navigateToHome } from './NavigationHelpers';

// Define route param types for type safety
export const ROUTES = {
  HOME: 'Home',
  APPOINTMENTS: 'Appointments',
  PROFILE: 'Profile',
  BUSINESS_DETAILS: 'BusinessDetailsPage',
  SEARCH: 'SearchPage',
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Modern Tab Bar Button Component with Animation
const ModernTabBarButton = ({ children, onPress, isSelected }) => {
  const { theme, isDarkMode } = useTheme();
  
  // Animation values - separate animations for native and JS drivers
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [bgColor, setBgColor] = useState(isSelected ? theme.primaryBackground : theme.transparent);
  
  useEffect(() => {
    // Scale animation on press - using native driver
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: isSelected ? 0.92 : 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    // Instead of animating backgroundColor, just set it directly
    setBgColor(isSelected ? theme.primaryBackground : theme.transparent);
  }, [isSelected, theme]);
  
  return (
    <TouchableOpacity
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Fixed value instead of useSafeAreaInsets
      }}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isSelected ? "Current tab" : "Switch tab"}
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View
        style={{
          width: '80%',
          alignItems: 'center',
          backgroundColor: bgColor,
          borderRadius: 16,
          paddingVertical: 8,
          transform: [{ scale: scaleAnim }],
          shadowColor: isSelected ? theme.primary : 'transparent',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: isSelected ? 5 : 0,
        }}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Badge Component
const TabBadge = ({ count }) => {
  const { theme } = useTheme();
  
  if (!count || count <= 0) return null;
  
  return (
    <View style={{
      position: 'absolute',
      right: -16,
      top: -9,
      backgroundColor: theme.secondary,
      borderRadius: 12,
      minWidth: 22,
      height: 22,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
      borderWidth: 2,
      borderColor: theme.white,
    }}>
      <Text style={{
        color: theme.white,
        fontSize: 11,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
      }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

// HomeStack Navigator
const HomeStackScreen = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: theme.primaryUltraLight },
        // Ensure consistent animations for iOS
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        transitionSpec: {
          open: TransitionSpecs.TransitionIOSSpec,
          close: TransitionSpecs.TransitionIOSSpec,
        },
        // Prevent duplicates by enabling replace behavior
        animationEnabled: true,
        presentation: 'card',
      }}
      detachInactiveScreens={false} // Prevent memory issues with complex screens
    >
      <Stack.Screen 
        name="HomeStack" 
        component={HomePage}
        options={{
          // Mark as initial screen
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter
        }}
      />
      <Stack.Screen 
        name={ROUTES.BUSINESS_DETAILS} 
        component={BusinessDetailsPage}
        options={{ 
          gestureEnabled: true,
          headerShown: false,
          // Ensure proper forward/back animations
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
        }}
      />
      <Stack.Screen 
        name="CategoryBusinesses" 
        component={CategoryBusinessesPage}
        options={{ 
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
        }}
      />
      <Stack.Screen 
        name={ROUTES.SEARCH} 
        component={SearchPage}
        options={{ 
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
        }}
      />
    </Stack.Navigator>
  );
};

// AppointmentsStack Navigator
const AppointmentsStackScreen = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: theme.primaryUltraLight }
      }}
    >
      <Stack.Screen name="AppointmentsStack" component={AppointmentsPage} />
    </Stack.Navigator>
  );
};

// ProfileStack Navigator
const ProfileStackScreen = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: theme.primaryUltraLight }
      }}
    >
      <Stack.Screen name="ProfileStack" component={ProfilePage} />
    </Stack.Navigator>
  );
};

export default function Navigation() {
  // Get theme context
  const { theme, isDarkMode } = useTheme();
  
  // State for the upcoming appointments count
  const [upcomingCount, setUpcomingCount] = useState(0);
  
  // Function to fetch upcoming appointments count
  const fetchUpcomingAppointmentsCount = async () => {
    try {
      // Check if the function exists before calling it
      if (AppointmentService && typeof AppointmentService.getUpcomingAppointmentsCount === 'function') {
        const count = await AppointmentService.getUpcomingAppointmentsCount();
        setUpcomingCount(count);
      } else {
        // Function doesn't exist, set count to 0 for now
        setUpcomingCount(0);
      }
    } catch (error) {
      console.error('Error fetching upcoming appointments count:', error);
      setUpcomingCount(0);
    }
  };
  
  useEffect(() => {
    // Initial fetch of appointment count
    fetchUpcomingAppointmentsCount();
    
    // Set up listeners for appointment events
    const addedListener = AppointmentEventEmitter.addListener(
      'appointmentAdded',
      () => fetchUpcomingAppointmentsCount()
    );
    
    const canceledListener = AppointmentEventEmitter.addListener(
      'appointmentCanceled',
      () => fetchUpcomingAppointmentsCount()
    );
    
    const updatedListener = AppointmentEventEmitter.addListener(
      'appointmentsUpdated',
      () => fetchUpcomingAppointmentsCount()
    );
    
    // Set up an interval to periodically refresh the count as a fallback
    const refreshInterval = setInterval(fetchUpcomingAppointmentsCount, 60000); // Refresh every minute
    
    // Clean up on unmount
    return () => {
      addedListener();
      canceledListener();
      updatedListener();
      clearInterval(refreshInterval);
    };
  }, []);

  // Custom tab bar icons with badge
  const renderTabBarIcon = (name, color, count = 0) => (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {count > 0 && name === "calendar-alt" && <TabBadge count={count} />}
      <FontAwesome5 name={name} size={20} color={color} />
    </View>
  );
  
  // Create navigation theme
  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.backgroundLight,
      text: theme.textPrimary,
      border: theme.border,
      notification: theme.danger,
    },
  };

  return (
    <LocationGatekeeper>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textLight,
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Poppins-Medium',
            marginTop: 4,
          },
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 85 : 70,
            backgroundColor: theme.white,
            borderTopWidth: 0,
            shadowColor: theme.black,
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            position: 'absolute',
            overflow: 'hidden',
          },
          tabBarItemStyle: {
            paddingTop: 8,
          }
        }}
        initialRouteName={ROUTES.HOME}  // Explicitly set initial route
        backBehavior="initialRoute"     // Go back to initial route when pressing back
      >
        <Tab.Screen
          name={ROUTES.HOME}
          component={HomeStackScreen}
          options={{
            tabBarIcon: ({ color }) => renderTabBarIcon("home", color),
            tabBarButton: (props) => <ModernTabBarButton {...props} isSelected={props.focused} />,
          }}
          listeners={({ navigation, route }) => ({
            tabPress: (e) => {
              // Prevent default action
              e.preventDefault();
              
              const state = navigation.getState();
              const currentRoute = state?.routes?.[state?.index];
              
              // If already on Home tab, check if we need to pop
              if (currentRoute?.name === ROUTES.HOME) {
                const homeStackState = currentRoute?.state;
                const stackDepth = homeStackState?.routes?.length || 1;
                
                if (stackDepth > 1) {
                  // Multiple screens in stack - navigate to reset the stack
                  navigation.navigate(ROUTES.HOME, {
                    screen: 'HomeStack',
                    params: {},
                  });
                } else {
                  // Already at root - no action needed
                  console.log('Already at Home root, no action needed');
                }
                return;
              }
              
              // Switch to Home tab and reset stack
              navigation.navigate(ROUTES.HOME, {
                screen: 'HomeStack',
                params: {},
              });
            },
          })}
        />
        <Tab.Screen
          name={ROUTES.APPOINTMENTS}
          component={AppointmentsStackScreen}
          options={{
            tabBarIcon: ({ color }) => renderTabBarIcon("calendar-alt", color, upcomingCount),
            tabBarButton: (props) => <ModernTabBarButton {...props} isSelected={props.focused} />,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // Prevent default action
              e.preventDefault();
              
              // Reset the Appointments stack when Tab is pressed
              navigation.navigate(ROUTES.APPOINTMENTS, {
                screen: 'AppointmentsStack',
                params: {},
              });
            },
          })}
        />
        <Tab.Screen
          name={ROUTES.PROFILE}
          component={ProfileStackScreen}
          options={{
            tabBarIcon: ({ color }) => renderTabBarIcon("user-circle", color),
            tabBarButton: (props) => <ModernTabBarButton {...props} isSelected={props.focused} />,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // Prevent default action
              e.preventDefault();
              
              // Reset the Profile stack when Tab is pressed without sending function
              navigation.navigate(ROUTES.PROFILE, {
                screen: 'ProfileStack',
                params: {},  // No function here to avoid the warning
              });
            },
          })}
        />
      </Tab.Navigator>
    </LocationGatekeeper>
  );
}
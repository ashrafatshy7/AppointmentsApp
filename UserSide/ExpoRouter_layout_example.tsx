// app/_layout.tsx - Example Expo Router configuration
// This would replace your React Navigation setup if using Expo Router

import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        // Ensure iOS horizontal slide animations are used
        animation: 'default', // Uses platform default - slide from right on iOS
        // For custom animations, you can use:
        // animation: 'slide_from_right', // Forward navigation (RTL)
        // animation: 'slide_from_left',  // Back navigation (LTR)
        
        // Alternatively, for more control:
        animationTypeForReplace: 'push', // When using router.replace()
        
        // iOS-specific optimizations
        ...(Platform.OS === 'ios' && {
          gestureDirection: 'horizontal',
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 300 } },
            close: { animation: 'timing', config: { duration: 300 } }
          }
        }),
        
        // Android-specific optimizations  
        ...(Platform.OS === 'android' && {
          animationEnabled: true,
          gestureDirection: 'horizontal'
        })
      }}
    />
  );
}

// app/(tabs)/_layout.tsx - Tab layout example
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
        // Ensure tab switches don't stack routes
        tabBarButton: ({ children, onPress, ...props }) => {
          return (
            <TouchableOpacity
              {...props}
              onPress={(e) => {
                // Custom logic to prevent stacking when switching to home
                if (props.accessibilityState?.selected) {
                  // If already on this tab, do nothing or pop to top
                  return;
                }
                onPress?.(e);
              }}
            >
              {children}
            </TouchableOpacity>
          );
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="calendar-alt" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user-circle" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Example screen that needs home navigation
// app/business/[id].tsx
import { View, TouchableOpacity, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { navigateToHomeExpoRouter } from '../../src/Navigation/ExpoRouterHelpers';

export default function BusinessDetailsScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* Custom Home Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          backgroundColor: '#007AFF',
          borderRadius: 20,
          padding: 10,
          zIndex: 1000
        }}
        onPress={navigateToHomeExpoRouter}
      >
        <FontAwesome5 name="home" size={16} color="white" />
      </TouchableOpacity>
      
      {/* Screen content */}
      <Text>Business Details</Text>
    </View>
  );
}
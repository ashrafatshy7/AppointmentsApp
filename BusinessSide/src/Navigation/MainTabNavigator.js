// src/Navigation/MainTabNavigator.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Context/ThemeContext';

// Import the screens that actually exist
import BusinessDashboardScreen from '../Dashboard/Screens/BusinessDashboardScreen';
import AppointmentsManagementScreen from '../Dashboard/Screens/AppointmentsManagementScreen';
import TodayAppointmentsScreen from '../Dashboard/Screens/TodayAppointmentsScreen';
import BusinessProfileScreen from '../Profile/Screens/BusinessProfileScreen';

// Create individual stack navigators for each tab
const DashboardStack = createStackNavigator();
const AppointmentsStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Dashboard Tab Stack
const DashboardStackScreen = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="DashboardMain" component={BusinessDashboardScreen} />
    <DashboardStack.Screen name="TodayAppointments" component={TodayAppointmentsScreen} />
  </DashboardStack.Navigator>
);

// Appointments Tab Stack
const AppointmentsStackScreen = () => (
  <AppointmentsStack.Navigator screenOptions={{ headerShown: false }}>
    <AppointmentsStack.Screen name="AppointmentsMain" component={AppointmentsManagementScreen} />
  </AppointmentsStack.Navigator>
);

// Profile Tab Stack
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={BusinessProfileScreen} />
  </ProfileStack.Navigator>
);

const Tab = createBottomTabNavigator();

// Custom tab bar component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { 
      backgroundColor: theme.background,
      borderTopColor: theme.border,
      shadowColor: theme.black,
      paddingBottom: insets.bottom
    }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const iconName = (() => {
          switch (route.name) {
            case 'Dashboard': return 'home';
            case 'Appointments': return 'calendar-check';
            case 'Profile': return 'user-circle';
            default: return 'question-circle';
          }
        })();

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={[
              styles.iconContainer,
              isFocused && { backgroundColor: theme.primaryBackground }
            ]}>
              <FontAwesome5 
                name={iconName} 
                size={16} 
                color={isFocused ? theme.primary : theme.textLight} 
              />
            </View>
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? theme.primary : theme.textLight }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      backBehavior="history"
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStackScreen}
      />
      <Tab.Screen 
        name="Appointments" 
        component={AppointmentsStackScreen}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackScreen}
      />
    </Tab.Navigator>
  );
};

const styles = ScaledSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    minHeight: '44@vs',
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '2@vs',
  },
  iconContainer: {
    width: '28@s',
    height: '28@s',
    borderRadius: '14@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1@vs',
  },
  tabLabel: {
    fontSize: '10@s',
    fontWeight: '500',
  }
});

export default MainTabNavigator;

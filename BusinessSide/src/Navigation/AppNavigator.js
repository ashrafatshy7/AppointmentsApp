// src/Navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../Auth/Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import { useBusiness } from '../Context/BusinessContext';

// Navigation Stacks
import AuthStack from '../Auth/Navigation/AuthStack';
import MainTabNavigator from './MainTabNavigator';

import AppointmentDetailsScreen from '../Dashboard/AppointmentDetails/AppointmentDetailsScreen';
import AddAppointmentScreen from '../Dashboard/AddAppointment/AddAppointmentScreen';
import EditAppointmentScreen from '../Dashboard/AddAppointment/EditAppointmentScreen';
import RescheduleScreen from '../Dashboard/AddAppointment/RescheduleScreen';
import ManageHoursScreen from '../Dashboard/ManageHours/ManageHoursScreen';
import ServicesSetupScreen from '../Dashboard/Screens/ServicesSetupScreen';

// Customer Management screens
import CustomerManagementScreen from '../CustomerManager/Screens/CustomerManagementScreen';
import CustomerDetailsScreen from '../CustomerManager/Screens/CustomerDetailsScreen';
import AddCustomerScreen from '../CustomerManager/Screens/AddCustomerScreen';

// Calendar screens

// Profile screens
import NotificationSettingsScreen from '../Profile/Screens/NotificationSettingsScreen';
import PaymentSettingsScreen from '../Profile/Screens/PaymentSettingsScreen';
import CalendarIntegrationScreen from '../Profile/Screens/CalendarIntegrationScreen';
import BusinessAnalyticsScreen from '../Profile/Screens/BusinessAnalyticsScreen';
import HelpSupportScreen from '../Profile/Screens/HelpSupportScreen';
import TermsPoliciesScreen from '../Profile/Screens/TermsPoliciesScreen';
import PrivacySettingsScreen from '../Profile/Screens/PrivacySettingsScreen';
import EditBusinessProfileScreen from '../Profile/Screens/EditBusinessProfileScreen';


const Stack = createStackNavigator();

const AppNavigator = () => {
  const { userToken, isLoading, userData } = useAuth();
  const { theme } = useTheme();
  const { initializeBusinessFromAuth, activeBusiness } = useBusiness();
  
  // Initialize business data when userData is available
  React.useEffect(() => {
    // Always reinitialize if userData business ID differs from activeBusiness ID
    const userBusinessId = userData?.business?.id || userData?.business?._id;
    const activeBusinessId = activeBusiness?.id || activeBusiness?._id;
    const shouldInitialize = userData && !isLoading && userData.business && 
                           (!activeBusiness || userBusinessId !== activeBusinessId);
    
    if (shouldInitialize) {
      initializeBusinessFromAuth(userData);
    }
  }, [userData, isLoading, activeBusiness]); // Re-initialize when IDs don't match
  
  // Handle loading state
  if (isLoading) {
    return null; // Or a loading screen
  }

  // Determine initial route
  const initialRouteName = userToken ? 'MainTab' : 'Auth';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
      }}
    >
      {userToken ? (
        // Authenticated user flow
        <>
          <Stack.Screen name="MainTab" component={MainTabNavigator} />
          
          {/* Appointment Management screens */}
          <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
          <Stack.Screen name="EditAppointment" component={EditAppointmentScreen} />
          <Stack.Screen name="RescheduleAppointment" component={RescheduleScreen} />
          <Stack.Screen name="ManageHours" component={ManageHoursScreen} />
          <Stack.Screen name="ServicesSetup" component={ServicesSetupScreen} />
          
          {/* Customer Management screens */}
          <Stack.Screen name="CustomerManagement" component={CustomerManagementScreen} />
          <Stack.Screen name="CustomerDetails" component={CustomerDetailsScreen} />
          <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
          
        
          
          {/* Profile screens */}
          <Stack.Screen name="EditBusinessProfile" component={EditBusinessProfileScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="PaymentSettings" component={PaymentSettingsScreen} />
          <Stack.Screen name="CalendarIntegration" component={CalendarIntegrationScreen} />
          <Stack.Screen name="BusinessAnalytics" component={BusinessAnalyticsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="TermsPolicies" component={TermsPoliciesScreen} />
          <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />

          
          {/* Modal screens */}
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} />
          </Stack.Group>
        </>
      ) : (
        // Auth Flow
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

// App.js
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import 'react-native-gesture-handler'
import { setNavigationRef } from './src/Navigation/NavigationUtils'

// Custom Contexts
import { AuthProvider } from './src/Auth/Context/AuthContext'
import { ThemeProvider } from './src/Context/ThemeContext'
import { BusinessProvider } from './src/Context/BusinessContext'

// Navigation
import AppNavigator from './src/Navigation/AppNavigator'

SplashScreen.preventAutoHideAsync()

const AppWrapper = () => (
  <AuthProvider>
    <ThemeProvider>
      <BusinessProvider>
        <App />
      </BusinessProvider>
    </ThemeProvider>
  </AuthProvider>
)

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false)
  const navigationRef = useRef(null)

  const linking = {
    prefixes: ['businessbookings://', 'https://businessbookings.com'],
    config: {
      screens: {
        MainTab: {
          screens: {
            Dashboard: 'dashboard',
            Calendar: 'calendar',
            Appointments: 'appointments',
            Customers: 'customers',
            Analytics: 'analytics',
            Profile: 'profile',
          },
        },
        AppointmentDetails: {
          path: 'appointment/:appointmentId',
          parse: {
            appointmentId: id => id,
          },
        },
        CustomerDetails: {
          path: 'customer/:customerId',
          parse: {
            customerId: id => id,
          },
        },
        Notifications: 'notifications',
        BusinessAnalytics: 'analytics',
      },
    },
  }

  const prepareApp = useCallback(async () => {
    try {
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
      })
    } catch (error) {
      console.warn('Error loading fonts', error)
    } finally {
      setAppIsReady(true)
    }
  }, [])

  useEffect(() => {
    prepareApp()
  }, [prepareApp])

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync()
    }
  }, [appIsReady])

  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current)
    }
  }, [navigationRef.current])

  if (!appIsReady) return null

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <StatusBar barStyle="light-content" backgroundColor="#4CAF50" translucent={true} />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

export default AppWrapper

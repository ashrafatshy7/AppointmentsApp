// src/AppointmentsPage/AppointmentsPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import AppointmentTabs from '../Components/AppointmentTabs';
import AppointmentsList from '../Components/AppointmentsList';
import AppointmentDetailsModal from '../Components/AppointmentDetailsModal';
import RescheduleAppointmentPanel from '../Components/RescheduleAppointmentPanel';
import AppointmentService from '../Service/AppointmentService';
import Colors from '../../Constants/Colors';
import AppointmentEventEmitter from '../../Utils/AppointmentEventEmitter';
import { useTheme } from '../../Context/ThemeContext';
import { ThemedStatusBar } from '../../Components/Themed/ThemedStatusBar';
import { useAuth } from '../../Auth/Context/AuthContext';

const AppointmentsPage = () => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  
  // Main state - combine related states
  const [pageState, setPageState] = useState({
    activeTab: 'upcoming',
    loading: true
  });
  
  const [appointmentsData, setAppointmentsData] = useState({
    upcoming: [],
    completed: [],
    canceled: []
  });
  
  // Modal state - combined for related state variables
  const [modalState, setModalState] = useState({
    selectedAppointment: null,
    detailsModalVisible: false,
    rescheduleModalVisible: false
  });
  
  // Function to load all appointment types
  const loadAllAppointments = useCallback(async () => {
    setPageState(prev => ({ ...prev, loading: true }));
    try {
      // Check if user is logged in
      if (!user?.phone) {
        console.log('User not logged in, cannot fetch appointments');
        setAppointmentsData({
          upcoming: [],
          completed: [],
          canceled: []
        });
        return;
      }

      // Fetch all appointment types concurrently
      const [upcomingData, completedData, canceledData] = await Promise.all([
        AppointmentService.getAppointments('upcoming', user.phone),
        AppointmentService.getAppointments('completed', user.phone),
        AppointmentService.getAppointments('canceled', user.phone)
      ]);
      
      setAppointmentsData({
        upcoming: upcomingData,
        completed: completedData,
        canceled: canceledData
      });
    } catch (error) {
      console.error('Error loading appointments:', error);
      // Set empty data on error
      setAppointmentsData({
        upcoming: [],
        completed: [],
        canceled: []
      });
    } finally {
      setPageState(prev => ({ ...prev, loading: false }));
    }
  }, [user?.phone]);
  
  // Load appointments when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only load appointments if user is logged in
      if (user?.phone) {
        loadAllAppointments();
        
        // Listen for appointment updates
        const subscription = AppointmentEventEmitter.addListener(
          'appointmentsUpdated',
          loadAllAppointments
        );
        
        // Cleanup function
        return () => {
          subscription();
        };
      }
    }, [loadAllAppointments, user?.phone])
  );
  
  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setPageState(prev => ({ ...prev, activeTab: tab }));
  }, []);
  
  // Open appointment details modal
  const handleAppointmentPress = useCallback((appointment) => {
    setModalState({
      selectedAppointment: appointment,
      detailsModalVisible: true,
      rescheduleModalVisible: false
    });
  }, []);
  
  // Close appointment details modal
  const handleCloseDetailsModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      detailsModalVisible: false
    }));
  }, []);
  
  // Handle cancel appointment request
  const handleCancelAppointment = useCallback(async (appointmentId) => {
    try {
      // Find the appointment to cancel
      const appointmentToCancel = appointmentsData.upcoming.find(
        appt => appt.id === appointmentId
      );
      
      if (!appointmentToCancel) {
        console.error('Appointment not found:', appointmentId);
        return;
      }
      
      // Update UI optimistically
      const updatedUpcoming = appointmentsData.upcoming.filter(
        appt => appt.id !== appointmentId
      );
      
      const canceledAppointment = {
        ...appointmentToCancel,
        status: 'canceled'
      };
      
      setAppointmentsData(prevData => ({
        ...prevData,
        upcoming: updatedUpcoming,
        canceled: [...prevData.canceled, canceledAppointment]
      }));
      
      // Close modal
      setModalState(prev => ({
        ...prev,
        detailsModalVisible: false
      }));
      
      // Actually cancel the appointment in the backend
      await AppointmentService.cancelAppointment(userToken, appointmentId);
      
      // Notify other components via event
      AppointmentEventEmitter.emit('appointmentsUpdated');
    } catch (error) {
      console.error('Error canceling appointment:', error);
      // If error, reload appointments to ensure UI is correct
      loadAllAppointments();
    }
  }, [appointmentsData.upcoming, loadAllAppointments]);
  
  // Start the reschedule process from details modal
  const handleRequestReschedule = useCallback(() => {
    // First close the details modal
    setModalState(prev => ({
      ...prev,
      detailsModalVisible: false
    }));
    
    // Then open the reschedule modal after a short delay
    // This avoids modal transition issues that can cause React errors
    setTimeout(() => {
      setModalState(prev => ({
        ...prev,
        rescheduleModalVisible: true
      }));
    }, 300);
  }, []);
  
  // Handle appointment rescheduling completion
  const handleRescheduleComplete = useCallback(async (updatedAppointment) => {
    try {
      console.log('Rescheduling appointment:', updatedAppointment);
      
      // Call the service function to update the appointment
      await AppointmentService.rescheduleAppointment(
        userToken,
        updatedAppointment.id,
        updatedAppointment.date,
        updatedAppointment.time
      );
      
      // Close reschedule modal
      setModalState(prev => ({
        ...prev,
        rescheduleModalVisible: false
      }));
      
      // Reload all appointments to ensure UI is updated
      await loadAllAppointments();
      
      // Update selected appointment for consistency
      const refreshedAppointment = appointmentsData.upcoming.find(
        appt => appt.id === updatedAppointment.id
      );
      
      if (refreshedAppointment) {
        setModalState(prev => ({
          ...prev,
          selectedAppointment: refreshedAppointment
        }));
      }
      
      // Emit event for other components
      AppointmentEventEmitter.emit('appointmentsUpdated');
    } catch (error) {
      console.error('Error during reschedule:', error);
      
      // Show error message
      Alert.alert(
        'Error',
        'Failed to reschedule appointment. Please try again.',
        [{ text: 'OK' }]
      );
      
      // Reload appointments to ensure UI is in sync
      loadAllAppointments();
    }
  }, [loadAllAppointments, appointmentsData.upcoming]);
  
  // Get appointments for the active tab - memoized to prevent recalculation
  const activeAppointments = useMemo(() => {
    return appointmentsData[pageState.activeTab] || [];
  }, [appointmentsData, pageState.activeTab]);

  // Destructure state for cleaner JSX
  const { activeTab, loading } = pageState;
  const { selectedAppointment, detailsModalVisible, rescheduleModalVisible } = modalState;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryUltraLight }]}>
      <ThemedStatusBar />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Appointments</Text>
      </View>
      
      {/* Tab navigation */}
      <AppointmentTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      {/* Show message if user not logged in */}
      {!user?.phone && (
        <View style={styles.notLoggedInContainer}>
          <Text style={[styles.notLoggedInText, { color: theme.textSecondary }]}>
            Please log in to view your appointments
          </Text>
        </View>
      )}
      
      {/* Appointments list - only show if user is logged in */}
      {user?.phone && (
        <AppointmentsList 
          appointments={activeAppointments}
          loading={loading}
          onAppointmentPress={handleAppointmentPress}
          activeTab={activeTab}
        />
      )}
      
      {/* Details modal */}
      <AppointmentDetailsModal
        visible={detailsModalVisible}
        appointment={selectedAppointment}
        onClose={handleCloseDetailsModal}
        onCancel={handleCancelAppointment}
        onRequestReschedule={handleRequestReschedule}
        canCancel={selectedAppointment?.status === 'upcoming'}
      />
      
      {/* Reschedule modal - using key to force fresh instance */}
      <RescheduleAppointmentPanel
        key={`reschedule-${selectedAppointment?.id || 'none'}`}
        visible={rescheduleModalVisible}
        appointment={selectedAppointment}
        onClose={() => setModalState(prev => ({
          ...prev,
          rescheduleModalVisible: false
        }))}
        onReschedule={handleRescheduleComplete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default React.memo(AppointmentsPage);
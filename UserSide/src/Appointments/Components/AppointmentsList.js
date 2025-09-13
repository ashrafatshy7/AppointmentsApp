// src/AppointmentsPage/AppointmentsList.js

import React, { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { ScaledSheet } from "react-native-size-matters";

import AppointmentCard from './AppointmentCard';
import Colors from '../../Constants/Colors';
import { useTheme } from '../../Context/ThemeContext';

// Memoized AppointmentItem component to prevent re-renders when scrolling
const AppointmentItem = React.memo(({ appointment, onAppointmentPress, activeTab }) => (
  <AppointmentCard 
    appointment={appointment}
    onPress={() => onAppointmentPress(appointment)}
    status={activeTab}
  />
));

// EmptyState component moved inside the main component to fix hooks violation
const EmptyState = ({ activeTab, theme }) => (
  <View style={styles.emptyContainer}>
    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
      {activeTab === 'upcoming' 
        ? "You don't have any upcoming appointments." 
        : activeTab === 'completed'
          ? "You don't have any completed appointments."
          : "You don't have any canceled appointments."}
    </Text>
    {activeTab === 'upcoming' && (
      <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        Book a service to see appointments here.
      </Text>
    )}
  </View>
);

// LoadingState component moved inside the main component to fix hooks violation
const LoadingState = ({ theme }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.primary} />
    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
      Loading appointments...
    </Text>
  </View>
);

const AppointmentsList = ({ 
  appointments, 
  loading, 
  onAppointmentPress, 
  activeTab 
}) => {
  const { theme } = useTheme();
  

  
  // Optimized render function for list items with safety checks
  const renderItem = useMemo(() => (
    ({ item, index }) => {
      if (!item || !item._id) {
        console.warn('Invalid appointment item at index:', index, item);
        return null;
      }
      return (
        <AppointmentItem
          appointment={item}
          onAppointmentPress={onAppointmentPress}
          activeTab={activeTab}
        />
      );
    }
  ), [onAppointmentPress, activeTab]);

  // Memoized key extractor with null safety - using _id (MongoDB) instead of id
  const keyExtractor = React.useCallback((item, index) => {
    if (!item) return `appointment-undefined-${index}`;
    if (!item._id) return `appointment-no-id-${index}`;
    return `appointment-${item._id.toString()}`;
  }, []);

  // Loading state
  if (loading) {
    return <LoadingState theme={theme} />;
  }

  // Empty state
  if (!appointments || appointments.length === 0) {
    return <EmptyState activeTab={activeTab} theme={theme} />;
  }

  // Filter out any undefined or null items for safety
  const validAppointments = appointments.filter(item => item && item._id);
  
  // Use optimizations for FlatList to improve performance
  return (
    <FlatList
      data={validAppointments}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      initialNumToRender={8}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}
      style={styles.container}
    />
  );
};

const styles = ScaledSheet.create({
  container:{
    marginBottom: '35@s',
  },
  listContainer: {
    padding:  "15@s",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

// Export with React.memo for further performance improvements
export default React.memo(AppointmentsList);
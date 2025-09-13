// src/AppointmentsPage/AppointmentTabs.js

import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../Constants/Colors';
import { useTheme } from '../../Context/ThemeContext';

// Memoized individual tab component to prevent unnecessary re-renders
const TabButton = React.memo(({ id, label, isActive, onPress }) => {
  const { theme } = useTheme();
  
  // The onPress callback is specific to this tab
  const handlePress = useCallback(() => {
    onPress(id);
  }, [id, onPress]);

  return (
    <TouchableOpacity
      key={id}
      style={[
        styles.tab,
        { backgroundColor: isActive ? theme.primary : 'transparent' }
      ]}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Text 
        style={[
          styles.tabText,
          { color: isActive ? theme.white : theme.textSecondary }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const AppointmentTabs = ({ activeTab, onTabChange }) => {
  const { theme } = useTheme();
  
  // Define tabs once and memoize to prevent recreation on every render
  const tabs = useMemo(() => [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'canceled', label: 'Canceled' },
  ], []);

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.backgroundGray }]}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onPress={onTabChange}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    margin: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabText: {
    fontWeight: '500',
  }
});

export default React.memo(AppointmentTabs);
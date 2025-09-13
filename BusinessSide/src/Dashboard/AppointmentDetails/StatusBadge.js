// src/Dashboard/AppointmentDetails/StatusBadge.js
import React from 'react';
import { View, Text } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { useTheme } from '../../Context/ThemeContext';

const StatusBadge = ({ status }) => {
  const { theme } = useTheme();
  
  const getStatusColors = () => {
    switch (status) {
      case 'booked':
        return {
          background: theme.primaryBackground,
          text: theme.primary
        };
      case 'completed':
        return {
          background: theme.success + '20', // Success color with 20% opacity
          text: theme.success
        };
      case 'canceled':
        return {
          background: theme.danger + '20', // Danger color with 20% opacity
          text: theme.danger
        };
      default:
        return {
          background: theme.backgroundGray,
          text: theme.textLight
        };
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'booked':
        return 'Booked';
      case 'completed':
        return 'Completed';
      case 'canceled':
        return 'Canceled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const colors = getStatusColors();
  
  return (
    <View style={[
      styles.badge, 
      { backgroundColor: colors.background }
    ]}>
      <Text style={[
        styles.statusText, 
        { color: colors.text }
      ]}>
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = ScaledSheet.create({
  badge: {
    paddingHorizontal: '10@s',
    paddingVertical: '4@vs',
    borderRadius: '12@s',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: '12@s',
    fontWeight: '600',
  },
});

export default StatusBadge;

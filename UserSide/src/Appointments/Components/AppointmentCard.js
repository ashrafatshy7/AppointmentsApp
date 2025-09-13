// src/AppointmentsPage/AppointmentCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../Constants/Colors';
import { useTheme } from '../../Context/ThemeContext';

const AppointmentCard = ({ appointment, onPress, status }) => {
  const { theme } = useTheme();

  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status color based on appointment status
  const getStatusColor = () => {
    switch (status) {
      case 'upcoming':
        return theme.success;  // Green
      case 'completed':
        return theme.info;  // Blue
      case 'canceled':
        return theme.danger;  // Red
      default:
        return theme.textLight;  // Grey
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, {
        backgroundColor: theme.background,
        shadowColor: theme.black
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.businessInfo}>
          <Image source={appointment.businessImage} style={styles.businessImage} />
          <Text style={[styles.businessName, { color: theme.textPrimary }]}>
            {appointment.businessName}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={[styles.statusText, { color: theme.white }]}>
            {status === 'upcoming' ? 'Upcoming' : 
             status === 'completed' ? 'Completed' : 'Canceled'}
          </Text>
        </View>
      </View>

      <View style={[styles.serviceInfo, { borderBottomColor: theme.border }]}>
        <Text style={[styles.serviceName, { color: theme.textPrimary }]}>
          {appointment.serviceName}
        </Text>
        <Text style={[styles.servicePrice, { color: theme.primary }]}>
          {appointment.price}
        </Text>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailItem}>
          <FontAwesome5 name="calendar-alt" size={14} color={theme.textLight} style={styles.icon} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {formatDate(appointment.date)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <FontAwesome5 name="clock" size={14} color={theme.textLight} style={styles.icon} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {appointment.time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  serviceName: {
    fontSize: 15,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
  },
});

export default AppointmentCard;
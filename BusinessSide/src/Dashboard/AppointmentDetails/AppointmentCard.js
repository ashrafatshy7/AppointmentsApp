// src/Dashboard/AppointmentDetails/AppointmentCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import StatusBadge from './StatusBadge';

const AppointmentCard = ({ appointment, onPress }) => {
  const { theme } = useTheme();
  
  // Format time from appointment time field
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // timeString is already in HH:mm format from server
    return timeString;
  };
  
  // Get initials from customer name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name
      .split(' ')
      .map(n => n && n[0] ? n[0] : '')
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { 
          backgroundColor: theme.background,
          borderColor: theme.border,
          shadowColor: theme.black
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.mainContent}>
        {/* Left: Time and Duration */}
        <View style={styles.timeSection}>
          <Text style={[styles.time, { color: theme.primary }]}>
            {formatTime(appointment.time)}
          </Text>
          <Text style={[styles.duration, { color: theme.textLight }]}>
            {appointment.durationMinutes || 0}m
          </Text>
        </View>
        
        {/* Center: Customer and Service Info */}
        <View style={styles.infoSection}>
          <View style={styles.customerRow}>
            {appointment.customerImage ? (
              <Image 
                source={{ uri: appointment.customerImage }}
                style={styles.customerImage}
              />
            ) : (
              <View style={[
                styles.initialsContainer, 
                { backgroundColor: theme.primaryBackground }
              ]}>
                <Text style={[styles.initials, { color: theme.primary }]}>
                  {getInitials(appointment.user?.name)}
                </Text>
              </View>
            )}
            
            <View style={styles.textInfo}>
              <Text style={[styles.customerName, { color: theme.textPrimary }]} numberOfLines={1}>
                {appointment.user?.name || 'Unknown Customer'}
              </Text>
              <Text style={[styles.serviceName, { color: theme.textSecondary }]} numberOfLines={1}>
                {appointment.service?.name || 'Unknown Service'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Right: Status and Actions */}
        <View style={styles.rightSection}>
          <StatusBadge status={appointment.status} />
          <View style={styles.compactActions}>
            <TouchableOpacity style={styles.compactActionButton}>
              <FontAwesome5 name="comment" size={12} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.compactActionButton}>
              <FontAwesome5 name="calendar-alt" size={12} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  card: {
    borderRadius: '8@s',
    borderWidth: 1,
    shadowOffset: { width: 0, height: '1@s' },
    shadowOpacity: 0.08,
    shadowRadius: '2@s',
    elevation: 1,
    paddingVertical: '12@vs',
    paddingHorizontal: '12@s',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSection: {
    width: '60@s',
    alignItems: 'center',
  },
  time: {
    fontSize: '16@s',
    fontWeight: '700',
    lineHeight: '18@s',
  },
  duration: {
    fontSize: '11@s',
    marginTop: '2@vs',
    fontWeight: '500',
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: '12@s',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerImage: {
    width: '32@s',
    height: '32@s',
    borderRadius: '16@s',
    marginRight: '8@s',
  },
  initialsContainer: {
    width: '32@s',
    height: '32@s',
    borderRadius: '16@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '8@s',
  },
  initials: {
    fontSize: '14@s',
    fontWeight: 'bold',
  },
  textInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: '14@s',
    fontWeight: '600',
    lineHeight: '16@s',
  },
  serviceName: {
    fontSize: '12@s',
    marginTop: '1@vs',
    lineHeight: '14@s',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: '32@s',
  },
  compactActions: {
    flexDirection: 'row',
    marginTop: '4@vs',
  },
  compactActionButton: {
    width: '24@s',
    height: '24@s',
    borderRadius: '12@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '6@s',
  },
});

export default AppointmentCard;

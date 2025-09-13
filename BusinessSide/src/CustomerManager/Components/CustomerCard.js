// src/CustomerManager/Components/CustomerCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const CustomerCard = ({ 
  customer, 
  onPress, 
  onEdit, 
  onDelete, 
  showActions = true,
  appointmentCount = 0 
}) => {
  const { theme } = useTheme();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatLastVisit = (lastAppointmentDate) => {
    if (!lastAppointmentDate) return 'Never';
    
    const date = new Date(lastAppointmentDate);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const getTotalAppointments = () => {
    if (customer.appointmentCount !== undefined) {
      return customer.appointmentCount;
    }
    return appointmentCount || 0;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Avatar and Main Info */}
        <View style={styles.leftSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryBackground }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {getInitials(customer.name)}
            </Text>
          </View>
          
          <View style={styles.customerInfo}>
            <Text style={[styles.customerName, { color: theme.textPrimary }]}>
              {customer.name || 'Unknown Name'}
            </Text>
            <Text style={[styles.customerPhone, { color: theme.textSecondary }]}>
              {formatPhoneNumber(customer.phone)}
            </Text>
            {customer.email && (
              <Text style={[styles.customerEmail, { color: theme.textSecondary }]}>
                {customer.email}
              </Text>
            )}
          </View>
        </View>

        {/* Stats and Actions */}
        <View style={styles.rightSection}>
          {/* Appointment Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {getTotalAppointments()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textLight }]}>
                Visits
              </Text>
            </View>
            
            <Text style={[styles.lastVisit, { color: theme.textLight }]}>
              Last: {formatLastVisit(customer.lastAppointmentDate)}
            </Text>
          </View>

          {/* Action Buttons */}
          {showActions && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primaryBackground }]}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit?.(customer);
                }}
              >
                <FontAwesome5 name="edit" size={12} color={theme.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FEEEEE' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete?.(customer);
                }}
              >
                <FontAwesome5 name="trash" size={12} color={theme.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Customer Notes Preview */}
      {customer.notes && (
        <View style={[styles.notesContainer, { borderTopColor: theme.borderColor }]}>
          <Text style={[styles.notesText, { color: theme.textSecondary }]} numberOfLines={2}>
            <FontAwesome5 name="sticky-note" size={12} color={theme.textLight} /> {customer.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  card: {
    marginHorizontal: '16@s',
    marginVertical: '6@vs',
    borderRadius: '12@s',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    padding: '16@s',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  avatar: {
    width: '48@s',
    height: '48@s',
    borderRadius: '24@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
  },
  avatarText: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: '16@s',
    fontFamily: 'Inter-SemiBold',
    marginBottom: '4@s',
  },
  customerPhone: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
    marginBottom: '2@s',
  },
  customerEmail: {
    fontSize: '13@s',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: '48@s',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  statNumber: {
    fontSize: '16@s',
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: '11@s',
    fontFamily: 'Inter-Regular',
  },
  lastVisit: {
    fontSize: '10@s',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: '8@s',
  },
  actionButton: {
    width: '28@s',
    height: '28@s',
    borderRadius: '14@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesContainer: {
    borderTopWidth: 1,
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
  },
  notesText: {
    fontSize: '12@s',
    fontFamily: 'Inter-Regular',
    lineHeight: '16@s',
  },
});

export default CustomerCard;
// src/Dashboard/Components/QuickActions.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../Constants/Colors';

const QuickActionButton = ({ title, icon, color, theme, onPress, disabled, comingSoon }) => (
  <View style={styles.quickActionContainer}>
    <TouchableOpacity 
      style={[
        styles.quickActionButton, 
        { backgroundColor: theme.background },
        disabled && { opacity: 0.6 }
      ]}
      onPress={disabled ? null : onPress}
      disabled={disabled}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: `${color}15` }]}>
        <FontAwesome5 name={icon} size={14} color={color} />
      </View>
      <Text 
        style={[styles.actionTitle, { color: theme.textPrimary, fontFamily: 'Inter-Medium' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>
    </TouchableOpacity>
    
    {comingSoon && (
      <View style={styles.comingSoonOverlay}>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
      </View>
    )}
  </View>
);

const QuickActions = ({ theme, navigation }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: 'Poppins-SemiBold' }]}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <QuickActionButton 
          title="Add Appointment" 
          icon="calendar-plus" 
          color={Colors.primary}
          theme={theme}
          onPress={() => navigation.navigate('AddAppointment')}
        />
        <QuickActionButton 
          title="Manage Services" 
          icon="plus-circle" 
          color={Colors.success}
          theme={theme}
          onPress={() => navigation.navigate('ServicesSetup')}
        />
        <QuickActionButton 
          title="Manage Hours" 
          icon="clock" 
          color={Colors.warning}
          theme={theme}
          onPress={() => navigation.navigate('ManageHours')}
        />
        <QuickActionButton 
          title="Manage Customers" 
          icon="users" 
          color={Colors.info}
          theme={theme}
          onPress={() => navigation.navigate('CustomerManagement')}
        />
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  sectionContainer: {
    padding: '18@s',
    marginBottom: '10@s',
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: '16@s',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '10@s',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionContainer: {
    width: '48%',
    position: 'relative',
  },
  quickActionButton: {
    width: '100%',
    height: '100@s',
    padding: '18@s',
    borderRadius: '12@s',
    marginBottom: '10@s',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 3,
  },
  actionIconContainer: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10@s',
  },
  actionTitle: {
    fontSize: '13@s',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: '6@vs',
    right: '6@s',
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    paddingHorizontal: '6@s',
    paddingVertical: '3@vs',
    borderRadius: '6@s',
    zIndex: 1,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: '9@s',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default QuickActions;

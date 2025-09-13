// src/Dashboard/Components/StatCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';

const StatCard = ({ title, value, icon, color, theme, onPress }) => (
  <TouchableOpacity 
    style={[styles.statCard, { backgroundColor: theme.background }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
      <FontAwesome5 name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.statValue, { color: theme.textPrimary, fontFamily: 'Inter-Bold' }]} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    <Text style={[styles.statTitle, { color: theme.textSecondary, fontFamily: 'Inter-Medium' }]} numberOfLines={2}>
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = ScaledSheet.create({
  statCard: {
    width: '30%',
    padding: '15@s',
    borderRadius: '12@s',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 3,
  },
  statIconContainer: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8@s',
  },
  statValue: {
    fontSize: '24@s',
    fontFamily: 'Inter-Bold',
    marginBottom: '4@s',
    textAlign: 'center',
  },
  statTitle: {
    fontSize: '12@s',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default StatCard;
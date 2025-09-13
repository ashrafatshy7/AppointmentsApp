// src/BusinessProfile/Components/BusinessInfoCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const BusinessInfoCard = ({ title, value, icon, onPress }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { 
          backgroundColor: theme.backgroundLight,
          shadowColor: theme.black
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.primaryBackground }]}>
        <FontAwesome5 name={icon} size={18} color={theme.primary} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>
          {title}
        </Text>
        <Text style={[styles.value, { color: theme.textPrimary }]} numberOfLines={1}>
          {value || 'Not set'}
        </Text>
      </View>
      
      {onPress && (
        <FontAwesome5 name="chevron-right" size={16} color={theme.textLight} />
      )}
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@s',
    borderRadius: '12@s',
    marginBottom: '12@vs',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  iconContainer: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '16@s',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: '14@s',
    marginBottom: '4@vs',
  },
  value: {
    fontSize: '16@s',
    fontWeight: '500',
  },
});

export default BusinessInfoCard;

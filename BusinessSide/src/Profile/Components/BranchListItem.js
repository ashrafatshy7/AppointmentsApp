// src/BusinessProfile/Components/BranchListItem.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const BranchListItem = ({ branch, isActive, onPress, onEdit }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.container, 
        { 
          backgroundColor: theme.background,
          borderColor: isActive ? theme.primary : theme.border,
          shadowColor: theme.black
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: isActive ? theme.primaryBackground : theme.backgroundLight 
          }
        ]}>
          <FontAwesome5 
            name="building" 
            size={20} 
            color={isActive ? theme.primary : theme.textLight} 
          />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <Text style={[
              styles.branchName, 
              { 
                color: theme.textPrimary,
                fontWeight: isActive ? 'bold' : '600'
              }
            ]}>
              {branch.name}
            </Text>
            
            {isActive && (
              <View style={[styles.activeBadge, { backgroundColor: theme.primaryBackground }]}>
                <Text style={[styles.activeBadgeText, { color: theme.primary }]}>
                  Active
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.branchAddress, { color: theme.textSecondary }]}>
            {branch.address}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.backgroundLight }]}
        onPress={onEdit}
      >
        <FontAwesome5 name="edit" size={16} color={theme.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16@s',
    marginBottom: '16@vs',
    borderRadius: '12@s',
    borderWidth: 1,
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: '44@s',
    height: '44@s',
    borderRadius: '22@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '16@s',
  },
  infoContainer: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  branchName: {
    fontSize: '16@s',
    marginRight: '8@s',
  },
  activeBadge: {
    paddingHorizontal: '8@s',
    paddingVertical: '2@vs',
    borderRadius: '4@s',
  },
  activeBadgeText: {
    fontSize: '12@s',
    fontWeight: '600',
  },
  branchAddress: {
    fontSize: '14@s',
  },
  editButton: {
    padding: '10@s',
    borderRadius: '8@s',
  },
});

export default BranchListItem;

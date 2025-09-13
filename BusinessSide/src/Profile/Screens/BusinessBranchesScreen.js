// src/BusinessProfile/Screens/BusinessBranchesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import BranchListItem from '../Components/BranchListItem';

const BusinessBranchesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { getBusinessBranches, activeBranch, changeActiveBranch } = useBusiness();
  
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchesData = await getBusinessBranches();
        setBranches(branchesData);
      } catch (error) {
        console.error('Error loading branches:', error);
        Alert.alert('Error', 'Failed to load business branches. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBranches();
  }, [getBusinessBranches]);
  
  // Handle branch selection
  const handleBranchSelect = (branch) => {
    changeActiveBranch(branch);
    Alert.alert(
      'Branch Selected',
      `"${branch.name}" is now your active branch.`,
      [{ text: 'OK' }]
    );
  };
  
  // Render branch item
  const renderBranchItem = ({ item }) => (
    <BranchListItem
      branch={item}
      isActive={activeBranch && activeBranch.id === item.id}
      onPress={() => handleBranchSelect(item)}
      onEdit={() => navigation.navigate('BranchDetails', { branchId: item.id })}
    />
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="building" size={60} color={theme.textLight} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        No branches added
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Add your first branch location to manage multiple business locations
      </Text>
    </View>
  );
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading branches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Business Branches
          </Text>
        </View>
        
        <View style={styles.infoContainer}>
          <FontAwesome5 name="info-circle" size={18} color={theme.primary} style={styles.infoIcon} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Manage multiple locations for your business. Customers can book appointments at any of your branches.
          </Text>
        </View>
        
        <FlatList
          data={branches}
          renderItem={renderBranchItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.branchesList}
          ListEmptyComponent={renderEmptyState}
        />
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddBranch')}
        >
          <FontAwesome5 name="plus" size={16} color={theme.white} style={styles.addButtonIcon} />
          <Text style={[styles.addButtonText, { color: theme.white }]}>
            Add New Branch
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '16@s',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: '16@s',
    padding: '4@s',
  },
  headerTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: '16@s',
    backgroundColor: '#E8F5E9',
    margin: '16@s',
    borderRadius: '8@s',
  },
  infoIcon: {
    marginRight: '10@s',
    marginTop: '2@vs',
  },
  infoText: {
    flex: 1,
    fontSize: '14@s',
    lineHeight: '20@s',
  },
  branchesList: {
    padding: '16@s',
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '60@vs',
  },
  emptyTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    marginTop: '16@vs',
    marginBottom: '8@vs',
  },
  emptySubtitle: {
    fontSize: '16@s',
    textAlign: 'center',
    marginBottom: '24@vs',
    paddingHorizontal: '32@s',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '16@s',
    padding: '16@s',
    borderRadius: '8@s',
  },
  addButtonIcon: {
    marginRight: '8@s',
  },
  addButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
});

export default BusinessBranchesScreen;

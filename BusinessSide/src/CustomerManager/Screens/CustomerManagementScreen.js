// src/CustomerManager/Screens/CustomerManagementScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

import CustomerCard from '../Components/CustomerCard';
import CustomerSearchBar from '../Components/CustomerSearchBar';
import CustomerService from '../Service/CustomerService';

const CustomerManagementScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load customers on screen focus
  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customersData = await CustomerService.getAllCustomers();
      
      if (customersData && Array.isArray(customersData)) {
        setCustomers(customersData);
        setFilteredCustomers(customersData);
      } else {
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'Failed to load customers. Please try again.');
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };


  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadCustomers();
    setIsRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query || query.trim().length === 0) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer => {
      const lowerQuery = query.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(lowerQuery) ||
        customer.phone?.includes(query) ||
        customer.email?.toLowerCase().includes(lowerQuery)
      );
    });
    
    setFilteredCustomers(filtered);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredCustomers(customers);
  };

  const handleCustomerPress = (customer) => {
    navigation.navigate('CustomerDetails', { 
      customerId: customer._id,
      customer: customer 
    });
  };

  const handleEditCustomer = (customer) => {
    navigation.navigate('AddCustomer', { 
      customer: customer,
      isEditing: true 
    });
  };

  const handleDeleteCustomer = (customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteCustomer(customer),
        },
      ]
    );
  };

  const confirmDeleteCustomer = async (customer) => {
    try {
      await CustomerService.deleteCustomer(customer._id);
      
      // Remove from local state
      const updatedCustomers = customers.filter(c => c._id !== customer._id);
      setCustomers(updatedCustomers);
      setFilteredCustomers(updatedCustomers.filter(c => 
        !searchQuery || 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
      Alert.alert('Success', 'Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      Alert.alert('Error', 'Failed to delete customer. Please try again.');
    }
  };

  const handleAddCustomer = () => {
    Alert.alert(
      'Add Customers', 
      'Customers are added automatically when you create appointments. Go to Dashboard → Add Appointment to book for new customers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Appointment', onPress: () => navigation.navigate('AddAppointment') }
      ]
    );
  };

  const renderCustomerItem = ({ item }) => (
    <CustomerCard
      customer={item}
      appointmentCount={item.appointmentCount || 0}
      onPress={() => handleCustomerPress(item)}
      onEdit={() => handleEditCustomer(item)}
      onDelete={() => handleDeleteCustomer(item)}
      showActions={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="calendar-check" size={60} color={theme.textLight} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {searchQuery ? 'No customers found' : 'No customers yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Customers appear here automatically when you create appointments for them'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={[styles.emptyActionButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddAppointment')}
        >
          <FontAwesome5 name="calendar-plus" size={16} color={theme.white} />
          <Text style={[styles.emptyActionText, { color: theme.white }]}>
            Create Appointment
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.customerCount, { color: theme.textSecondary }]}>
        {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
        {searchQuery && ` matching "${searchQuery}"`}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading customers...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Customers
          </Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <CustomerSearchBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
          placeholder="Search by name, phone, or email..."
        />

        {/* Customer List */}
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item._id || item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filteredCustomers.length === 0 ? styles.emptyListContainer : null}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '12@s',
    paddingVertical: '10@vs',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: '6@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: '12@s',
  },
  headerSpacer: {
    width: '30@s',
    height: '30@s',
  },
  headerContainer: {
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
  },
  customerCount: {
    fontSize: '12@s',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: '14@s',
    marginTop: '12@vs',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '24@s',
  },
  emptyTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    marginTop: '20@vs',
    marginBottom: '6@vs',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: '14@s',
    textAlign: 'center',
    marginBottom: '24@vs',
    lineHeight: '20@s',
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '20@s',
    paddingVertical: '10@vs',
    borderRadius: '6@s',
    gap: '6@s',
  },
  emptyActionText: {
    fontSize: '14@s',
    fontWeight: '600',
  },
});

export default CustomerManagementScreen;
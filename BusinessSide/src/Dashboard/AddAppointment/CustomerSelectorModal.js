// src/Dashboard/AddAppointment/CustomerSelectorModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import ApiService from '../Service/ApiService';

const RECENT_CUSTOMERS_KEY = 'recent_customers';
const MIN_DIGITS_FOR_NORMALIZATION = 4; // Start normalizing after 4 digits

const CustomerSelectorModal = ({ visible, onClose, onCustomerSelect, theme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [filteredRecent, setFilteredRecent] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [apiSearchResult, setApiSearchResult] = useState(null);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [contactsPermission, setContactsPermission] = useState(false);

  // Phone number normalization helper
  const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  // Count digits in a string
  const countDigits = (str) => {
    return (str.match(/\d/g) || []).length;
  };

  // Check if we should start normalizing (at least 4 digits)
  const shouldNormalize = (query) => {
    const digitCount = countDigits(query);
    return digitCount >= MIN_DIGITS_FOR_NORMALIZATION;
  };

  // Check if query looks like a complete phone number for API search
  const looksLikeCompletePhoneNumber = (query) => {
    const digits = normalizePhoneNumber(query);
    
    // Israeli phone patterns:
    // 0512345678 (10 digits starting with 0)
    // 972512345678 (12 digits starting with 972)  
    // +972512345678 (with + prefix)
    
    if (digits.startsWith('972') && digits.length >= 12) return true;
    if (digits.startsWith('0') && digits.length >= 10) return true;
    if (!digits.startsWith('972') && !digits.startsWith('0') && digits.length >= 9) return true;
    
    return false;
  };

  // Generate phone search variants (only when normalizing)
  const getPhoneSearchVariants = (phone) => {
    const digits = normalizePhoneNumber(phone);
    const variants = new Set([digits]);
    
    if (digits.startsWith('972') && digits.length >= 12) {
      variants.add('0' + digits.substring(3));
    }
    
    if (digits.startsWith('0') && digits.length >= 10) {
      variants.add('972' + digits.substring(1));
    }
    
    if (!digits.startsWith('972') && !digits.startsWith('0') && digits.length >= 9) {
      variants.add('972' + digits);
      variants.add('0' + digits);
    }
    
    return Array.from(variants);
  };

  // Check if phone numbers match - uses normalization only if shouldNormalize
  const phonesMatch = (phone1, phone2) => {
    // Simple exact match first
    if (phone1 === phone2) return true;
    
    // If we should normalize, use variants
    if (shouldNormalize(phone1) && shouldNormalize(phone2)) {
      const variants1 = getPhoneSearchVariants(phone1);
      const variants2 = getPhoneSearchVariants(phone2);
      return variants1.some(v1 => variants2.some(v2 => v1 === v2));
    }
    
    // Otherwise, just check if one starts with the other
    const digits1 = normalizePhoneNumber(phone1);
    const digits2 = normalizePhoneNumber(phone2);
    
    return digits1.startsWith(digits2) || digits2.startsWith(digits1);
  };

  // Check if phone starts with query - simple partial matching
  const phoneStartsWith = (phone, query) => {
    const phoneDigits = normalizePhoneNumber(phone);
    const queryDigits = normalizePhoneNumber(query);
    
    if (!queryDigits) return false;
    
    // If we should normalize, try variants
    if (shouldNormalize(query)) {
      const phoneVariants = getPhoneSearchVariants(phone);
      return phoneVariants.some(variant => variant.startsWith(queryDigits));
    }
    
    // Otherwise simple prefix match
    return phoneDigits.startsWith(queryDigits);
  };

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      loadRecentCustomers();
      requestContactsPermission();
      setSearchQuery(''); // Reset search when opening
    }
  }, [visible]);

  // Handle search logic when query changes
  useEffect(() => {
    if (!visible) return;



    if (searchQuery.trim() === '') {
      setFilteredRecent([]);
      setFilteredContacts([]);
      setApiSearchResult(null);
      setIsSearchingApi(false);
      return;
    }


    handleLocalSearch();

    // Only search API if:
    // 1. We have 4+ digits (shouldNormalize)
    // 2. Query looks like a complete phone number
    // 3. No local results found
    if (shouldNormalize(searchQuery) && looksLikeCompletePhoneNumber(searchQuery)) {
      handleApiSearchIfNeeded();
    } else {
      setApiSearchResult(null);
      setIsSearchingApi(false);
    }
  }, [searchQuery, recentCustomers, contacts, visible]);

  const handleLocalSearch = () => {
    const recentResults = filterRecentCustomers(searchQuery, recentCustomers);
    setFilteredRecent(recentResults);
    
    const contactResults = filterContacts(searchQuery, contacts, contactsPermission);
    setFilteredContacts(contactResults);
  };

  const handleApiSearchIfNeeded = () => {
    const hasLocalResults = filteredRecent.length > 0 || filteredContacts.length > 0;
    
    if (!hasLocalResults) {
      searchApiIfNeeded(searchQuery);
    } else {
      setApiSearchResult(null);
      setIsSearchingApi(false);
    }
  };

  const loadRecentCustomers = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_CUSTOMERS_KEY);
      if (stored) {
        const recent = JSON.parse(stored);
        setRecentCustomers(recent);
      }
    } catch (error) {
      console.error('Error loading recent customers:', error);
    }
  };

  const saveRecentCustomer = async (customer) => {
    try {
      const updated = [customer, ...recentCustomers.filter(c => 
        !phonesMatch(c.phone, customer.phone)
      )].slice(0, 10);
      
      await AsyncStorage.setItem(RECENT_CUSTOMERS_KEY, JSON.stringify(updated));
      setRecentCustomers(updated);
    } catch (error) {
      console.error('Error saving recent customer:', error);
    }
  };

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        setContactsPermission(true);
        loadContacts();
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const formattedContacts = data
          .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .map(contact => {
            const phoneNumber = contact.phoneNumbers[0]?.number || '';
            const normalized = normalizePhoneNumber(phoneNumber);
            return {
              id: contact.id,
              name: contact.name || '',
              phone: normalized,
              originalPhone: phoneNumber,
              type: 'contact'
            };
          })
          .filter(contact => contact.name && contact.phone);
        
        setContacts(formattedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const filterRecentCustomers = (query, customers) => {
    const lowerQuery = query.toLowerCase();
    
    return customers.filter(customer => {
      // Name search (always works)
      if (customer.name?.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Phone search
      if (customer.phone) {
        // Use smart phone matching based on normalization threshold
        return phonesMatch(query, customer.phone);
      }
      
      return false;
    });
  };

  const filterContacts = (query, contactsList, hasPermission) => {
    if (!hasPermission || !query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    
    return contactsList.filter(contact => {
      // Name search (always works)
      if (contact.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Phone search
      if (contact.phone) {
        // Use smart phone matching based on normalization threshold
        return phonesMatch(query, contact.phone);
      }
      
      return false;
    }).slice(0, 5);
  };

  const searchApiIfNeeded = async (query) => {
    setIsSearchingApi(true);
    setApiSearchResult(null);
    
    try {
      
      let results = await ApiService.searchClients(query);
      
      // If no results, try normalized variants
      if ((!results || results.length === 0)) {
        const phoneVariants = getPhoneSearchVariants(query);
        
        for (const variant of phoneVariants) {
          if (variant !== normalizePhoneNumber(query)) {
            try {
              const variantResults = await ApiService.searchClients(variant);
              if (variantResults && variantResults.length > 0) {
                results = variantResults;
                break;
              }
            } catch (error) {
              console.log("Search failed:", error.message);
            }
          }
        }
      }
      
      if (results && results.length > 0) {
        setApiSearchResult({
          ...results[0],
          type: 'api_user'
        });
      } else {
        setApiSearchResult(null);
      }
    } catch (error) {
      setApiSearchResult(null);
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    if (customer.type === 'manual' || customer.type === 'contact') {
      const customerToSave = {
        ...customer,
        phone: customer.phone || normalizePhoneNumber(customer.originalPhone || ''),
        type: customer.type === 'contact' ? 'recent' : 'manual'
      };
      saveRecentCustomer(customerToSave);
    }
    
    onCustomerSelect(customer);
    onClose();
  };

  const createManualCustomer = () => {
    const customer = {
      id: `manual_${Date.now()}`,
      name: searchQuery,
      phone: shouldNormalize(searchQuery) ? normalizePhoneNumber(searchQuery) : '',
      type: 'manual'
    };
    handleCustomerSelect(customer);
  };

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.customerItem, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      onPress={() => handleCustomerSelect(item)}
    >
      <View style={styles.customerInfo}>
        <View style={[
          styles.customerAvatar,
          { backgroundColor: getAvatarColor(item.type, theme) }
        ]}>
          <FontAwesome5 
            name={getAvatarIcon(item.type)} 
            size={16} 
            color={getAvatarIconColor(item.type, theme)} 
          />
        </View>
        
        <View style={styles.customerDetails}>
          <Text style={[styles.customerName, { color: theme.textPrimary }]}>
            {item.name || item.originalPhone || item.phone}
          </Text>
          {item.phone && item.name && (
            <Text style={[styles.customerPhone, { color: theme.textSecondary }]}>
              {item.originalPhone || item.phone}
            </Text>
          )}
        </View>
        
        {item.type === 'api_user' && (
          <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
            <FontAwesome5 name="check" size={10} color={theme.white} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const getAvatarColor = (type, theme) => {
    switch (type) {
      case 'api_user': return theme.success + '20';
      case 'contact': return theme.info + '20';
      case 'recent':
      case 'manual': return theme.primary + '20';
      default: return theme.backgroundGray;
    }
  };

  const getAvatarIcon = (type) => {
    switch (type) {
      case 'api_user': return 'user-check';
      case 'contact': return 'address-book';
      case 'recent':
      case 'manual': return 'user';
      default: return 'user';
    }
  };

  const getAvatarIconColor = (type, theme) => {
    switch (type) {
      case 'api_user': return theme.success;
      case 'contact': return theme.info;
      case 'recent':
      case 'manual': return theme.primary;
      default: return theme.textLight;
    }
  };

  const currentDigitCount = countDigits(searchQuery);
  const hasSearchQuery = searchQuery.trim().length > 0;
  const showNormalizationHint = hasSearchQuery && !shouldNormalize(searchQuery);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Select Customer
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={[styles.searchContainer, { backgroundColor: theme.backgroundLight }]}>
              <FontAwesome5 name="search" size={16} color={theme.textLight} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search by name or phone number"
                placeholderTextColor={theme.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <FontAwesome5 name="times-circle" size={16} color={theme.textLight} />
                </TouchableOpacity>
              )}
            </View>

            {/* Normalization hint */}
            {showNormalizationHint && (
              <View style={[styles.hintContainer, { backgroundColor: theme.backgroundLight }]}>
                <FontAwesome5 name="info-circle" size={12} color={theme.info} style={styles.hintIcon} />
                <Text style={[styles.hintText, { color: theme.info }]}>
                  Type {MIN_DIGITS_FOR_NORMALIZATION} digits for smart phone search ({currentDigitCount}/{MIN_DIGITS_FOR_NORMALIZATION})
                </Text>
              </View>
            )}
          </View>

          {/* Results */}
          <View style={styles.resultsSection}>
            {hasSearchQuery ? (
              <View style={styles.searchResults}>
                {/* Recent Customers */}
                {filteredRecent.length > 0 && (
                  <View>
                    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                      Recent
                    </Text>
                    <FlatList
                      data={filteredRecent}
                      renderItem={renderCustomerItem}
                      keyExtractor={item => `recent_${item.phone || item.id}`}
                      scrollEnabled={true}
                    />
                  </View>
                )}

                {/* Contacts */}
                {filteredContacts.length > 0 && (
                  <View>
                    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                      Contacts
                    </Text>
                    <FlatList
                      data={filteredContacts}
                      renderItem={renderCustomerItem}
                      keyExtractor={item => `contact_${item.id}`}
                      scrollEnabled={true}
                    />
                  </View>
                )}

                {/* API Search Result */}
                {apiSearchResult && (
                  <View>
                    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                      App Users
                    </Text>
                    <FlatList
                      data={[apiSearchResult]}
                      renderItem={renderCustomerItem}
                      keyExtractor={item => `api_${item.id}`}
                      scrollEnabled={false}
                    />
                  </View>
                )}

                {/* Loading API Search */}
                {isSearchingApi && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                      Searching app users...
                    </Text>
                  </View>
                )}

                {/* Manual Entry Option */}
                <TouchableOpacity
                  style={[styles.manualOption, { backgroundColor: theme.backgroundLight }]}
                  onPress={createManualCustomer}
                >
                  <FontAwesome5 name="plus-circle" size={16} color={theme.primary} style={styles.manualIcon} />
                  <Text style={[styles.manualText, { color: theme.primary }]}>
                    Select "{searchQuery}"
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Show recent customers when not searching
              <View style={styles.recentSection}>
                {recentCustomers.length > 0 ? (
                  <>
                    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                      Recent Customers
                    </Text>
                    <FlatList
                      data={recentCustomers.slice(0, 10)}
                      renderItem={renderCustomerItem}
                      keyExtractor={item => `recent_${item.phone || item.id}`}
                      showsVerticalScrollIndicator={true}
                    />
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <FontAwesome5 name="users" size={40} color={theme.textLight} />
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                      No recent customers
                    </Text>
                    <Text style={[styles.emptyStateSubtext, { color: theme.textLight }]}>
                      Start typing to search or add a new customer
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  modalContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: '4@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
  },
  placeholder: {
    width: '28@s',
  },
  searchSection: {
    padding: '16@s',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '12@s',
    borderRadius: '10@s',
  },
  searchIcon: {
    marginRight: '10@s',
  },
  searchInput: {
    flex: 1,
    fontSize: '16@s',
    padding: '0@s',
  },
  clearButton: {
    padding: '4@s',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '8@s',
    borderRadius: '6@s',
    marginTop: '8@vs',
  },
  hintIcon: {
    marginRight: '6@s',
  },
  hintText: {
    fontSize: '12@s',
    fontStyle: 'italic',
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: '16@s',
  },
  searchResults: {
    flex: 1,
  },
  recentSection: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: '14@s',
    fontWeight: '600',
    paddingVertical: '8@vs',
    paddingHorizontal: '4@s',
  },
  customerItem: {
    padding: '12@s',
    borderBottomWidth: 1,
    borderRadius: '8@s',
    marginBottom: '4@vs',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@s',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  customerPhone: {
    fontSize: '14@s',
    marginTop: '2@vs',
  },
  verifiedBadge: {
    width: '20@s',
    height: '20@s',
    borderRadius: '10@s',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16@s',
  },
  loadingText: {
    marginLeft: '8@s',
    fontSize: '14@s',
  },
  manualOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '12@s',
    marginTop: '8@vs',
    borderRadius: '8@s',
  },
  manualIcon: {
    marginRight: '8@s',
  },
  manualText: {
    fontSize: '16@s',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '40@vs',
  },
  emptyStateText: {
    fontSize: '18@s',
    fontWeight: '600',
    marginTop: '16@vs',
  },
  emptyStateSubtext: {
    fontSize: '14@s',
    marginTop: '8@vs',
    textAlign: 'center',
  },
});

export default CustomerSelectorModal;
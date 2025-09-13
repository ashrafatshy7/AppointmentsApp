// src/Dashboard/Screens/AppointmentsManagementScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import { 
  getBusinessAppointments, 
  getAppointmentsByDateRange,
  updateAppointmentStatus,
  getAllAppointments,
  clearAppointmentsCache
} from '../Service/AppointmentService';

const AppointmentsManagementScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { activeBusiness, refreshBusinessData } = useBusiness();
  
  // State
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, today, upcoming, completed, canceled
  const [selectedView, setSelectedView] = useState('list'); // list, calendar
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState('all'); // all, week, month, custom
  
  // Filter options
  const filterOptions = [
    { key: 'all', label: 'All Appointments', icon: 'list' },
    { key: 'today', label: 'Today', icon: 'calendar-day' },
    { key: 'upcoming', label: 'Upcoming', icon: 'clock' },
    { key: 'completed', label: 'Completed', icon: 'check-circle' },
    { key: 'canceled', label: 'Canceled', icon: 'times-circle' }
  ];

  // View options
  const viewOptions = [
    { key: 'list', label: 'List View', icon: 'list' },
    { key: 'agenda', label: 'Agenda View', icon: 'calendar-alt' }
  ];

  // Load appointments data
  useFocusEffect(
    useCallback(() => {
      // Only load appointments if we have business data
      if (activeBusiness) {
        loadAppointments();
      }
    }, [dateRange, activeBusiness, loadAppointments])
  );

  const loadAppointments = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      let data;
      
      // Get business ID first - required for all appointment loading
      const businessId = activeBusiness?._id || activeBusiness?.id;
      if (!businessId) {
        setAppointments([]);
        setIsLoading(false);
        return;
      }
      
      if (forceRefresh) {
        clearAppointmentsCache();
      }
      
      if (dateRange === 'week') {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7);
        data = await getAppointmentsByDateRange(
          businessId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      } else if (dateRange === 'month') {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + 1);
        data = await getAppointmentsByDateRange(
          businessId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      } else {
        // For 'all' and any other case, get all appointments
        data = await getAllAppointments(businessId, forceRefresh);
      }
      
      
      // Sort by date and time
      const sortedData = (data || []).sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateA - dateB;
      });
      
      
      setAppointments(sortedData);
      applyFilters(sortedData, selectedFilter, searchQuery);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeBusiness, dateRange, selectedFilter, searchQuery]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh both business data (including profile image) and appointments data
      await Promise.all([
        refreshBusinessData(),
        loadAppointments(true) // Force refresh
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Apply filters and search
  const applyFilters = (data, filter, search) => {
    
    let filtered = [...data];
    
    // Apply status filter
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(apt => apt.date === today);
      console.log('After today filter:', filtered.length);
    } else if (filter === 'upcoming') {
      const now = new Date();
      filtered = filtered.filter(apt => {
        const aptDate = new Date(`${apt.date}T${apt.time || '00:00'}`);
        return aptDate > now && apt.status === 'booked';
      });
      console.log('After upcoming filter:', filtered.length);
    } else if (filter !== 'all') {
      filtered = filtered.filter(apt => apt.status === filter);
      console.log('After status filter:', filtered.length);
    }
    
    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(apt => 
        apt.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        apt.user?.phone?.includes(search) ||
        apt.service?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    
    setFilteredAppointments(filtered);
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(appointments, selectedFilter, query);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    applyFilters(appointments, filter, searchQuery);
    setShowFilterModal(false);
  };




  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Get appointment status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return theme.primary;
      case 'completed': return theme.success;
      case 'canceled': return theme.danger;
      case 'no-show': return theme.warning;
      default: return theme.textSecondary;
    }
  };

  // Render search bar
  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { 
      backgroundColor: theme.white + '15', 
      borderColor: searchQuery.length > 0 ? theme.white : theme.white + '30',
      shadowColor: theme.shadow || '#000' 
    }]}>
      <View style={[styles.searchIconContainer, { backgroundColor: theme.white + '20' }]}>
        <FontAwesome5 name="search" size={14} color={theme.white} />
      </View>
      <TextInput
        style={[styles.searchInput, { color: theme.white }]}
        placeholder="Search by customer name, phone, or service..."
        placeholderTextColor={theme.white + '80'}
        value={searchQuery}
        onChangeText={handleSearch}
        selectionColor={theme.primary}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity 
          style={[styles.clearButton, { backgroundColor: theme.danger }]}
          onPress={() => handleSearch('')}
        >
          <FontAwesome5 name="times" size={12} color={theme.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render filter dropdown
  const renderFilterBar = () => {
    const selectedOption = filterOptions.find(opt => opt.key === selectedFilter);
    
    return (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.simpleDropdown, { 
            backgroundColor: theme.white + '20',
            borderColor: theme.white + '40'
          }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={[styles.simpleDropdownText, { color: theme.white }]}>
            {selectedOption?.label || 'All Appointments'}
          </Text>
          <Text style={[styles.dropdownArrow, { color: theme.white }]}>▼</Text>
        </TouchableOpacity>
        
        {showFilterModal && (
          <View style={[styles.simpleDropdownList, { 
            backgroundColor: theme.white,
            borderColor: theme.border
          }]}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.simpleDropdownItem,
                  { backgroundColor: selectedFilter === option.key ? theme.primaryBackground : theme.white }
                ]}
                onPress={() => {
                  handleFilterChange(option.key);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.simpleDropdownItemText,
                  { color: selectedFilter === option.key ? theme.primary : theme.textPrimary }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render appointment item
  const renderAppointmentItem = ({ item }) => {
    const isToday = item.date === new Date().toISOString().split('T')[0];
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        style={[
          styles.appointmentCard, 
          { 
            backgroundColor: theme.background,
            borderColor: theme.borderLight 
          }
        ]}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item._id })}
      >
        <View style={styles.compactLayout}>
          {/* Left: Date, Time & Customer */}
          <View style={styles.leftSection}>
            <View style={styles.compactDateTime}>
              <Text style={[styles.appointmentDate, { 
                color: isToday ? theme.primary : theme.textPrimary 
              }]}>
                {formatDate(item.date)}
              </Text>
              <Text style={[styles.appointmentTime, { color: theme.textPrimary }]}>
                {item.time || 'No time set'}
              </Text>
            </View>
            
            <View style={styles.compactCustomerInfo}>
              <View style={[styles.customerAvatar, { backgroundColor: theme.primaryBackground }]}>
                <Text style={[styles.customerInitials, { color: theme.primary }]}>
                  {item.user?.name ? item.user.name.substring(0, 2).toUpperCase() : '??'}
                </Text>
              </View>
              
              <View style={styles.customerDetails}>
                <Text style={[styles.customerName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.user?.name || 'Unknown Customer'}
                </Text>
                <Text style={[styles.customerPhone, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.user?.phone || 'No phone'}
                </Text>
              </View>
            </View>
            
            <View style={styles.serviceDetails}>
              <Text style={[styles.serviceName, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.service?.name || 'Unknown Service'}
              </Text>
              <Text style={[styles.serviceDuration, { color: theme.textSecondary }]}>
                {item.durationMinutes ? `${item.durationMinutes} min` : 'No duration'}
              </Text>
            </View>
          </View>

          {/* Right: Status & Actions */}
          <View style={styles.rightSection}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
              <Text style={[styles.statusText, { color: theme.white }]}>
                {item.status?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
            
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: theme.info }]}
                onPress={() => navigation.navigate('EditAppointment', { appointmentId: item._id })}
              >
                <FontAwesome5 name="edit" size={12} color={theme.white} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: theme.success }]}
                onPress={() => {/* Handle call */}}
              >
                <FontAwesome5 name="phone" size={12} color={theme.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      {renderSearchBar()}
      {renderFilterBar()}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="calendar-times" size={64} color={theme.textLight} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {searchQuery || selectedFilter !== 'all' ? 'No appointments found' : 'No appointments yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery || selectedFilter !== 'all' 
          ? 'Try adjusting your search or filters'
          : 'Create your first appointment to get started'
        }
      </Text>
      
      {!searchQuery && selectedFilter === 'all' && (
        <TouchableOpacity
          style={[styles.emptyAction, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddAppointment')}
        >
          <FontAwesome5 name="plus" size={16} color={theme.white} />
          <Text style={[styles.emptyActionText, { color: theme.white }]}>
            Create Appointment
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.primary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading appointments...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state when business context is not ready
  if (!activeBusiness) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.primary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading business data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.primary }]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <View style={styles.container}>
        {renderHeader()}
        
        <View style={[styles.contentWrapper, { backgroundColor: theme.background }]}>
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item) => item._id}
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
            contentContainerStyle={filteredAppointments.length === 0 ? styles.emptyList : styles.listContainer}
          />
        </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '16@s',
    textAlign: 'center',
  },
  header: {
    paddingTop: '16@vs',
    paddingBottom: '8@vs',
  },
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: '20@s',
    borderTopRightRadius: '20@s',
    marginTop: '-10@vs',
    paddingTop: '10@vs',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: '16@s',
    marginBottom: '12@vs',
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    borderRadius: '12@s',
    borderWidth: 1.5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconContainer: {
    width: '24@s',
    height: '24@s',
    borderRadius: '12@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8@s',
  },
  searchInput: {
    flex: 1,
    fontSize: '14@s',
    fontWeight: '500',
    lineHeight: '18@s',
  },
  clearButton: {
    width: '20@s',
    height: '20@s',
    borderRadius: '10@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '6@s',
  },
  filterContainer: {
    paddingHorizontal: '16@s',
    marginBottom: '12@vs',
  },
  simpleDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    borderRadius: '8@s',
    borderWidth: 1,
    minWidth: '140@s',
  },
  simpleDropdownText: {
    fontSize: '13@s',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: '10@s',
    marginLeft: '6@s',
  },
  simpleDropdownList: {
    position: 'absolute',
    top: '40@vs',
    left: 0,
    right: 0,
    borderRadius: '8@s',
    borderWidth: 1,
    elevation: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  simpleDropdownItem: {
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  simpleDropdownItemText: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: '16@s',
    paddingBottom: '16@vs',
  },
  appointmentCard: {
    borderRadius: '8@s',
    padding: '10@s',
    marginBottom: '8@vs',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  compactLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
  },
  compactDateTime: {
    marginBottom: '6@vs',
  },
  appointmentDate: {
    fontSize: '12@s',
    fontWeight: '600',
    lineHeight: '14@s',
  },
  appointmentTime: {
    fontSize: '16@s',
    fontWeight: 'bold',
    lineHeight: '18@s',
    marginTop: '1@vs',
  },
  compactCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  customerAvatar: {
    width: '28@s',
    height: '28@s',
    borderRadius: '14@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8@s',
  },
  customerInitials: {
    fontSize: '12@s',
    fontWeight: 'bold',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: '13@s',
    fontWeight: '600',
    lineHeight: '15@s',
  },
  customerPhone: {
    fontSize: '11@s',
    lineHeight: '13@s',
    marginTop: '1@vs',
  },
  serviceDetails: {
    paddingLeft: '36@s',
  },
  serviceName: {
    fontSize: '12@s',
    fontWeight: '500',
    lineHeight: '14@s',
  },
  serviceDuration: {
    fontSize: '10@s',
    lineHeight: '12@s',
    marginTop: '1@vs',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: '8@s',
    minHeight: '60@s',
  },
  statusIndicator: {
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
    borderRadius: '8@s',
  },
  statusText: {
    fontSize: '9@s',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: '4@s',
    marginTop: '4@vs',
  },
  quickActionButton: {
    width: '24@s',
    height: '24@s',
    borderRadius: '12@s',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '32@s',
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
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '20@s',
    paddingVertical: '10@vs',
    borderRadius: '20@s',
    gap: '6@s',
  },
  emptyActionText: {
    fontSize: '14@s',
    fontWeight: '600',
  },
});

export default AppointmentsManagementScreen;

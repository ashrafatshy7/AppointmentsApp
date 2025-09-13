// src/Dashboard/Screens/AppointmentsListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  SectionList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import { getAllAppointments } from '../Service/AppointmentService';
import AppointmentCard from '../AppointmentDetails/AppointmentCard';

const AppointmentsListScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { activeBusiness } = useBusiness();
  const initialFilter = route.params?.status || 'all';
  
  // State
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load appointments
  const loadAppointments = useCallback(async () => {
    try {
      const businessId = activeBusiness?._id || activeBusiness?.id;
      if (!businessId) {
        console.warn('No business ID available for appointments list');
        setAppointments([]);
        setIsLoading(false);
        return;
      }

      const allAppointments = await getAllAppointments(businessId);
      console.log('=== LOAD APPOINTMENTS: Setting appointments ===');
      console.log('All appointments count:', allAppointments?.length || 0);
      console.log('All appointment IDs:', allAppointments?.map(apt => apt._id) || []);
      
      setAppointments(allAppointments);
      
      // Apply active filter and search
      console.log('=== LOAD APPOINTMENTS: About to apply filters ===');
      console.log('Active filter:', activeFilter);
      console.log('Search query:', searchQuery);
      applyFilters(allAppointments, activeFilter, searchQuery);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeBusiness, activeFilter, searchQuery]);
  
  // Initial load
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Monitor filteredAppointments changes
  useEffect(() => {
    console.log('=== FILTERED APPOINTMENTS STATE CHANGED ===');
    console.log('Filtered appointments count:', filteredAppointments.length);
    console.log('Filtered appointment IDs:', filteredAppointments.map(apt => apt._id));
  }, [filteredAppointments]);

  // Handle refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };
  
  // Apply filters and search
  const applyFilters = (appointmentsList, filter, query) => {
    console.log('=== APPLYING FILTERS ===');
    console.log('Input appointments count:', appointmentsList?.length || 0);
    console.log('Filter:', filter);
    console.log('Query:', query);
    
    // First filter by status
    let result = appointmentsList;
    
    if (filter !== 'all') {
      result = result.filter(appointment => appointment.status === filter);
      console.log('After status filter:', result.length);
    }
    
    // Then filter by search query if exists
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(appointment => 
        appointment.user?.name?.toLowerCase().includes(lowerQuery) ||
        appointment.service?.name?.toLowerCase().includes(lowerQuery) ||
        appointment.user?.phone?.includes(query)
      );
      console.log('After search filter:', result.length);
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    console.log('Final filtered appointments count:', result.length);
    console.log('Appointment IDs:', result.map(apt => apt._id));
    
    console.log('=== APPLYING FILTERS: Setting filtered appointments ===');
    setFilteredAppointments(result);
  };
  
  // Handle refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    loadAppointments();
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(appointments, filter, searchQuery);
  };
  
  // Handle search
  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(appointments, activeFilter, text);
  };
  
  // Format date for section headers
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };
  
  // Render the filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterTabsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabs}
      >
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'all' && [styles.activeFilterTab, { borderColor: theme.primary }]
          ]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === 'all' && [styles.activeFilterTabText, { color: theme.primary }]
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'booked' && [styles.activeFilterTab, { borderColor: theme.primary }]
          ]}
          onPress={() => handleFilterChange('booked')}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === 'booked' && [styles.activeFilterTabText, { color: theme.primary }]
          ]}>
            Booked
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'completed' && [styles.activeFilterTab, { borderColor: theme.success }]
          ]}
          onPress={() => handleFilterChange('completed')}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === 'completed' && [styles.activeFilterTabText, { color: theme.success }]
          ]}>
            Completed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'canceled' && [styles.activeFilterTab, { borderColor: theme.danger }]
          ]}
          onPress={() => handleFilterChange('canceled')}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === 'canceled' && [styles.activeFilterTabText, { color: theme.danger }]
          ]}>
            Canceled
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
  
  // Group appointments by date
  const groupAppointmentsByDate = () => {
    console.log('=== GROUPING APPOINTMENTS BY DATE ===');
    console.log('Filtered appointments count:', filteredAppointments.length);
    console.log('Filtered appointments:', filteredAppointments.map(apt => ({ id: apt._id, date: apt.date, time: apt.time })));
    
    const grouped = {};
    
    filteredAppointments.forEach(appointment => {
      // Use the date field directly, not dateTime
      const date = appointment.date;
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(appointment);
    });
    
    console.log('Grouped appointments:', Object.keys(grouped).map(date => ({
      date,
      count: grouped[date].length,
      appointments: grouped[date].map(apt => apt._id)
    })));
    
    // Convert to array for FlatList
    const result = Object.entries(grouped).map(([date, appointments]) => ({
      date,
      title: formatDate(date),
      data: appointments
    }));
    
    console.log('Final grouped result:', result.map(section => ({
      date: section.date,
      title: section.title,
      dataCount: section.data.length,
      appointmentIds: section.data.map(apt => apt._id)
    })));
    
    return result;
  };
  
  // Render appointment item
  const renderAppointmentItem = ({ item }) => {
    console.log('=== RENDERING APPOINTMENT ITEM ===');
    console.log('Appointment ID:', item._id || item.id);
    console.log('Appointment date:', item.date);
    console.log('Appointment time:', item.time);
    console.log('Appointment service:', item.service?.name);
    
    return (
      <AppointmentCard 
        appointment={item}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item._id || item.id })}
      />
    );
  };
  
  // Render section header
  const renderSectionHeader = ({ section }) => {
    console.log('=== RENDERING SECTION HEADER ===');
    console.log('Section date:', section.date);
    console.log('Section title:', section.title);
    console.log('Section data count:', section.data.length);
    console.log('Section appointment IDs:', section.data.map(apt => apt._id));
    
    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundLight }]}>
        <Text style={[styles.sectionHeaderText, { color: theme.textPrimary }]}>
          {section.title}
        </Text>
      </View>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="calendar-times" size={60} color={theme.textLight} />
      <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
        No appointments found
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
        {searchQuery ? 
          'Try a different search term or filter' : 
          activeFilter !== 'all' ? 
            `You don't have any ${activeFilter} appointments` : 
            'Start by adding your first appointment'
        }
      </Text>
      
      {activeFilter === 'all' && !searchQuery && (
        <TouchableOpacity
          style={[styles.addAppointmentButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddAppointment')}
        >
          <FontAwesome5 name="plus" size={16} color={theme.white} style={styles.addButtonIcon} />
          <Text style={[styles.addButtonText, { color: theme.white }]}>
            Add Appointment
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading appointments...
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
            Appointments
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundLight }]}>
          <FontAwesome5 name="search" size={16} color={theme.textLight} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search by customer or service"
            placeholderTextColor={theme.textLight}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <FontAwesome5 name="times-circle" size={16} color={theme.textLight} />
            </TouchableOpacity>
          )}
        </View>
        
        {renderFilterTabs()}
        
        <SectionList
          sections={groupAppointmentsByDate()}
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={renderAppointmentItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          stickySectionHeadersEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
        
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddAppointment')}
        >
          <FontAwesome5 name="plus" size={20} color={theme.white} />
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
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: '4@s',
  },
  headerTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
  },
  calendarButton: {
    padding: '4@s',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: '16@s',
    padding: '10@s',
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
  filterTabsContainer: {
    marginHorizontal: '16@s',
    marginBottom: '16@vs',
  },
  filterTabs: {
    paddingRight: '16@s',
  },
  filterTab: {
    paddingHorizontal: '16@s',
    paddingVertical: '8@vs',
    borderRadius: '20@s',
    marginRight: '8@s',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterTab: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: '14@s',
    fontWeight: '500',
    color: '#666',
  },
  activeFilterTabText: {
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: '16@s',
    paddingBottom: '100@vs',
  },
  sectionHeader: {
    padding: '8@s',
    borderRadius: '8@s',
    marginVertical: '8@vs',
  },
  sectionHeaderText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '60@vs',
  },
  emptyStateTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    marginTop: '16@vs',
    marginBottom: '8@vs',
  },
  emptyStateSubtitle: {
    fontSize: '16@s',
    textAlign: 'center',
    marginBottom: '24@vs',
    paddingHorizontal: '32@s',
  },
  addAppointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs',
    paddingHorizontal: '20@s',
    borderRadius: '8@s',
    marginTop: '16@vs',
  },
  addButtonIcon: {
    marginRight: '8@s',
  },
  addButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: '24@vs',
    right: '24@s',
    width: '56@s',
    height: '56@s',
    borderRadius: '28@s',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.3,
    shadowRadius: '4@s',
    elevation: 4,
  },
});

export default AppointmentsListScreen;

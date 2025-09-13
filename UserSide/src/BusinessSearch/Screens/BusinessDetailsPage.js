// src/BusinessDetailsPage/BusinessDetailsPage.js
import { ScrollView, View, ActivityIndicator, Text, TouchableOpacity, RefreshControl, Alert } from "react-native";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Constants from "expo-constants";
import { ScaledSheet } from "react-native-size-matters";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


import ImageNameRatingSocial from "../Components/ImageNameRatingSocial";
import Details from "../Components/Details";
// import { fetchBusinessDetails } from "../Service/DataService"; // Removed - file deleted
import ServicesList from "../Components/ServicesList";
import GalleryGrid from "../Components/GalleryGrid";
import BookingModal from "../Components/BookingModal";
import Colors from "../../Constants/Colors";


import { useTheme } from '../../Context/ThemeContext';
import { ThemedStatusBar } from '../../Components/Themed/ThemedStatusBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Memoized components to prevent unnecessary re-renders
const MemoizedServicesList = React.memo(ServicesList);
const MemoizedGalleryGrid = React.memo(GalleryGrid);
const MemoizedDetails = React.memo(Details);
const MemoizedImageNameRatingSocial = React.memo(ImageNameRatingSocial);

function BusinessDetailsPage({ route }) {
  const { theme } = useTheme();

  const { id, serviceId, businessData: passedBusinessData } = route.params || {};
  const navigation = useNavigation();
  
  // Business data state - start with passed data if available
  const [businessData, setBusinessData] = useState(passedBusinessData || null);
  const [loading, setLoading] = useState(!passedBusinessData); // Don't show loading if we have passed data
  const [refreshing, setRefreshing] = useState(false);
  const [openHours, setOpenHours] = useState(null);
  const [services, setServices] = useState([]); // State for business services
  const [activeTab, setActiveTab] = useState('services');
  const hasLoadedRef = useRef(false); // Ref to prevent multiple API calls
  
  // Booking modal state
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);



  // Add business to recently viewed
  const addToRecentlyViewed = useCallback(async (businessId) => {
    try {
      const recentlyViewedKey = 'recently_viewed_businesses';
      const storedData = await AsyncStorage.getItem(recentlyViewedKey);
      let recentlyViewed = storedData ? JSON.parse(storedData) : [];

      // Remove if already exists to avoid duplicates
      recentlyViewed = recentlyViewed.filter(id => id !== businessId);

      // Add to the beginning of the array
      recentlyViewed.unshift(businessId);

      // Limit to 10 items
      if (recentlyViewed.length > 10) {
        recentlyViewed = recentlyViewed.slice(0, 10);
      }

      // Save back to storage
      await AsyncStorage.setItem(recentlyViewedKey, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error('Error updating recently viewed:', error);
    }
  }, []);

  // Load business data and details
  const loadBusinessData = useCallback(async () => {
    // Prevent multiple API calls
    if (hasLoadedRef.current) return;

    try {
      setLoading(true);

      // ALWAYS add to recently viewed first, regardless of data loading success
      addToRecentlyViewed(id);

      // If we already have passed data, only fetch the missing details
      if (passedBusinessData) {
        // Import the businessApi and serviceApi to fetch missing details
        const { businessApi, serviceApi } = await import('../../Auth/Services/ApiService');
        
        // Fetch business details, working hours, and services
        const [detailsResult, hoursResult, servicesResult] = await Promise.all([
          businessApi.getDetails(id),
          businessApi.getHours(id),
          serviceApi.getByBusiness(id)
        ]);
        
        if (detailsResult.success) {
          // Merge passed data with fetched data, prioritizing passed data
          const mergedData = {
            ...detailsResult.data.business,
            ...passedBusinessData,
            // Ensure we keep the passed data for fields we already have
            name: passedBusinessData.name,
            profileImage: passedBusinessData.profileImage,
            category: passedBusinessData.category,
            city: passedBusinessData.city
          };
          
          setBusinessData(mergedData);

          // Set working hours if available
          if (hoursResult.success) {
            setOpenHours(hoursResult.data.workingHours);
          } else {
          }

          // Set services if available
          if (servicesResult.success) {
            setServices(servicesResult.data);
          }
        } else {
          // If API fails, use passed data
          setBusinessData(passedBusinessData);
        }
      } else {
        // Fetch business data from API if no passed data
        try {
          const { businessApi, serviceApi } = await import('../../Auth/Services/ApiService');
          
          // Fetch business details, working hours, and services
          const [detailsResult, hoursResult, servicesResult] = await Promise.all([
            businessApi.getDetails(id),
            businessApi.getHours(id),
            serviceApi.getByBusiness(id)
          ]);
          
          if (detailsResult.success) {
            setBusinessData(detailsResult.data.business);

            // Set working hours if available
            if (hoursResult.success) {
              setOpenHours(hoursResult.data.workingHours);
            }

            // Set services if available
            if (servicesResult.success) {
              setServices(servicesResult.data);
            }
          }
        } catch (error) {
          console.error('Error fetching business data:', error);
        }
      }
      
      setLoading(false);
      setRefreshing(false);
      hasLoadedRef.current = true; // Mark data as loaded to prevent multiple calls
      
      // If a specific service was requested (e.g., from deep link or notification)
      if (serviceId && businessData) {
        // Find the service in business data
        const service = businessData.services?.find(s => s.id === serviceId);
        if (service) {
          handleServiceSelect(service);
        }
      }
    } catch (error) {
      console.error('Error loading business details:', error);
      // If error occurs, use passed data if available
      if (passedBusinessData) {
        setBusinessData(passedBusinessData);
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, passedBusinessData, refreshing, addToRecentlyViewed]); // Only include essential dependencies

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    hasLoadedRef.current = false; // Reset flag to allow refresh
  }, []);

  // Service selection handler
  const handleServiceSelect = useCallback((service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  }, []);

  // Booking success handler
  const handleBookingSuccess = useCallback((newAppointment) => {
    Alert.alert(
      "Booking Successful",
      "Your appointment has been added to your upcoming appointments.",
      [{ text: "OK" }]
    );
    
    setSelectedService(null);
    setShowBookingModal(false);
  }, []);

  // Close modal handler
  const handleCloseModal = useCallback(() => {
    setShowBookingModal(false);
  }, []);

  // Initialize component
  useEffect(() => {
    // Only load data if not already loaded
    if (!hasLoadedRef.current) {
      loadBusinessData();
    }
  }, [id, passedBusinessData, refreshing, loadBusinessData]); // Only include essential dependencies

  // Memoize tab buttons to prevent re-renders
const TabButtons = useMemo(() => (
  <View style={[styles.tabContainer, { backgroundColor: theme.backgroundGray }]}>
    <TouchableOpacity 
      style={[
        styles.tabButton, 
        { backgroundColor: theme.backgroundGray },
        activeTab === 'services' && [styles.activeTabButton, { backgroundColor: theme.primary }]
      ]}
      onPress={() => setActiveTab('services')}
    >
      <Text style={[
        styles.tabButtonText,
        { color: theme.textPrimary },
        activeTab === 'services' && [styles.activeTabText, { color: theme.white }]
      ]}>Services</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[
        styles.tabButton, 
        { backgroundColor: theme.backgroundGray },
        activeTab === 'gallery' && [styles.activeTabButton, { backgroundColor: theme.primary }]
      ]}
      onPress={() => setActiveTab('gallery')}
    >
      <Text style={[
        styles.tabButtonText,
        { color: theme.textPrimary },
        activeTab === 'gallery' && [styles.activeTabText, { color: theme.white }]
      ]}>Gallery</Text>
    </TouchableOpacity>
  </View>
), [activeTab, theme]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.background, { backgroundColor: theme.primaryUltraLight }]}>
        <ThemedStatusBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primary }]}>
            Loading business details...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (!businessData) {
    return (
      <View style={[styles.background, { backgroundColor: theme.primaryUltraLight }]}>
        <ThemedStatusBar />
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={50} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            Business information not found
          </Text>
          <TouchableOpacity 
            style={[styles.errorButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.errorButtonText, { color: theme.white }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main content
  return (
    <View style={[styles.background, { backgroundColor: theme.primaryUltraLight }]}>
      <ThemedStatusBar />
      {/* Back Button */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <FontAwesome5 name="arrow-left" size={16} color={theme.white} />
      </TouchableOpacity>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Continue with the rest of your components, applying theme */}
        <ImageNameRatingSocial
          businessId={id}
          name={businessData.name}
          profileImage={businessData.profileImage}
          coverImage={businessData.coverImage}
          rating="4.5"
        />
        



        <MemoizedDetails 
          openHours={openHours} 
          bio={businessData.bio}
          businessData={businessData}
        />
        
        {/* Tab Navigation */}
        {TabButtons}
        
        {/* Tab Content */}
        {activeTab === 'services' ? (
          <MemoizedServicesList 
            services={services}
            onServiceSelect={handleServiceSelect} 
          />
        ) : (
          <MemoizedGalleryGrid gallery={businessData.gallery} />
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
        
      </ScrollView>
      
      {/* Booking Modal */}
      <BookingModal 
        visible={showBookingModal}
        selectedService={selectedService}
        businessData={businessData}
        openHours={openHours}
        onClose={handleCloseModal}
        onBookingSuccess={handleBookingSuccess}
      />
    </View>
  );
}


const styles = ScaledSheet.create({
  background: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
    backgroundColor: Colors.primaryUltraLight,
  },
  backButton: {
    position: 'absolute',
    top: Constants.statusBarHeight + 10,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollView: {
    marginHorizontal: "10@s",
  },
  scrollViewContent: {
    paddingTop: 60, // Add padding for the back button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: "15@s",
    fontSize: "16@s",
    color: Colors.primary,
    fontFamily: "Inter-Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: "20@s",
  },
  errorText: {
    marginTop: "15@s",
    fontSize: "18@s",
    color: Colors.textPrimary,
    fontFamily: "Inter-Medium",
    textAlign: 'center',
  },
  errorButton: {
    marginTop: "20@s",
    paddingHorizontal: "20@s",
    paddingVertical: "10@s",
    backgroundColor: Colors.primary,
    borderRadius: "8@s",
  },
  errorButtonText: {
    color: Colors.white,
    fontSize: "16@s",
    fontFamily: "Inter-Medium",
  },
  
  // Tab Navigation Styling
  tabContainer: {
    flexDirection: 'row',
    marginTop: "15@s",
    borderRadius: "12@s",
    overflow: 'hidden',
    backgroundColor: Colors.backgroundGray,
  },
  tabButton: {
    flex: 1,
    paddingVertical: "12@s",
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: "16@s",
    fontFamily: "Inter-Medium",
    color: Colors.textPrimary,
  },
  activeTabText: {
    color: Colors.white,
  },
  bottomPadding: {
    height: "20@s",
  },
});

export default React.memo(BusinessDetailsPage);
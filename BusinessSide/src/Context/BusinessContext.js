// src/Context/BusinessContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ServiceService from '../Services/ServiceService';

// Storage keys
const ACTIVE_BUSINESS_KEY = '@business_app:active_business';

// Create context
const BusinessContext = createContext();

// Provider component
export const BusinessProvider = ({ children }) => {
  // State for active business and branch
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businessServices, setBusinessServices] = useState([]);
  
    // Load active business and branch on mount - REMOVED LOCAL CACHING
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        // Clear only business-specific cached data (keep auth data)
        await AsyncStorage.removeItem(ACTIVE_BUSINESS_KEY);
        await AsyncStorage.removeItem('businessLogo');
        
        // Try to get auth data and initialize business immediately
        const authUserData = await AsyncStorage.getItem('businessUserData');
        if (authUserData) {
          try {
            const userData = JSON.parse(authUserData);
            if (userData?.business) {
              await initializeBusinessFromAuth(userData);
            }
          } catch (parseError) {
            console.error('BusinessContext: Error parsing auth data:', parseError);
          }
        }
        
        // Load business services from API
        const services = await ServiceService.getBusinessServices();
        setBusinessServices(services);       
        
      } catch (error) {
        console.error('Error loading business data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessData();
  }, [initializeBusinessFromAuth]);

  // REMOVED: Auto-refresh interval as per user request

  // Refresh data when app comes to foreground (user switches back from another device)
  // Add throttling to prevent too many requests
  useEffect(() => {
    if (!activeBusiness) return;

    let lastRefreshTime = 0;
    const REFRESH_THROTTLE = 10000; // 10 seconds minimum between refreshes

    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        if (now - lastRefreshTime > REFRESH_THROTTLE) {
          console.log('BusinessContext: App became active, refreshing business data');
          lastRefreshTime = now;
          refreshBusinessData();
        } else {
          console.log('BusinessContext: App focus refresh throttled');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [activeBusiness, refreshBusinessData]);
  
  // REMOVED: No longer save business data to AsyncStorage for better multi-device sync
  
  
  // Refresh services from API
  const refreshServices = async () => {
    try {
      const services = await ServiceService.getBusinessServices();
      setBusinessServices(services);
      return { success: true };
    } catch (error) {
      console.error('Error refreshing services:', error);
      return { success: false, error };
    }
  };
  
  
  const addBusinessService = async (newService) => {
    try {
      const result = await ServiceService.createService(newService);
      await refreshServices(); // Refresh the list
      return { success: true, service: result };
    } catch (error) {
      console.error('Error adding business service:', error);
      return { success: false, error };
    }
  };

  const updateBusinessService = async (serviceId, updatedService) => {
    try {
      const result = await ServiceService.updateService(serviceId, updatedService);
      await refreshServices(); // Refresh the list
      return { success: true, service: result };
    } catch (error) {
      console.error('Error updating business service:', error);
      return { success: false, error };
    }
  };

  const deleteBusinessService = async (serviceId) => {
    try {
      const result = await ServiceService.deleteService(serviceId);
      await refreshServices(); // Refresh the list
      return { success: true };
    } catch (error) {
      console.error('Error deleting business service:', error);
      return { success: false, error };
    }
  };
  
  // Set active business
  const changeActiveBusiness = (business) => {
    setActiveBusiness(business);
  };

  // Refresh business data from server with debouncing
  const refreshBusinessData = useCallback(async () => {
    // Simple debouncing - prevent multiple calls within 2 seconds
    const now = Date.now();
    if (refreshBusinessData.lastCall && (now - refreshBusinessData.lastCall) < 2000) {
      console.log('BusinessContext: Refresh debounced');
      return activeBusiness;
    }
    refreshBusinessData.lastCall = now;

    try {
      // Import ApiService dynamically to avoid circular imports
      const ApiService = (await import('../Dashboard/Service/ApiService')).default;
      
      // Get business ID from current active business (since we can't rely on AsyncStorage anymore)
      const businessId = activeBusiness?._id || activeBusiness?.id;
      
      if (businessId) {
        // Fetch fresh business data from server
        const freshBusinessData = await ApiService.getBusinessProfile(businessId);
        if (freshBusinessData) {
          // Sort gallery by order if it exists
          if (freshBusinessData.gallery && Array.isArray(freshBusinessData.gallery)) {
            freshBusinessData.gallery.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
          
          const businessData = {
            ...freshBusinessData,
            // Ensure we have both id and _id for compatibility
            _id: freshBusinessData._id || freshBusinessData.id,
            id: freshBusinessData.id || freshBusinessData._id,
          };
          setActiveBusiness(businessData);
          return businessData;
        }
      }
      return null;
    } catch (error) {
      // Handle rate limiting gracefully
      if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
        console.warn('BusinessContext: Rate limited, skipping refresh');
        return activeBusiness; // Return current data instead of null
      }
      console.error('BusinessContext: Error refreshing business data:', error);
      return null;
    }
  }, [activeBusiness]);

  // Initialize business from auth data (ensures proper ID fields)
  const initializeBusinessFromAuth = useCallback(async (authUserData) => {
    if (authUserData?.business) {
      const businessData = {
        ...authUserData.business,
        // Ensure we have both id and _id for compatibility
        _id: authUserData.business._id || authUserData.business.id,
        id: authUserData.business.id || authUserData.business._id,
      };
      
      setActiveBusiness(businessData);
      
      // Don't auto-refresh immediately to avoid rate limiting
      // Users can manually refresh if they need latest data
      
      return businessData;
    }
    
    return null;
  }, []);
  
  // Update business logo
  const updateBusinessLogo = async (logoUri) => {
    try {
      // Get business ID from either _id or id field
      const businessId = activeBusiness?._id || activeBusiness?.id;
      
      if (!businessId) {
        console.error('BusinessContext: No business ID found', {
          activeBusiness,
          keys: activeBusiness ? Object.keys(activeBusiness) : 'no activeBusiness'
        });
        throw new Error('No active business found or missing business ID');
      }
      
      // Import ApiService dynamically to avoid circular imports
      const ApiService = (await import('../Dashboard/Service/ApiService')).default;
      
      // Upload logo to backend and update business profile
      const uploadResult = await ApiService.uploadBusinessLogo(businessId, logoUri);
      
      if (uploadResult.success && uploadResult.logoUrl) {
        // Refresh business data from server to get latest updates
        await refreshBusinessData();
        
        console.log('BusinessContext: Business logo updated successfully', uploadResult.logoUrl);
        return { success: true, logoUrl: uploadResult.logoUrl };
      } else {
        throw new Error('Failed to upload logo to server');
      }
      
    } catch (error) {
      console.error('BusinessContext: Error updating business logo:', error);
      return { success: false, error: error.message };
    }
  };

  // Update business cover photo
  const updateBusinessCoverPhoto = async (coverUri) => {
    try {
      // Get business ID from either _id or id field
      const businessId = activeBusiness?._id || activeBusiness?.id;
      
      if (!businessId) {
        console.error('BusinessContext: No business ID found', {
          activeBusiness,
          keys: activeBusiness ? Object.keys(activeBusiness) : 'no activeBusiness'
        });
        throw new Error('No active business found or missing business ID');
      }
      
      // Import ApiService dynamically to avoid circular imports
      const ApiService = (await import('../Dashboard/Service/ApiService')).default;
      
      // Upload cover photo to backend and update business profile
      const uploadResult = await ApiService.uploadBusinessCoverPhoto(businessId, coverUri);
      
      if (uploadResult.success && uploadResult.coverUrl) {
        // Refresh business data from server to get latest updates
        await refreshBusinessData();
        
        console.log('BusinessContext: Business cover photo updated successfully', uploadResult.coverUrl);
        return { success: true, coverUrl: uploadResult.coverUrl };
      } else {
        throw new Error('Failed to upload cover photo to server');
      }
      
    } catch (error) {
      console.error('BusinessContext: Error updating business cover photo:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Update business profile data
  const updateBusinessProfile = async (profileData) => {
    try {
      // Get business ID from either _id or id field
      const businessId = activeBusiness?._id || activeBusiness?.id;
      console.log('BusinessContext: Updating business profile', { profileData, businessId, activeBusiness });
      
      if (!businessId) {
        throw new Error('No active business found or missing business ID');
      }
      
      // Import ApiService dynamically to avoid circular imports
      const ApiService = (await import('../Dashboard/Service/ApiService')).default;
      
      // Update business profile on backend
      const updateResult = await ApiService.updateBusinessProfile(businessId, profileData);
      
      if (updateResult) {
        // Refresh business data from server to get latest updates
        const refreshedBusiness = await refreshBusinessData();
        
        console.log('BusinessContext: Business profile updated successfully');
        return { success: true, business: refreshedBusiness || updateResult };
      } else {
        throw new Error('Failed to update business profile on server');
      }
      
    } catch (error) {
      console.error('BusinessContext: Error updating business profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Add image to business gallery
  const addGalleryImage = async (imageUri) => {
    try {
      const businessId = activeBusiness?._id || activeBusiness?.id;
      if (!businessId) { throw new Error('No active business found or missing business ID'); }
      const ApiService = (await import('../Dashboard/Service/ApiService')).default;
      const uploadResult = await ApiService.uploadGalleryImage(businessId, imageUri);
      if (uploadResult.success && uploadResult.imageUrl) {
        await refreshBusinessData();
        return { success: true, imageUrl: uploadResult.imageUrl };
      } else {
        throw new Error('Failed to upload gallery image to server');
      }
    } catch (error) {
      console.error('BusinessContext: Error adding gallery image:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove image from business gallery
  const removeGalleryImage = async (imageUrl) => {
    try {
      const businessId = activeBusiness?._id || activeBusiness?.id;
      if (!businessId) { throw new Error('No active business found or missing business ID'); }
      const ApiService = (await import('../Dashboard/Service/ApiService')).default;
      const deleteResult = await ApiService.deleteGalleryImage(businessId, imageUrl);
      if (deleteResult.success) {
        await refreshBusinessData();
        return { success: true };
      } else {
        throw new Error('Failed to delete gallery image from server');
      }
    } catch (error) {
      console.error('BusinessContext: Error removing gallery image:', error);
      return { success: false, error: error.message };
    }
  };

  // Reorder gallery images
  const reorderGalleryImages = async (newOrder) => {
    try {
      const businessId = activeBusiness?._id || activeBusiness?.id;
      if (!businessId) { throw new Error('No active business found or missing business ID'); }
      const ApiService = (await import('../Dashboard/Service/ApiService')).default;
      const reorderResult = await ApiService.reorderGalleryImages(businessId, newOrder);
      if (reorderResult.success) {
        await refreshBusinessData();
        return { success: true };
      } else {
        throw new Error('Failed to reorder gallery images on server');
      }
    } catch (error) {
      console.error('BusinessContext: Error reordering gallery images:', error);
      return { success: false, error: error.message };
    }
  };

  
  // Context value
  const value = {
    activeBusiness,
    businessServices,
    isLoading,
    changeActiveBusiness,
    initializeBusinessFromAuth,
    refreshBusinessData,
    updateBusinessLogo,
    updateBusinessCoverPhoto,
    updateBusinessProfile,
    addGalleryImage,
    removeGalleryImage,
    reorderGalleryImages,
    refreshServices,
    addBusinessService,
    updateBusinessService,
    deleteBusinessService,
  };
  
  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

// Custom hook
export const useBusiness = () => {
  const context = useContext(BusinessContext);
  
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  
  return context;
};

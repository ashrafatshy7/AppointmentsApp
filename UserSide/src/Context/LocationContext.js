// src/Context/LocationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import {
  getCurrentLocation,
  getMaxDistancePreference,
  saveMaxDistancePreference,
  calculateDistance,
  getLocationTierForDistance,
  getAddressFromCoordinates,
  LocationTiers
} from '../Utils/LocationService';

// Create the context
const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [maxDistancePreference, setMaxDistancePreference] = useState(LocationTiers.IN_AREA.max);
  
  // City selection status
  const [citySelectionStatus, setCitySelectionStatus] = useState({
    hasCity: false,
    needsCitySelection: false,
    currentCity: null,
    isInitialized: false
  });
  
  // Initialize user location and preferences
  useEffect(() => {
    initializeLocation();
    loadMaxDistancePreference();
  }, []);
  
  // Get user location
  const initializeLocation = async () => {
    setIsLocationLoading(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setHasLocationPermission(hasPermission);
      
      if (hasPermission) {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location.coords);
          
          // Get address from coordinates
          const address = await getAddressFromCoordinates(location.coords);
          if (address) {
            setUserAddress(address);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    } finally {
      setIsLocationLoading(false);
    }
  };
  
  // Load user's max distance preference
  const loadMaxDistancePreference = async () => {
    const maxDistance = await getMaxDistancePreference();
    setMaxDistancePreference(maxDistance);
  };
  
  // Update max distance preference
  const updateMaxDistancePreference = async (distance) => {
    await saveMaxDistancePreference(distance);
    setMaxDistancePreference(distance);
  };
  
  // Get distance between user and a business
  const getDistanceToBusinessWithLocation = (userCoords, businessCoords) => {
    if (!userCoords || !businessCoords) return null;
    
    return calculateDistance(userCoords, businessCoords);
  };
  
  // Filter businesses by distance
  const filterBusinessesByDistance = (businesses, maxDistance = maxDistancePreference) => {
    if (!userLocation) return businesses;
    
    return businesses.filter(business => {
      if (business.location && business.location.coords) {
        const distance = calculateDistance(userLocation, business.location.coords);
        business.distance = distance; // Add distance to business object
        return distance <= maxDistance;
      }
      return false;
    }).sort((a, b) => a.distance - b.distance); // Sort by distance
  };
  
  // Group businesses by distance tier
  const groupBusinessesByDistanceTier = (businesses) => {
    if (!userLocation) return { farAway: businesses };
    
    const groupedBusinesses = {
      veryClose: [],
      nearby: [],
      inArea: [],
      farAway: []
    };
    
    businesses.forEach(business => {
      if (business.location && business.location.coords) {
        const distance = calculateDistance(userLocation, business.location.coords);
        business.distance = distance; // Add distance to business object
        
        if (distance <= LocationTiers.VERY_CLOSE.max) {
          groupedBusinesses.veryClose.push(business);
        } else if (distance <= LocationTiers.NEARBY.max) {
          groupedBusinesses.nearby.push(business);
        } else if (distance <= LocationTiers.IN_AREA.max) {
          groupedBusinesses.inArea.push(business);
        } else {
          groupedBusinesses.farAway.push(business);
        }
      } else {
        groupedBusinesses.farAway.push(business);
      }
    });
    
    // Sort each group by distance
    Object.keys(groupedBusinesses).forEach(key => {
      groupedBusinesses[key].sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        return 0;
      });
    });
    
    return groupedBusinesses;
  };
  
  // Group businesses by city or region
  const groupBusinessesByRegion = (businesses) => {
    const groupedBusinesses = {};
    
    businesses.forEach(business => {
      if (business.location && business.location.city) {
        const cityName = business.location.city;
        
        if (!groupedBusinesses[cityName]) {
          groupedBusinesses[cityName] = [];
        }
        
        groupedBusinesses[cityName].push(business);
      }
    });
    
    return groupedBusinesses;
  };
  
  // Refresh user location
  const refreshLocation = async () => {
    await initializeLocation();
  };
  
  // City selection management functions
  const updateCitySelectionStatus = (status) => {
    setCitySelectionStatus(prev => ({
      ...prev,
      ...status
    }));
  };

  const setCitySelected = (city) => {
    setCitySelectionStatus(prev => ({
      ...prev,
      currentCity: city,
      hasCity: true,
      needsCitySelection: false
    }));
  };

  const setNeedsCitySelection = (needs) => {
    setCitySelectionStatus(prev => ({
      ...prev,
      needsCitySelection: needs
    }));
  };
  
  return (
    <LocationContext.Provider 
      value={{
        userLocation,
        userAddress,
        isLocationLoading,
        hasLocationPermission,
        maxDistancePreference,
        updateMaxDistancePreference,
        getDistanceToBusinessWithLocation,
        filterBusinessesByDistance,
        groupBusinessesByDistanceTier,
        groupBusinessesByRegion,
        refreshLocation,
        // City selection status and functions
        citySelectionStatus,
        updateCitySelectionStatus,
        setCitySelected,
        setNeedsCitySelection,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

// Custom hook to use the location context
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
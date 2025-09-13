// src/Utils/LocationGatekeeper.js
import React, { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CitiesService from '../Services/CitiesService';
import { useLocation } from '../Context/LocationContext';

const SELECTED_CITY_KEY = 'selected_city';
const LOCATION_CHECKED_KEY = 'location_checked';

// Helper function to safely store city data
const safeSetCity = async (city) => {
  if (city && typeof city === 'string' && city.trim().length > 0) {
    await AsyncStorage.setItem(SELECTED_CITY_KEY, city.trim());
    return true;
  }
  return false;
};

const LocationGatekeeper = ({ children }) => {
  const { setCitySelected, setNeedsCitySelection, updateCitySelectionStatus } = useLocation();
  const initialCheckDone = useRef(false);
  
  // Available cities for matching
  const [availableCities, setAvailableCities] = useState([]);
  
  // Initialize available cities and location status
  useEffect(() => {
    const initializeLocationStatus = async () => {
      try {
        // Initialize cities first
        const citiesResult = await CitiesService.getCitiesWithFallback();
        const cities = citiesResult.success && citiesResult.cities.length > 0
          ? citiesResult.cities.map(city => city.name)
          : [];
        
        setAvailableCities(cities);
        
        // Check existing city selection
        const hasExistingCity = await checkExistingCity(cities);
        
        if (hasExistingCity) {
          // User already has a valid city selected
          return;
        }
        
        // Try to get location and auto-select city
        const locationCity = await attemptLocationDetection(cities);
        
        if (!locationCity) {
          // Need manual city selection
          setNeedsCitySelection(true);
        }
        
      } catch (error) {
        console.error("Error initializing location status:", error);
        // Fallback - require manual city selection
        setNeedsCitySelection(true);
      }
    };
    
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      initializeLocationStatus();
    }
  }, []);
  
  // Helper function to check if user already has a valid city
  const checkExistingCity = async (cities) => {
    try {
      const storedCity = await AsyncStorage.getItem(SELECTED_CITY_KEY);
      
      if (storedCity && cities.includes(storedCity)) {
        setCitySelected(storedCity);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking existing city:', error);
      return false;
    }
  };
  
  // Attempt to detect user's location and auto-select city
  const attemptLocationDetection = async (cities) => {
    try {
      // Check if location services are enabled
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        console.log("Location services disabled");
        return false;
      }

      // Check location permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return false;
      }

      // Try to get current position
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location request timed out')), 5000)
      );
      
      const location = await Promise.race([locationPromise, timeoutPromise]);
      
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const possibleCityNames = [address.city, address.subregion, address.district, address.region]
          .filter(name => name)
          .map(name => name.toLowerCase().trim());
        
        
        // Find matching city
        const matchingCity = cities.find(availableCity => 
          possibleCityNames.some(name => 
            availableCity.toLowerCase().trim() === name ||
            availableCity.toLowerCase().trim().includes(name) ||
            name.includes(availableCity.toLowerCase().trim())
          )
        );
        
        if (matchingCity) {
          setCitySelected(matchingCity);
          await safeSetCity(matchingCity);
          return matchingCity;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  // Always return children - no UI blocking
  return children;
};

export default LocationGatekeeper;
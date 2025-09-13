// src/Utils/LocationService.js
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = 'user_location_cache';
const LOCATION_CACHE_EXPIRY = 1000 * 60 * 15; // 15 minutes in milliseconds
const MAX_DISTANCE_PREF_KEY = 'user_max_distance_pref';

export const LocationTiers = {
  VERY_CLOSE: { max: 5, label: 'Very Close' },
  NEARBY: { max: 15, label: 'Nearby' },
  IN_AREA: { max: 30, label: 'In Your Area' },
};

/**
 * Request location permissions and get current position
 * @returns {Promise<Object>} Location object or null if permission denied
 */
export const getCurrentLocation = async () => {
  try {
    // First check the cache
    const cachedLocation = await getCachedLocation();
    if (cachedLocation) {
      return cachedLocation;
    }

    // Request permission if no cached location
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }
    
    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    // Cache the location
    await cacheLocation(location);
    
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Cache the user's location to reduce API calls
 * @param {Object} location Location object
 */
export const cacheLocation = async (location) => {
  try {
    const locationData = {
      coords: location.coords,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));
  } catch (error) {
    console.error('Error caching location:', error);
  }
};

/**
 * Get cached location if valid
 * @returns {Object|null} Location object or null if no valid cache
 */
export const getCachedLocation = async () => {
  try {
    const cachedLocationJSON = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    
    if (!cachedLocationJSON) {
      return null;
    }
    
    const cachedLocation = JSON.parse(cachedLocationJSON);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cachedLocation.timestamp > LOCATION_CACHE_EXPIRY) {
      return null;
    }
    
    return {
      coords: cachedLocation.coords,
      timestamp: cachedLocation.timestamp,
    };
  } catch (error) {
    console.error('Error getting cached location:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coords1 First coordinate {latitude, longitude}
 * @param {Object} coords2 Second coordinate {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coords1, coords2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 */
const toRad = (value) => {
  return value * Math.PI / 180;
};

/**
 * Get user's preferred maximum distance
 * @returns {Promise<number>} Maximum distance in km, default 30
 */
export const getMaxDistancePreference = async () => {
  try {
    const value = await AsyncStorage.getItem(MAX_DISTANCE_PREF_KEY);
    return value ? parseInt(value, 10) : 30; // Default to 30km
  } catch (error) {
    console.error('Error getting max distance preference:', error);
    return 30; // Default to 30km in case of error
  }
};

/**
 * Save user's preferred maximum distance
 * @param {number} distance Maximum distance in km
 */
export const saveMaxDistancePreference = async (distance) => {
  try {
    await AsyncStorage.setItem(MAX_DISTANCE_PREF_KEY, distance.toString());
  } catch (error) {
    console.error('Error saving max distance preference:', error);
  }
};

/**
 * Get location tier label based on distance
 * @param {number} distance Distance in km
 * @returns {string} Tier label (Very Close, Nearby, In Your Area, or Far)
 */
export const getLocationTierForDistance = (distance) => {
  if (distance <= LocationTiers.VERY_CLOSE.max) {
    return LocationTiers.VERY_CLOSE.label;
  } else if (distance <= LocationTiers.NEARBY.max) {
    return LocationTiers.NEARBY.label;
  } else if (distance <= LocationTiers.IN_AREA.max) {
    return LocationTiers.IN_AREA.label;
  } else {
    return 'Far';
  }
};

/**
 * Get the geocoded address from coordinates
 * @param {Object} coords Coordinates {latitude, longitude}
 * @returns {Promise<Object>} Address object
 */
export const getAddressFromCoordinates = async (coords) => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    
    return result[0];
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return null;
  }
};
// src/Utils/AsyncStorageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key prefixes
const USER_PREFIX = '@user:';
const APP_PREFIX = '@app:';
const AUTH_PREFIX = '@auth:';

// Specific keys
const AUTH_TOKEN_KEY = `${AUTH_PREFIX}token`;
const USER_DATA_KEY = `${AUTH_PREFIX}userData`;
const RECENTLY_VIEWED_KEY = `${APP_PREFIX}recentlyViewed`;
const LOVED_BUSINESSES_KEY = `${APP_PREFIX}lovedBusinesses`;
const SELECTED_CITY_KEY = `${APP_PREFIX}selectedCity`;
const MAX_DISTANCE_PREF_KEY = `${APP_PREFIX}maxDistancePref`;

/**
 * Get a user-specific storage key
 * This ensures data is isolated per user
 * @param {string} key - Base key name
 * @param {string} userId - User ID
 * @returns {string} User-specific key
 */
const getUserKey = (key, userId) => {
  return `${USER_PREFIX}${userId}:${key}`;
};

// Authentication related functions

/**
 * Save user authentication token
 * @param {string} token - Authentication token
 */
export const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

/**
 * Get user authentication token
 * @returns {Promise<string|null>} Authentication token or null
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Save user data
 * @param {Object} userData - User data object
 */
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Get user data
 * @returns {Promise<Object|null>} User data object or null
 */
export const getUserData = async () => {
  try {
    const userDataStr = await AsyncStorage.getItem(USER_DATA_KEY);
    return userDataStr ? JSON.parse(userDataStr) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Clear all authentication data (logout)
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

// User-specific data functions

/**
 * Save user appointments
 * @param {string} userId - User ID
 * @param {Array} appointments - User's appointments
 */
export const saveUserAppointments = async (userId, appointments) => {
  try {
    const key = getUserKey('appointments', userId);
    await AsyncStorage.setItem(key, JSON.stringify(appointments));
  } catch (error) {
    console.error('Error saving user appointments:', error);
    throw error;
  }
};

/**
 * Get user appointments
 * @param {string} userId - User ID
 * @returns {Promise<Array|null>} User's appointments or null
 */
export const getUserAppointments = async (userId) => {
  try {
    const key = getUserKey('appointments', userId);
    const appointmentsStr = await AsyncStorage.getItem(key);
    return appointmentsStr ? JSON.parse(appointmentsStr) : [];
  } catch (error) {
    console.error('Error getting user appointments:', error);
    return [];
  }
};

// App preferences and shared data

/**
 * Save recently viewed businesses
 * @param {Array} businesses - Array of business IDs
 */
export const saveRecentlyViewed = async (businesses) => {
  try {
    await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(businesses));
  } catch (error) {
    console.error('Error saving recently viewed businesses:', error);
    throw error;
  }
};

/**
 * Get recently viewed businesses
 * @returns {Promise<Array|null>} Array of business IDs or null
 */
export const getRecentlyViewed = async () => {
  try {
    const recentlyViewedStr = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    return recentlyViewedStr ? JSON.parse(recentlyViewedStr) : [];
  } catch (error) {
    console.error('Error getting recently viewed businesses:', error);
    return [];
  }
};

/**
 * Add a business to recently viewed
 * @param {string} businessId - Business ID
 * @param {number} maxItems - Maximum number of items to keep (default 10)
 */
export const addToRecentlyViewed = async (businessId, maxItems = 10) => {
  try {
    let recentlyViewed = await getRecentlyViewed();
    
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(id => id !== businessId);
    
    // Add to beginning
    recentlyViewed.unshift(businessId);
    
    // Limit to maxItems
    if (recentlyViewed.length > maxItems) {
      recentlyViewed = recentlyViewed.slice(0, maxItems);
    }
    
    await saveRecentlyViewed(recentlyViewed);
    return recentlyViewed;
  } catch (error) {
    console.error('Error adding to recently viewed:', error);
    throw error;
  }
};

/**
 * Save loved businesses
 * @param {Array} businesses - Array of business IDs
 */
export const saveLovedBusinesses = async (businesses) => {
  try {
    await AsyncStorage.setItem(LOVED_BUSINESSES_KEY, JSON.stringify(businesses));
  } catch (error) {
    console.error('Error saving loved businesses:', error);
    throw error;
  }
};

/**
 * Get loved businesses
 * @returns {Promise<Array|null>} Array of business IDs or null
 */
export const getLovedBusinesses = async () => {
  try {
    const lovedBusinessesStr = await AsyncStorage.getItem(LOVED_BUSINESSES_KEY);
    return lovedBusinessesStr ? JSON.parse(lovedBusinessesStr) : [];
  } catch (error) {
    console.error('Error getting loved businesses:', error);
    return [];
  }
};

/**
 * Toggle a business in loved list
 * @param {string} businessId - Business ID to toggle
 * @returns {Promise<boolean>} New state (true if now loved, false if removed)
 */
export const toggleLovedBusiness = async (businessId) => {
  try {
    let lovedBusinesses = await getLovedBusinesses();
    const index = lovedBusinesses.indexOf(businessId);
    
    if (index === -1) {
      // Add to loved
      lovedBusinesses.push(businessId);
    } else {
      // Remove from loved
      lovedBusinesses.splice(index, 1);
    }
    
    await saveLovedBusinesses(lovedBusinesses);
    return index === -1; // Return true if added, false if removed
  } catch (error) {
    console.error('Error toggling loved business:', error);
    throw error;
  }
};

/**
 * Save selected city
 * @param {string} city - Selected city
 */
export const saveSelectedCity = async (city) => {
  try {
    await AsyncStorage.setItem(SELECTED_CITY_KEY, city);
  } catch (error) {
    console.error('Error saving selected city:', error);
    throw error;
  }
};

/**
 * Get selected city
 * @returns {Promise<string|null>} Selected city or null
 */
export const getSelectedCity = async () => {
  try {
    return await AsyncStorage.getItem(SELECTED_CITY_KEY);
  } catch (error) {
    console.error('Error getting selected city:', error);
    return null;
  }
};

/**
 * Save maximum distance preference
 * @param {number} distance - Maximum distance in km
 */
export const saveMaxDistancePreference = async (distance) => {
  try {
    await AsyncStorage.setItem(MAX_DISTANCE_PREF_KEY, distance.toString());
  } catch (error) {
    console.error('Error saving max distance preference:', error);
    throw error;
  }
};

/**
 * Get maximum distance preference
 * @returns {Promise<number>} Maximum distance in km (default 30)
 */
export const getMaxDistancePreference = async () => {
  try {
    const value = await AsyncStorage.getItem(MAX_DISTANCE_PREF_KEY);
    return value ? parseInt(value, 10) : 30; // Default to 30km
  } catch (error) {
    console.error('Error getting max distance preference:', error);
    return 30; // Default to 30km on error
  }
};

/**
 * Save a shared resource independent of user
 * @param {string} key - Resource key
 * @param {any} data - Data to save
 */
export const saveSharedResource = async (key, data) => {
  try {
    const fullKey = `${APP_PREFIX}${key}`;
    await AsyncStorage.setItem(fullKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving shared resource ${key}:`, error);
    throw error;
  }
};

/**
 * Get a shared resource independent of user
 * @param {string} key - Resource key
 * @returns {Promise<any|null>} Resource data or null
 */
export const getSharedResource = async (key) => {
  try {
    const fullKey = `${APP_PREFIX}${key}`;
    const dataStr = await AsyncStorage.getItem(fullKey);
    return dataStr ? JSON.parse(dataStr) : null;
  } catch (error) {
    console.error(`Error getting shared resource ${key}:`, error);
    return null;
  }
};

export default {
  saveAuthToken,
  getAuthToken,
  saveUserData,
  getUserData,
  clearAuthData,
  saveUserAppointments,
  getUserAppointments,
  saveRecentlyViewed,
  getRecentlyViewed,
  addToRecentlyViewed,
  saveLovedBusinesses,
  getLovedBusinesses,
  toggleLovedBusiness,
  saveSelectedCity,
  getSelectedCity,
  saveMaxDistancePreference,
  getMaxDistancePreference,
  saveSharedResource,
  getSharedResource,
  getUserKey
};
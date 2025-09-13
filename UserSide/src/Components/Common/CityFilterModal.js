// src/Components/Common/CityFilterModal.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { businessesData } from '../../BusinessSearch/Service/HomePageData'; // Removed - file deleted
import Colors from '../../Constants/Colors';
import CitiesService from '../../Services/CitiesService';

const SELECTED_CITY_KEY = 'selected_city';

const CityFilterModal = ({ visible, onClose, onSelectCity, forceSelect = false }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get all available cities from API
  useEffect(() => {
    initializeCities();
  }, []);

  const initializeCities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to fetch cities from API
      const citiesResult = await CitiesService.getCitiesWithFallback();
      
      if (citiesResult.success && citiesResult.cities.length > 0) {
        // Use cities from API
        const apiCities = citiesResult.cities
          .map(city => city.english || city.name)
          .filter(city => city) // Remove any undefined/null cities
          .sort();
        setCities(apiCities);
        setError(null);
      } else {
        // API failed - show error
        setCities([]);
        setError(citiesResult.error || 'Failed to load cities');
      }
      
      // Load previously selected city
      loadSelectedCity();
    } catch (error) {
      console.error('Error initializing cities:', error);
      setCities([]);
      setError('Failed to load cities');
      loadSelectedCity();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get user's current city
  const getCurrentCity = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Location permission denied');
        setIsLoading(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (addresses && addresses.length > 0) {
        const city = addresses[0].city;
        if (city && cities.includes(city)) {
          setSelectedCity(city);
          saveSelectedCity(city);
          if (onSelectCity) {
            onSelectCity(city);
            if (!forceSelect) {
              onClose?.();
            }
          }
        } else {
          // If current city not in list, don't select any city
          setSelectedCity(null);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load previously selected city from storage
  const loadSelectedCity = async () => {
    try {
      const city = await AsyncStorage.getItem(SELECTED_CITY_KEY);
      if (city) {
        setSelectedCity(city);
      } else {
        setSelectedCity(null);
      }
    } catch (error) {
      console.error('Error loading selected city:', error);
      setSelectedCity(null);
    }
  };
  
  // Save selected city to storage
  const saveSelectedCity = async (city) => {
    try {
      await AsyncStorage.setItem(SELECTED_CITY_KEY, city);
    } catch (error) {
      console.error('Error saving selected city:', error);
    }
  };
  
  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    saveSelectedCity(city);
    if (onSelectCity) {
      onSelectCity(city);
    }
    // Let the parent component (Header) control modal visibility
    // This ensures proper behavior for both forced and normal selections
  };
  
  // Render city item
  const renderCityItem = ({ item }) => {
    const isSelected = item === selectedCity;
    
    return (
      <TouchableOpacity
        style={[
          styles.cityItem,
          isSelected && styles.selectedCityItem
        ]}
        onPress={() => handleCitySelect(item)}
      >
        <FontAwesome5 
          name="map-marker-alt" 
          size={18} 
          color={isSelected ? Colors.white : Colors.primary} 
          style={styles.cityIcon}
        />
        <Text style={[
          styles.cityName,
          isSelected && styles.selectedCityName
        ]}>
          {item}
        </Text>
        {isSelected && (
          <FontAwesome5 
            name="check" 
            size={16} 
            color={Colors.white} 
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={forceSelect ? () => {} : onClose}
    >
      <TouchableWithoutFeedback onPress={forceSelect ? undefined : onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Select a City</Text>
                {!forceSelect && (
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <FontAwesome5 name="times" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                )}
              </View>
              
              {!error && (
                <TouchableOpacity 
                  style={styles.detectLocationButton}
                  onPress={getCurrentCity}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <FontAwesome5 
                        name="location-arrow" 
                        size={16} 
                        color={Colors.primary} 
                        style={styles.locationIcon}
                      />
                      <Text style={styles.detectLocationText}>
                        Detect My Current City
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {error ? (
                <View style={styles.errorContainer}>
                  <FontAwesome5 name="exclamation-triangle" size={50} color={Colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={initializeCities}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <FontAwesome5 
                          name="redo" 
                          size={16} 
                          color={Colors.white} 
                          style={styles.refreshIcon}
                        />
                        <Text style={styles.refreshButtonText}>
                          Try Again
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={cities}
                  renderItem={renderCityItem}
                  keyExtractor={(item, index) => item || `city-${index}`}
                  contentContainerStyle={styles.listContainer}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: '20@s',
    borderTopRightRadius: '20@s',
    paddingBottom: '20@s',
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15@s',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
  },
  detectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15@s',
    margin: '15@s',
    backgroundColor: Colors.primaryBackground,
    borderRadius: '10@s',
  },
  locationIcon: {
    marginRight: '10@s',
  },
  detectLocationText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  listContainer: {
    paddingHorizontal: '15@s',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '15@s',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedCityItem: {
    backgroundColor: Colors.primary,
    marginHorizontal: '0@s',
    borderRadius: '10@s',
    marginVertical: '5@s',
    borderBottomWidth: 0,
  },
  cityIcon: {
    marginRight: '15@s',
    width: '25@s',
  },
  cityName: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
    flex: 1,
  },
  selectedCityName: {
    color: Colors.white,
  },
  checkIcon: {
    marginLeft: '10@s',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30@s',
  },
  errorText: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: '15@s',
    marginBottom: '20@s',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: '20@s',
    paddingVertical: '12@s',
    borderRadius: '8@s',
  },
  refreshIcon: {
    marginRight: '8@s',
  },
  refreshButtonText: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});

export default CityFilterModal;
// src/HomePage/Header.js

import { Text, View, Image, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { ScaledSheet } from "react-native-size-matters";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { useUser } from "../../Context/UserContext";
import { useAuth } from "../../Auth/Context/AuthContext"; 
import CityFilterModal from "../../Components/Common/CityFilterModal";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { businessesData } from "../Service/HomePageData"; // Removed - file deleted
import Colors from "../../Constants/Colors";
import { useTheme } from '../../Context/ThemeContext';
import { useLocation } from '../../Context/LocationContext';
import CitiesService from '../../Services/CitiesService';

const SELECTED_CITY_KEY = 'selected_city';

export default function Header({ onCityChange }) {
  const { theme } = useTheme(); // Move this inside the component body
  const { citySelectionStatus, setCitySelected, setNeedsCitySelection } = useLocation();
  const [todayDate, setTodayDate] = useState(null);
  const [showCityFilter, setShowCityFilter] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const { userData } = useUser();
  const { user } = useAuth(); 
  const navigation = useNavigation();

  useEffect(() => {
    // Set today's date
    function getDayWithSuffix(day) {
      if (day >= 11 && day <= 13) {
        return day + "th";
      }
      switch (day % 10) {
        case 1:
          return day + "st";
        case 2:
          return day + "nd";
        case 3:
          return day + "rd";
        default:
          return day + "th";
      }
    }

    const date = new Date();
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const month = monthNames[monthIndex];
    const dayWithSuffix = getDayWithSuffix(day);
    setTodayDate(dayWithSuffix + " " + month + ", " + year);
    
    // Load selected city
    loadSelectedCity();
  }, []);
  
  // Monitor location status and show mandatory city modal if needed
  useEffect(() => {
    if (citySelectionStatus.needsCitySelection) {
      setShowCityFilter(true);
    } else if (citySelectionStatus.currentCity) {
      setSelectedCity(citySelectionStatus.currentCity);
      if (onCityChange) {
        onCityChange(citySelectionStatus.currentCity);
      }
    }
  }, [citySelectionStatus, onCityChange]);

  // Load the saved selected city
  const loadSelectedCity = async () => {
    try {
      const city = await AsyncStorage.getItem(SELECTED_CITY_KEY);
      
      if (city) {
        setSelectedCity(city);
        setCitySelected(city); // Update context
        if (onCityChange) {
          onCityChange(city);
        }
      } else {
        // If no stored city, try to get from API first
        try {
          const citiesResult = await CitiesService.getCitiesWithFallback();
          if (citiesResult.success && citiesResult.cities.length > 0) {
            // Use first city from API
            const firstCity = citiesResult.cities[0].name;
            setSelectedCity(firstCity);
            setCitySelected(firstCity); // Update context
            if (onCityChange) {
              onCityChange(firstCity);
            }
            await AsyncStorage.setItem(SELECTED_CITY_KEY, firstCity);
          } else {
            // No city available - force selection
            setSelectedCity('');
            setNeedsCitySelection(true);
          }
        } catch (apiError) {
          // API error - force selection
          setSelectedCity('');
          setNeedsCitySelection(true);
        }
      }
    } catch (error) {
      console.error('Error loading selected city:', error);
      // Set empty city as fallback - user must select one
      setSelectedCity('');
      if (onCityChange) {
        onCityChange('');
      }
    }
  };
  
  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCitySelected(city); 
    setNeedsCitySelection(false); // Clear needs selection flag
    if (onCityChange) {
      onCityChange(city);
    }
    // Always close modal after city selection
    setShowCityFilter(false);
  };

  // Get profile image source
  const getProfileImageSource = () => {
    if (userData && userData.profileImageUri) {
      return { uri: userData.profileImageUri };
    }
    return null; 
  };

  // Handle search button press
  const handleSearchPress = () => {
    navigation.navigate('SearchPage', { selectedCity });
  };

  // Get the user's first name from auth context - wait for server data
  const getFirstName = () => {
    // First check auth context user - check for name property from server
    if (user && user.name) {
      return user.name.split(' ')[0]; // Extract first name from full name
    }
    
    // Legacy check for firstName (in case some data still has this format)
    if (user && user.firstName) {
      return user.firstName;
    }
    
    // Then check UserContext as fallback
    if (userData && userData.name) {
      return userData.name.split(' ')[0];
    }
    
    // Return fallback if user data exists but no name - otherwise null
    if (user || userData) {
      return 'User';
    }
    
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryUltraLight }]}>
      {/* Top section with user info and profile pic */}
      <View style={styles.topSection}>
        <View>
          <Text style={[styles.welcomeText, { color: theme.textPrimary }]}>
            Welcome, <Text style={[styles.userName, { color: theme.primaryLight }]}>
              {getFirstName()}
            </Text>
          </Text>
          <View style={styles.dateContainer}>
            <FontAwesome5
              name="calendar-alt"
              size={14}
              color={theme.primaryLight}
              style={styles.calendarIcon}
            />
            <Text style={[styles.dateText, { color: theme.textPrimary }]}>{todayDate}</Text>
          </View>
        </View>
        
        <View style={styles.profileSection}>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: theme.backgroundGray }]}>
            <FontAwesome5 name="bell" size={18} color={theme.textPrimary} />
            <View style={[styles.notificationBadge, { backgroundColor: theme.danger, borderColor: theme.white }]} />
          </TouchableOpacity>
          
          {getProfileImageSource() ? (
            <Image
              style={[styles.profileImage, { borderColor: theme.primaryLight }]}
              source={getProfileImageSource()}
            />
          ) : (
            <View style={[styles.profileImage, styles.profileIconContainer, { 
              borderColor: theme.primaryLight, 
              backgroundColor: theme.primaryUltraLight 
            }]}>
              <FontAwesome5 
                name="user" 
                size={20} 
                color={theme.primaryLight} 
              />
            </View>
          )}
        </View>
      </View>
      
      {/* Search and filter row */}
      <View style={styles.searchRow}>
        {/* Location/City Button */}
        <TouchableOpacity 
          style={[styles.locationButton, { backgroundColor: theme.primaryBackground }]}
          onPress={() => setShowCityFilter(true)}
        >
          <FontAwesome5 name="map-marker-alt" size={14} color={theme.primary} style={styles.locationIcon} />
          <Text style={[styles.locationText, { color: theme.primary }]} numberOfLines={1}>
            {selectedCity}
          </Text>
          <FontAwesome5 name="chevron-down" size={12} color={theme.primary} style={styles.chevronIcon} />
        </TouchableOpacity>
        
        {/* Search button */}
        <TouchableOpacity 
          style={[styles.searchIconButton, { backgroundColor: theme.white }]}
          onPress={handleSearchPress}
        >
          <FontAwesome5 name="search" size={16} color={theme.textExtraLight} />
        </TouchableOpacity>
      </View>
      
      {/* City Filter Modal */}
      <CityFilterModal
        visible={showCityFilter}
        onClose={() => citySelectionStatus.needsCitySelection ? {} : setShowCityFilter(false)}
        onSelectCity={handleCitySelect}
        forceSelect={citySelectionStatus.needsCitySelection}
      />
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: "18@s",
    paddingTop: "10@s",
    paddingBottom: "15@s",
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20@s",
  },
  welcomeText: {
    fontSize: "16@s",
    fontFamily: "Poppins-Medium",
  },
  userName: {
    fontFamily: "Poppins-Bold",
    fontSize: "16@s",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "4@s",
  },
  calendarIcon: {
    marginRight: "5@s",
  },
  dateText: {
    fontFamily: "Poppins-Light",
    fontSize: "13@s",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    width: "36@s",
    height: "36@s",
    borderRadius: "18@s",
    justifyContent: "center",
    alignItems: "center",
    marginRight: "12@s",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: "8@s",
    right: "10@s",
    width: "8@s",
    height: "8@s",
    borderRadius: "4@s",
    borderWidth: "1@s",
  },
  profileImage: {
    width: "40@s",
    height: "40@s",
    borderRadius: "20@s",
    borderWidth: "2@s",
  },
  profileIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchRow: {
    flexDirection: "row",
    marginTop: "5@s",
  },
  locationButton: {
    height: "45@s",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: "22.5@s",
    paddingHorizontal: "15@s",
    marginRight: "10@s",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: "1@s" },
    shadowOpacity: 0.1,
    shadowRadius: "2@s",
    elevation: 1,
  },
  locationIcon: {
    marginRight: "8@s",
  },
  locationText: {
    flex: 1,
    fontSize: "14@s",
    fontFamily: "Poppins-Medium",
  },
  chevronIcon: {
    marginLeft: "5@s",
  },
  searchIconButton: {
    width: "45@s",
    height: "45@s",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "22.5@s",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: "1@s" },
    shadowOpacity: 0.1,
    shadowRadius: "2@s",
    elevation: 1,
  }
});
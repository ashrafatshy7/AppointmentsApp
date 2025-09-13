// src/HomePage/LovedBusinesses.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { businessesData } from '../Service/HomePageData'; // Removed - file deleted
import { businessApi } from '../../Auth/Services/ApiService';
import Colors from '../../Constants/Colors';
import { useTheme } from '../../Context/ThemeContext';

const LOVED_BUSINESSES_KEY = 'loved_businesses';

const LovedBusinesses = ({ navigation, renderSectionHeader }) => {
  const { theme, isDarkMode } = useTheme();
  const [lovedBusinesses, setLovedBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load loved businesses from storage
  const loadLovedBusinesses = async () => {
    try {
      setIsLoading(true);
      const storedLovedBusinesses = await AsyncStorage.getItem(LOVED_BUSINESSES_KEY);
      
      if (storedLovedBusinesses) {
        const lovedBusinessIds = JSON.parse(storedLovedBusinesses);
        
        // Fetch business data from server for each ID
        const businessesWithData = [];
        for (const id of lovedBusinessIds) {
          try {
            const response = await businessApi.getDetails(id);
            if (response.success && response.data && response.data.business) {
              businessesWithData.push(response.data.business);
            }
          } catch (error) {
            console.error(`Error fetching business ${id}:`, error);
          }
        }
        
        // Reverse the array to show the most recently added ones first
        // (since toggleLovedBusiness adds new items to the end of the array)
        setLovedBusinesses(businessesWithData.reverse());
      } else {
        setLovedBusinesses([]);
      }
    } catch (error) {
      console.error('Error loading loved businesses:', error);
      setLovedBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on initial mount
  useEffect(() => {
    loadLovedBusinesses();
  }, []);
  
  // Add a listener for when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload loved businesses when screen comes into focus
      loadLovedBusinesses();
    });
    
    return unsubscribe;
  }, [navigation]);


  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.businessCard, {
        backgroundColor: theme.background,
        shadowColor: isDarkMode ? 'rgba(0,0,0,0.2)' : theme.black,
        borderColor: theme.border,
      }]}
      onPress={() => navigation.navigate("BusinessDetailsPage", { id: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.heartIconContainer}>
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)']}
          style={styles.heartGradient}
        >
          <FontAwesome name="heart" size={12} color={Colors.white} />
        </LinearGradient>
      </View>

      <View style={styles.logoContainer}>
        <View style={[styles.logoBackground, { backgroundColor: theme.primaryUltraLight }]}>
          <Image
            source={item.profileImage ? { uri: item.profileImage } : null}
            style={styles.businessLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.businessContent}>
        <Text style={[styles.businessName, { color: theme.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.ratingRow}>
          <FontAwesome name="star" size={12} color={Colors.secondary} />
          <Text style={[styles.ratingText, { color: Colors.secondary }]}>
            {item.rating || '4.5'}
          </Text>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.categoryText, { color: Colors.white }]}>
            {item.category}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <FontAwesome5 name="map-marker-alt" size={10} color={theme.primary} />
          <Text style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.city || item.address?.city || 'Location unavailable'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  // Show loading indicator
  if (isLoading) {
    return (
      <>
        {/* Render section header if provided */}
        {renderSectionHeader && renderSectionHeader()}
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading loved businesses...
          </Text>
        </View>
      </>
    );
  }

  // If no loved businesses, return null to hide the section
  if (lovedBusinesses.length === 0) {
    return null;
  }
  
  return (
    <>
      {/* Render section header if provided */}
      {renderSectionHeader && renderSectionHeader()}
      
      <View style={styles.container}>
        <FlatList
          data={lovedBusinesses}
          renderItem={renderBusinessItem}
          keyExtractor={(item, index) => `loved-${item.id || index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </>
  );
};

// Helper function to add/remove businesses from loved list
export const toggleLovedBusiness = async (businessId) => {
  try {
    // Get current loved businesses
    const storedLovedBusinesses = await AsyncStorage.getItem(LOVED_BUSINESSES_KEY);
    let lovedBusinessIds = storedLovedBusinesses ? JSON.parse(storedLovedBusinesses) : [];
    
    // Check if business is already loved
    const index = lovedBusinessIds.indexOf(businessId);
    
    if (index === -1) {
      // Add to loved
      lovedBusinessIds.push(businessId);
    } else {
      // Remove from loved
      lovedBusinessIds.splice(index, 1);
    }
    
    // Save back to storage
    await AsyncStorage.setItem(LOVED_BUSINESSES_KEY, JSON.stringify(lovedBusinessIds));
    
    // Return the new state (true if loved, false if not)
    return index === -1;
  } catch (error) {
    console.error('Error toggling loved business:', error);
    return false;
  }
};

// Helper function to check if a business is loved
export const isBusinessLoved = async (businessId) => {
  try {
    const storedLovedBusinesses = await AsyncStorage.getItem(LOVED_BUSINESSES_KEY);
    if (!storedLovedBusinesses) return false;
    
    const lovedBusinessIds = JSON.parse(storedLovedBusinesses);
    return lovedBusinessIds.includes(businessId);
  } catch (error) {
    console.error('Error checking if business is loved:', error);
    return false;
  }
};

const styles = ScaledSheet.create({
  container: {
    marginBottom: '20@s',
  },
  listContent: {
    paddingHorizontal: '15@s',
    paddingBottom: '5@s',
  },
  businessCard: {
    width: '160@s',
    borderRadius: '20@s',
    marginRight: '15@s',
    shadowOffset: { width: 0, height: '4@s' },
    shadowOpacity: 0.1,
    shadowRadius: '10@s',
    elevation: 5,
    borderWidth: 1,
    position: 'relative',
    paddingTop: '15@s',
    paddingBottom: '15@s',
    paddingHorizontal: '12@s',
  },
  heartIconContainer: {
    position: 'absolute',
    top: '10@s',
    right: '10@s',
    zIndex: 10,
  },
  heartGradient: {
    width: '28@s',
    height: '28@s',
    borderRadius: '14@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: '12@s',
  },
  logoBackground: {
    width: '80@s',
    height: '80@s',
    borderRadius: '40@s',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8@s',
  },
  businessLogo: {
    width: '64@s',
    height: '64@s',
  },
  businessContent: {
    alignItems: 'center',
  },
  businessName: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '6@s',
    textAlign: 'center',
    lineHeight: '18@s',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@s',
  },
  ratingText: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Medium',
    marginLeft: '4@s',
  },
  categoryBadge: {
    paddingHorizontal: '10@s',
    paddingVertical: '4@s',
    borderRadius: '12@s',
    marginBottom: '8@s',
  },
  categoryText: {
    fontSize: '10@s',
    fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: '11@s',
    fontFamily: 'Poppins-Regular',
    marginLeft: '4@s',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: '20@s',
  },
  loadingText: {
    marginTop: '8@s',
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
  },
});

export default LovedBusinesses;
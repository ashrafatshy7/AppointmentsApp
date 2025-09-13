// src/SearchPage/RecentlyViewed.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { businessesData } from '../Service/HomePageData'; // Removed - file deleted
import { businessApi } from '../../Auth/Services/ApiService';
import Colors from '../../Constants/Colors';

const RECENTLY_VIEWED_KEY = 'recently_viewed_businesses';

// Clear All Button Component
const ClearAllButton = ({ onClear }) => {
  const [hasRecentlyViewed, setHasRecentlyViewed] = useState(false);

  useEffect(() => {
    const checkRecentlyViewed = async () => {
      try {
        const storedData = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
        const hasData = storedData && JSON.parse(storedData).length > 0;
        setHasRecentlyViewed(hasData);
      } catch (error) {
        console.error('Error checking recently viewed:', error);
        setHasRecentlyViewed(false);
      }
    };

    checkRecentlyViewed();

    // Listen for focus events to update button visibility
    const interval = setInterval(checkRecentlyViewed, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAll = async () => {
    try {
      await AsyncStorage.removeItem(RECENTLY_VIEWED_KEY);
      setHasRecentlyViewed(false);
      if (onClear) onClear();
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  };

  if (!hasRecentlyViewed) return null;

  return (
    <TouchableOpacity onPress={handleClearAll}>
      <Text style={styles.clearButton}>Clear All</Text>
    </TouchableOpacity>
  );
};

const RecentlyViewed = ({ navigation }) => {
  const [recentlyViewedBusinesses, setRecentlyViewedBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recently viewed businesses from storage
  const loadRecentlyViewedBusinesses = async () => {
    try {
      setIsLoading(true);
      const storedRecentlyViewed = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);

      if (storedRecentlyViewed) {
        const recentlyViewedIds = JSON.parse(storedRecentlyViewed);

        // Fetch business data from server for each ID
        const businessesWithData = [];
        for (const id of recentlyViewedIds) {
          if (id) { // Only process valid IDs
            try {
              const response = await businessApi.getDetails(id);

              if (response.success && response.data && response.data.business) {
                businessesWithData.push(response.data.business);
              }
            } catch (error) {
              console.error(`Error fetching business ${id}:`, error);
            }
          }
        }

        setRecentlyViewedBusinesses(businessesWithData);
      } else {
        setRecentlyViewedBusinesses([]);
      }
    } catch (error) {
      console.error('Error loading recently viewed businesses:', error);
      setRecentlyViewedBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on initial mount
  useEffect(() => {
    loadRecentlyViewedBusinesses();
  }, []);

  // Add a listener for when screen comes into focus (when user returns from business details)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Small delay to ensure any pending AsyncStorage writes are completed
      setTimeout(() => {
        loadRecentlyViewedBusinesses();
      }, 100);
    });

    return unsubscribe;
  }, [navigation]);

  // Handle business press
  const handleBusinessPress = async (business) => {
    // Navigate to business details
    navigation.navigate('BusinessDetailsPage', { id: business.id });
  };


  // If still loading, show loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }
  
  // If no recently viewed businesses, show message
  if (recentlyViewedBusinesses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="history" size={40} color={Colors.textLight} />
        <Text style={styles.emptyText}>No recently viewed businesses</Text>
        <Text style={styles.emptySubtext}>Businesses you view will appear here</Text>
      </View>
    );
  }

  // Render business item
  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity
      style={styles.businessItem}
      onPress={() => handleBusinessPress(item)}
      activeOpacity={0.7}
    >
      {item.profileImage ? (
        <Image 
          source={{ uri: item.profileImage }} 
          style={styles.businessImage} 
        />
      ) : (
        <View style={[styles.businessImage, styles.businessIconContainer]}>
          <FontAwesome5 
            name="building" 
            size={20} 
            color={Colors.primary} 
          />
        </View>
      )}
      
      <View style={styles.businessInfo}>
        <Text style={styles.businessName} numberOfLines={1}>{item.name}</Text>
        
        <View style={styles.businessDetails}>
          <View style={styles.categoryContainer}>
            <FontAwesome5 name="tags" size={10} color={Colors.textLight} />
            <Text style={styles.detailText}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      <FontAwesome5 name="chevron-right" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recentlyViewedBusinesses}
        renderItem={renderBusinessItem}
        keyExtractor={(item, index) => `recent-${item.id || index}`}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '15@s',
    paddingVertical: '10@s',
  },
  subTitle: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textLight,
  },
  clearButton: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: '20@s',
  },
  loadingContainer: {
    padding: '20@s',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30@s',
  },
  emptyText: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
    marginTop: '15@s',
    marginBottom: '5@s',
  },
  emptySubtext: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
    textAlign: 'center',
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '15@s',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  businessImage: {
    width: '50@s',
    height: '50@s',
    borderRadius: '25@s',
    marginRight: '15@s',
  },
  businessIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryUltraLight,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
    marginBottom: '5@s',
  },
  businessDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '5@s',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
    marginLeft: '5@s',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.primary,
    marginLeft: '5@s',
  },
});

// Export both components
RecentlyViewed.ClearAllButton = ClearAllButton;
export default RecentlyViewed;
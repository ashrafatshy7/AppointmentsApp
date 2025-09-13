// src/SearchPage/SearchPage.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Keyboard
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ScaledSheet } from 'react-native-size-matters';
// import { businessesData } from '../Service/HomePageData'; // Removed - file deleted
// import { sampleServices } from '../Service/MockData'; // Removed - using dynamic data
import { businessApi, serviceApi } from '../../Auth/Services/ApiService';
import RecentlyViewed from '../Components/RecentlyViewed';
import Colors from '../../Constants/Colors';

const SearchPage = ({ route, navigation }) => {
  const { selectedCity } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(true);
  const [allServices, setAllServices] = useState([]);
  const [recentlyViewedKey, setRecentlyViewedKey] = useState(0); // Force re-render of RecentlyViewed
  
  // Fetch businesses and services dynamically
  useEffect(() => {
    const fetchData = async () => {
      try {
        // For now, we'll use a simple approach - in a real app you'd have a search API
        // This is a placeholder for the search functionality
        setAllServices([]);
      } catch (error) {
        console.error('Error fetching search data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Filter results based on search query and selected city
  useEffect(() => {
    if (searchQuery.trim() === '' || searchQuery.trim().length < 3) {
      setFilteredBusinesses([]);
      setFilteredServices([]);
      setShowRecentlyViewed(searchQuery.trim() === '');
      return;
    }
    
    setShowRecentlyViewed(false);
    
    // Perform search after 3 characters
    const performSearch = async () => {
      try {
        const query = searchQuery.trim().toLowerCase();
        
        // Get all businesses in the city, then filter by name on client side
        const businessResults = await businessApi.getByCity(selectedCity);
        
        if (businessResults.success) {
          const filteredBusinesses = businessResults.data.businesses?.filter(business =>
            business.name.toLowerCase().includes(query)
          ) || [];
          setFilteredBusinesses(filteredBusinesses);
        } else {
          console.error('Business search failed:', businessResults.error);
          setFilteredBusinesses([]);
        }
        
        // For services, we'll get services by business and filter
        // Since we don't have a direct service API, we'll search within businesses' services
        const servicesFound = [];
        if (businessResults.success && businessResults.data.businesses) {
          console.log(`Searching services for query "${query}" across ${businessResults.data.businesses.length} businesses`);
          
          for (const business of businessResults.data.businesses) {
            try {
              // Get services for each business
              console.log(`Fetching services for business ID: ${business.id} (${business.name})`);
              const serviceResults = await serviceApi.getByBusiness(business.id);
              console.log(`Service API response for ${business.name}:`, serviceResults);
              
              if (serviceResults.success && serviceResults.data) {
                const services = serviceResults.data.services || serviceResults.data;
                console.log(`Business ${business.name} has services:`, services);
                
                if (Array.isArray(services)) {
                  console.log(`Processing ${services.length} services for ${business.name}`);
                  
                  const matchingServices = services.filter(service => {
                    // Only process services with valid names
                    if (!service || !service.name) {
                      return false;
                    }
                    
                    return service.name.toLowerCase().includes(query);
                  }).map((service, serviceIndex) => ({
                    ...service,
                    // Ensure service has an ID for key generation
                    id: service.id || `temp-${business.id}-${serviceIndex}`,
                    business: {
                      id: business.id,
                      name: business.name,
                      city: business.city
                    }
                  }));
                  servicesFound.push(...matchingServices);
                } else {
                  console.log(`Services is not an array for ${business.name}:`, services);
                }
              } else {
                console.log(`❌ No services found for business ${business.name}:`, serviceResults.error || 'Unknown error');
              }
            } catch (error) {
              console.error(`Error fetching services for business ${business.id}:`, error);
            }
          }
        }
        
        console.log(`Total services found: ${servicesFound.length}`);
        setFilteredServices(servicesFound);
        
      } catch (error) {
        console.error('Search error:', error);
        setFilteredBusinesses([]);
        setFilteredServices([]);
      }
    };
    
    // Debounce search by 300ms to avoid too many API calls
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCity]);

  // Handle business selection
  const handleBusinessPress = (business) => {
    // Navigate to business details - let BusinessDetailsPage handle adding to recently viewed
    navigation.navigate('BusinessDetailsPage', { id: business.id });
  };

  // Handle service selection
  const handleServicePress = (service) => {
    const businessId = service.business?.id || service.businessId;

    // Navigate to business details with selected service - let BusinessDetailsPage handle adding to recently viewed
    navigation.navigate('BusinessDetailsPage', {
      id: businessId,
      serviceId: service.id // The business details page can use this to auto-scroll to the service
    });
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowRecentlyViewed(true);
    Keyboard.dismiss();
  };

  // Render a business item
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
        <View style={styles.businessMeta}>
          <FontAwesome5 
            name="map-marker-alt" 
            size={12} 
            color={Colors.primary} 
            style={styles.metaIcon} 
          />
          <Text style={styles.businessLocation}>
            {item.city || 'Unknown location'}
          </Text>
        </View>
      </View>
      <FontAwesome5 name="chevron-right" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );

  // Render a service item (without image)
  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => handleServicePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.servicePrice}>
          {item.price ? `$${item.price}` : 'Price on request'}
        </Text>
        <View style={styles.serviceMeta}>
          <Text style={styles.businessNameSmall} numberOfLines={1}>
            {item.business?.name || 'Unknown business'}
          </Text>
          <View style={styles.serviceLocation}>
            <FontAwesome5 
              name="map-marker-alt" 
              size={10} 
              color={Colors.primary} 
              style={styles.metaIcon} 
            />
            <Text style={styles.locationText}>
              {item.business?.city || 'Unknown location'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primaryUltraLight} />
      
      {/* Search header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.searchInputContainer}>
          <FontAwesome5 name="search" size={16} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${selectedCity || 'all cities'}...`}
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <FontAwesome5 name="times-circle" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Search results or recently viewed */}
      {showRecentlyViewed ? (
        // Show recently viewed businesses when no search query
        <View style={styles.recentlyViewedContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
            <RecentlyViewed.ClearAllButton onClear={() => setRecentlyViewedKey(prev => prev + 1)} />
          </View>
          <RecentlyViewed
            key={recentlyViewedKey}
            navigation={navigation}
          />
        </View>
      ) : (
        // Show search results
        <FlatList
          data={[]}
          ListHeaderComponent={() => (
            <>
              {/* Businesses section */}
              {filteredBusinesses.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Businesses</Text>
                    <Text style={styles.resultCount}>
                      {filteredBusinesses.length} result{filteredBusinesses.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <FlatList
                    data={filteredBusinesses}
                    renderItem={renderBusinessItem}
                    keyExtractor={item => `business-${item.id}`}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {/* Services section */}
              {filteredServices.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    <Text style={styles.resultCount}>
                      {filteredServices.length} result{filteredServices.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <FlatList
                    data={filteredServices}
                    renderItem={renderServiceItem}
                    keyExtractor={(item, index) => `service-${item.id || index}-${item.business?.id || item.businessId || index}`}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {/* No results */}
              {filteredBusinesses.length === 0 && filteredServices.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <FontAwesome5 name="search" size={50} color={Colors.textLight} />
                  <Text style={styles.noResultsText}>
                    No results found for "{searchQuery}" in {selectedCity || 'all cities'}
                  </Text>
                  <Text style={styles.noResultsSubtext}>
                    Try searching with different keywords
                  </Text>
                </View>
              )}
            </>
          )}
          renderItem={() => null}
          style={styles.resultsContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryUltraLight,
  },
  searchHeader: {
    flexDirection: 'row',
    padding: '15@s',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: '15@s',
    padding: '5@s',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.backgroundGray,
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '8@s',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: '10@s',
  },
  searchInput: {
    flex: 1,
    fontSize: '16@s',
    color: Colors.textPrimary,
    fontFamily: 'Poppins-Regular',
  },
  clearButton: {
    padding: '5@s',
  },
  recentlyViewedContainer: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '15@s',
    paddingVertical: '10@s',
    backgroundColor: Colors.backgroundLight,
  },
  sectionTitle: {
    fontSize: '16@s',
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
  },
  resultCount: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
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
  businessMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: '5@s',
  },
  businessLocation: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '15@s',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
  },
  servicePrice: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
    color: Colors.primary,
    marginBottom: '5@s',
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessNameSmall: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
    flex: 1,
    marginRight: '10@s',
  },
  serviceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
  },
  noResultsContainer: {
    padding: '30@s',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: '20@s',
    marginBottom: '10@s',
  },
  noResultsSubtext: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
    textAlign: 'center',
  },
});

export default SearchPage;
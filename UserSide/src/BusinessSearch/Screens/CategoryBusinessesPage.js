// src/CategoryBusinessesPage/CategoryBusinessesPage.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  StyleSheet, 
  StatusBar
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { businessApi } from '../../Auth/Services/ApiService';
import CityFilterModal from '../../Components/Common/CityFilterModal';
import Colors from '../../Constants/Colors';

const CategoryBusinessesPage = ({ route, navigation }) => {
  // Get params from route
  const { categoryId, selectedCity: initialCity } = route.params || {};
  
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || null);
  const [categories, setCategories] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [showCityFilter, setShowCityFilter] = useState(false);
  const categoriesListRef = useRef(null);
  
  // Fetch categories from server
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Filter businesses when selected category or city changes
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId) {
      fetchBusinessesByCategory();
    }
  }, [selectedCategoryId, selectedCity, categories]);
  
  const fetchCategories = async () => {
    try {
      const response = await businessApi.getCategories();
      if (response.success) {
        setCategories(response.data);
        // Set first category as default if none selected
        if (!selectedCategoryId && response.data.length > 0) {
          setSelectedCategoryId(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const fetchBusinessesByCategory = async () => {
    try {
      setIsLoading(true);
      const selectedCategory = categories.find(cat => cat._id === selectedCategoryId);
      if (selectedCategory) {
        const response = await businessApi.getByCategory(selectedCategory.name);
        if (response.success) {
          let filtered = response.data;
          
          // Filter by selected city
          if (selectedCity) {
            filtered = filtered.filter(
              business => business.location && business.location.city === selectedCity
            );
          }
          
          setFilteredBusinesses(filtered);
        }
      }
    } catch (error) {
      console.error('Error fetching businesses by category:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Scroll to selected category when it changes
  useEffect(() => {
    if (categoriesListRef.current && selectedCategoryId) {
      // Find index of selected category
      const index = categoriesData.findIndex(cat => cat.id === selectedCategoryId);
      if (index !== -1) {
        // Scroll to the selected category with a small delay to ensure the list is rendered
        setTimeout(() => {
          categoriesListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5, // 0.5 centers the item, 0 aligns to start, 1 aligns to end
            viewOffset: 0,
          });
        }, 100);
      }
    }
  }, [selectedCategoryId]);
  
  // Get the selected category object
  const getSelectedCategory = () => {
    return categories.find(cat => cat._id === selectedCategoryId) || categories[0] || {};
  };
  
  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };
  
  // Render category item
  const renderCategoryItem = ({ item }) => {
    const isSelected = item._id === selectedCategoryId;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isSelected && styles.selectedCategoryItem
        ]}
        onPress={() => setSelectedCategoryId(item._id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.categoryIcon,
          isSelected && styles.selectedCategoryIcon
        ]}>
          <FontAwesome5
            name={item.icon}
            size={16}
            color={isSelected ? Colors.white : Colors.primary}
          />
        </View>
        <Text style={[
          styles.categoryName,
          isSelected && styles.selectedCategoryName
        ]}>
          {item.name}
        </Text>
              </TouchableOpacity>
    );
  };
  
  // Handle scroll error for FlatList
  const handleScrollToIndexFailed = (info) => {
    const wait = new Promise(resolve => setTimeout(resolve, 100));
    wait.then(() => {
      if (categoriesListRef.current) {
        categoriesListRef.current.scrollToIndex({ 
          index: info.index, 
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };
  
  // Render business item
  const renderBusinessItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.businessCard}
        onPress={() => navigation.navigate("BusinessDetailsPage", { id: item.id })}
        activeOpacity={0.8}
      >
        <Image
          source={item.profileImage}
          style={styles.businessImage}
          resizeMode="cover"
        />
        
        <View style={styles.businessContent}>
          <View style={styles.businessHeader}>
            <Text style={styles.businessName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={12} color={Colors.secondary} />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          </View>
          
          <Text style={styles.businessDescription} numberOfLines={2}>
            {item.bio}
          </Text>
          
          <View style={styles.businessFooter}>
            <View style={styles.businessFooterItem}>
              <FontAwesome5 name="map-marker-alt" size={12} color={Colors.primary} />
              <Text style={styles.businessFooterText}>
                {item.location ? item.location.city : 'Location unavailable'}
              </Text>
            </View>
            <View style={styles.businessFooterItem}>
              <FontAwesome5 name="clock" size={12} color={Colors.textLight} />
              <Text style={styles.businessFooterText}>Open until 17:00</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primaryUltraLight} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getSelectedCategory().name}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCityFilter(true)}
        >
          <FontAwesome5 name="map-marker-alt" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Categories horizontal list */}
      <View style={styles.categoriesContainer}>
        <FlatList
          ref={categoriesListRef}
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item._id}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          initialNumToRender={categories.length} // Render all categories initially
        />
      </View>
      
      {/* Results info */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {isLoading ? 
            'Loading...' : 
            `${filteredBusinesses.length} result${filteredBusinesses.length !== 1 ? 's' : ''} ${
              selectedCity ? `in ${selectedCity}` : ''
            }`
          }
        </Text>
        <TouchableOpacity
          style={styles.cityButton}
          onPress={() => setShowCityFilter(true)}
        >
          <Text style={styles.cityButtonText}>{selectedCity}</Text>
          <FontAwesome5 name="chevron-down" size={10} color={Colors.primary} style={styles.cityButtonIcon} />
        </TouchableOpacity>
      </View>
      
      {/* Businesses list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      ) : filteredBusinesses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="store-slash" size={50} color={Colors.textLight} />
          <Text style={styles.emptyText}>
            {selectedCity 
              ? `No ${getSelectedCategory().name} businesses found in ${selectedCity}` 
              : `No ${getSelectedCategory().name} businesses found`}
          </Text>
          <TouchableOpacity 
            style={styles.changeFilterButton}
            onPress={() => setShowCityFilter(true)}
          >
            <Text style={styles.changeFilterText}>Change City</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBusinesses}
          renderItem={renderBusinessItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.businessesList}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* City Filter Modal */}
      <CityFilterModal
        visible={showCityFilter}
        onClose={() => setShowCityFilter(false)}
        onSelectCity={handleCitySelect}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryUltraLight,
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '15@s',
    paddingVertical: '12@s',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: '5@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
  },
  filterButton: {
    padding: '5@s',
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
  },
  categoriesList: {
    paddingVertical: '12@s',
    paddingHorizontal: '10@s',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '8@s',
    paddingHorizontal: '12@s',
    marginHorizontal: '6@s',
    borderRadius: '20@s',
    backgroundColor: Colors.backgroundGray,
  },
  selectedCategoryItem: {
    backgroundColor: Colors.primaryBackground,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryIcon: {
    width: '28@s',
    height: '28@s',
    borderRadius: '14@s',
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '8@s',
  },
  selectedCategoryIcon: {
    backgroundColor: Colors.primary,
  },
  categoryName: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
  },
  selectedCategoryName: {
    color: Colors.primary,
    fontFamily: 'Poppins-SemiBold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '15@s',
    paddingVertical: '10@s',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultsText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textSecondary,
  },
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBackground,
    paddingVertical: '5@s',
    paddingHorizontal: '10@s',
    borderRadius: '15@s',
  },
  cityButtonText: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    marginRight: '5@s',
  },
  cityButtonIcon: {
    marginLeft: '3@s',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@s',
  },
  loadingText: {
    marginTop: '15@s',
    fontSize: '16@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@s',
  },
  emptyText: {
    marginTop: '15@s',
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
    marginBottom: '10@s',
    textAlign: 'center',
  },
  changeFilterButton: {
    paddingVertical: '8@s',
    paddingHorizontal: '15@s',
    borderRadius: '8@s',
    backgroundColor: Colors.primaryBackground,
  },
  changeFilterText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  businessesList: {
    padding: '12@s',
  },
  businessCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: '10@s',
    marginBottom: '10@s',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '3@s',
    elevation: 2,
    overflow: 'hidden',
  },
  businessImage: {
    width: '100@s',
    height: '100%',
  },
  businessContent: {
    flex: 1,
    padding: '10@s',
    justifyContent: 'space-between',
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5@s',
  },
  businessName: {
    fontSize: '15@s',
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: '5@s',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
    paddingHorizontal: '6@s',
    paddingVertical: '3@s',
    borderRadius: '10@s',
  },
  ratingText: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Medium',
    color: Colors.textPrimary,
    marginLeft: '3@s',
  },
  businessDescription: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
    marginBottom: '5@s',
    lineHeight: '16@s',
  },
  businessFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  businessFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '5@s',
    marginLeft: '5@s',
  },
  businessFooterText: {
    fontSize: '11@s',
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
    marginLeft: '4@s',
  },
});

export default CategoryBusinessesPage;
// src/HomePage/Businesses.js
import React, { useState, useEffect } from "react";
import { FlatList, TouchableOpacity, View, Text, Image, ActivityIndicator } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import Colors from "../../Constants/Colors";
import { useTheme } from '../../Context/ThemeContext';
import { businessApi } from "../../Auth/Services/ApiService";

export default function Businesses({ navigation, selectedCity, selectedCategory }) {
  const { theme, isDarkMode } = useTheme();
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch businesses when city or category changes
  useEffect(() => {
    if (!selectedCity) {
      setBusinesses([]);
      setIsLoading(false);
      return;
    }
    
    const fetchBusinesses = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let result;
        
        if (selectedCategory === null) {
          // Show all businesses in the city
          result = await businessApi.getByCity(selectedCity);
        } else if (selectedCategory) {
          // Get all businesses in the city first, then filter by category
          result = await businessApi.getByCity(selectedCity);
          
          if (result.success) {
            // Filter the businesses by category on client side
            const filteredBusinesses = result.data.businesses?.filter(business => {
              // Since we're now passing category names, compare directly with business category
              const businessCategory = business.category;
              
              if (typeof businessCategory === 'string') {
                // Direct string comparison (case-insensitive)
                return businessCategory.toLowerCase() === selectedCategory.toLowerCase();
              } else if (businessCategory && businessCategory.name) {
                // If category is an object with name property
                return businessCategory.name.toLowerCase() === selectedCategory.toLowerCase();
              }
              
              return false;
            }) || [];
            
            result = {
              success: true,
              data: { businesses: filteredBusinesses }
            };
          }
        } else {
          // Default behavior - show businesses in city
          result = await businessApi.getByCity(selectedCity);
        }
        
        if (result.success) {
          setBusinesses(result.data.businesses || []);
        } else {
          setError(result.error || 'Failed to fetch businesses');
          setBusinesses([]);
        }
      } catch (err) {
        setError('Network error. Please try again.');
        setBusinesses([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinesses();
  }, [selectedCity, selectedCategory]);


  const renderBusinessItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.businessCard, { 
          backgroundColor: theme.background,
          shadowColor: theme.black
        }]}
        onPress={() => navigation.navigate("BusinessDetailsPage", { 
          id: item.id,
          // Pass all available details except time
          businessData: {
            id: item.id,
            name: item.name,
            profileImage: item.profileImage,
            category: item.category,
            city: item.city,
            // Exclude workingHours (time) as requested
          }
        })}
        activeOpacity={0.8}
      >
        <Image 
          source={item.profileImage ? { uri: item.profileImage } : null} 
          style={styles.businessImage} 
          resizeMode="cover" 
        />
        
        <View style={styles.businessInfoContainer}>
          <View style={styles.businessHeader}>
            <Text style={[styles.businessName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            
            <View style={[styles.ratingContainer, { backgroundColor: theme.backgroundGray }]}>
              <FontAwesome name="star" size={12} color={Colors.secondary} />
              <Text style={[styles.ratingText, { color: theme.textPrimary }]}>4.5</Text>
            </View>
          </View>
          
          <View style={styles.categoryContainer}>
            <FontAwesome5 name="tags" size={10} color={theme.primaryLight} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: theme.primaryLight }]}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>
          
          <View style={styles.businessFooter}>
            <View style={styles.locationContainer}>
              <FontAwesome5 name="map-marker-alt" size={10} color={theme.primary} style={styles.locationIcon} />
              <Text style={[styles.locationText, { color: theme.primary }]}>
                {item.city || 'Location unavailable'}
              </Text>
            </View>
            
            <View style={styles.timeContainer}>
              <FontAwesome5 name="clock" size={10} color={theme.textLight} style={styles.timeIcon} />
              <Text style={[styles.timeText, { color: theme.textLight }]}>
                {item.workingHours ? `${item.workingHours.open} - ${item.workingHours.close}` : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <FontAwesome5 name="chevron-right" size={16} color={theme.primaryLight} />
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading businesses...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="exclamation-triangle" size={50} color={theme.danger} />
        <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
          {error}
        </Text>
      </View>
    );
  }

  if (businesses.length === 0 && !isLoading) {
    const emptyMessage = selectedCategory === null 
      ? `No businesses found in ${selectedCity}`
      : selectedCategory 
      ? `No businesses found for this category in ${selectedCity}`
      : `No businesses found in ${selectedCity}`;
      
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="store-slash" size={50} color={theme.textLight} />
        <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={businesses}
        renderItem={renderBusinessItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: "15@s",
    
  },
  loadingContainer: {
    padding: "30@s",
    alignItems: "center",
  },
  loadingText: {
    marginTop: "10@s",
    fontSize: "14@s",
    fontFamily: "Poppins-Regular",
  },
  emptyContainer: {
    padding: "30@s",
    alignItems: "center",
  },
  emptyText: {
    marginTop: "15@s",
    fontSize: "16@s",
    fontFamily: "Poppins-Medium",
    marginBottom: "10@s",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: "10@s",
  },
  businessCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: "12@s",
    padding: "12@s",
    marginBottom: "8@s",
    shadowOffset: { width: 0, height: "2@s" },
    shadowOpacity: 0.1,
    shadowRadius: "3@s",
    elevation: 3,
  },
  businessImage: {
    width: "70@s",
    height: "70@s",
    borderRadius: "10@s",
    backgroundColor: Colors.backgroundGray,
  },
  businessInfoContainer: {
    flex: 1,
    marginLeft: "12@s",
    justifyContent: "space-between",
    height: "60@s",
  },
  businessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  businessName: {
    fontSize: "14@s",
    fontFamily: "Poppins-SemiBold",
    flex: 1,
    marginRight: "5@s",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "6@s",
    paddingVertical: "2@s",
    borderRadius: "8@s",
  },
  ratingText: {
    fontSize: "11@s",
    fontFamily: "Poppins-Medium",
    marginLeft: "3@s",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    marginRight: "5@s",
  },
  categoryText: {
    fontSize: "12@s",
    fontFamily: "Poppins-Regular",
  },
  businessFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: "4@s",
  },
  locationText: {
    fontSize: "11@s",
    fontFamily: "Poppins-Regular",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    marginRight: "4@s",
  },
  timeText: {
    fontSize: "11@s",
    fontFamily: "Poppins-Regular",
  },
  arrowContainer: {
    width: "24@s",
    height: "24@s",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "5@s",
  },
  separator: {
    height: "5@s",
  },
});
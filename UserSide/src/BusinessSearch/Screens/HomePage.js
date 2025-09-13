// src/HomePage/HomePage.js
import { ScrollView, Text, View, TouchableOpacity, StatusBar } from "react-native";
import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import { ScaledSheet } from "react-native-size-matters";
import { FontAwesome5 } from "@expo/vector-icons";

import Header from "../Components/Header";
import Categories from "../Components/Categories";
import Businesses from "../Components/Businesses";
import LovedBusinesses from "../Components/LovedBusinesses";
import Colors from "../../Constants/Colors";

import { useTheme } from '../../Context/ThemeContext';
import { ThemedStatusBar } from '../../Components/Themed/ThemedStatusBar';
import { RefreshControl } from "react-native";

export default function HomePage({ navigation }) {
  const { theme } = useTheme();
  const [selectedCity, setSelectedCity] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Check if user has any loved businesses for conditional rendering
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      // This will execute when the screen comes into focus (including back navigation)
    });
    
    return unsubscribeFocus;
  }, [navigation]);

  // Handle category selection
  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  // Handle city change
  const handleCityChange = (city) => {
    setSelectedCity(city);
  };


  // Pull-to-refresh handler
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      // Bump a key to force child components (which fetch data on mount) to remount
      // This will also refresh the Header component which displays the profile picture
      setRefreshKey((k) => k + 1);
    } finally {
      // Give children a moment to mount and kick off their fetches before ending the spinner
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryUltraLight }]}>
      <ThemedStatusBar />
      
      <ScrollView style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header */}
        <Header key={`header-${refreshKey}`} onCityChange={handleCityChange} />
        
        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <FontAwesome5 
              name="th-large" 
              size={16} 
              color={theme.primaryDark} 
              style={styles.sectionIcon} 
            />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Categories
            </Text>
          </View>
        </View>
        
        {/* Categories */}
        <Categories 
          key={`categories-${refreshKey}`} 
          onCategoryPress={handleCategoryPress}
        />
        
        {/* Loved Businesses Section */}
        <LovedBusinesses 
          key={`loved-${refreshKey}`}
          navigation={navigation}
          renderSectionHeader={() => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5 name="heart" size={16} color={Colors.primaryDark} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Loved Businesses</Text>
              </View>
            </View>
          )}
        />
        
        {/* Businesses Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <FontAwesome5 name="fire" size={16} color={Colors.primaryDark} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>
              {selectedCity ? `Businesses in ${selectedCity}` : "Businesses"}
            </Text>
          </View>
        </View>
        
        {/* Businesses */}
        <Businesses 
          key={`businesses-${selectedCity}-${selectedCategory}-${refreshKey}`}
          navigation={navigation} 
          selectedCity={selectedCity}
          selectedCategory={selectedCategory}
        />
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = ScaledSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.primaryUltraLight,
  },
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "18@s",
    marginTop: "5@s",
    
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: "8@s",
  },
  sectionTitle: {
    fontSize: "16@s",
    fontFamily: "Poppins-SemiBold",
    color: Colors.textPrimary,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: "12@s",
    fontFamily: "Poppins-Medium",
    color: Colors.primaryDark,
    marginRight: "5@s",
  },
  bottomPadding: {
    height: "20@s",
  },
});
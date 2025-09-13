// src/HomePage/Categories.js

import React, { useState, useEffect } from "react";
import { FlatList, TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { ScaledSheet } from "react-native-size-matters";
import Colors from "../../Constants/Colors";
import { useTheme } from '../../Context/ThemeContext';
import { businessApi } from '../../Auth/Services/ApiService';

export default function Categories({ onCategoryPress }) {
  const { theme, isDarkMode } = useTheme();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories from server
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await businessApi.getCategories();
      
      if (response.success) {
        // Add "All Businesses" item at the beginning
        const allBusinessesItem = {
          _id: 'all-businesses',
          name: 'All',
          icon: 'store',
          isAllBusinesses: true
        };
        setCategories([allBusinessesItem, ...response.data]);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };


  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => onCategoryPress(item.isAllBusinesses ? null : item.name)}
        activeOpacity={0.7}
      >
        <View style={[styles.circleContainer, {
          backgroundColor: theme.backgroundGray,
          shadowColor: theme.black
        }]}>
          <FontAwesome5
            name={item.icon}
            size={22}
            color={theme.primaryDark}
          />
        </View>
        <Text 
          style={[styles.categoryName, {
            color: theme.textPrimary
          }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading categories...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          {error}
        </Text>
        <TouchableOpacity onPress={fetchCategories} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: theme.primary }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No categories available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    marginTop: '15@s',
    marginBottom: '10@s',
  },
  categoryItem: {
    marginTop: '5@s',
    alignItems: 'center',
    marginRight: '20@s',
    width: '80@s',
  },
  circleContainer: {
    width: '60@s',
    height: '60@s',
    borderRadius: '30@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8@s',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 3,
  },
  categoryName: {
    fontSize: '12@s',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: '20@s',
  },
  loadingText: {
    marginTop: '8@s',
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: '20@s',
  },
  errorText: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
    marginBottom: '10@s',
  },
  retryButton: {
    paddingHorizontal: '16@s',
    paddingVertical: '8@s',
    borderRadius: '6@s',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    fontSize: '14@s',
    fontFamily: 'Inter-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: '20@s',
  },
  emptyText: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
  },
  listContent: {
    paddingHorizontal: '18@s',
  },
});
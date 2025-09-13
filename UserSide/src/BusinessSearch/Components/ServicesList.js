// src/BusinessDetailsPage/ServicesList.js
import React, { useCallback, memo } from "react";
import { View, FlatList, TouchableOpacity, Text } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { FontAwesome5 } from "@expo/vector-icons";
// import { sampleServices } from "../Service/MockData"; // No longer needed - using real data
import { useTheme } from '../../Context/ThemeContext';

// Memoized service item to prevent unnecessary re-renders
const ServiceItem = memo(({ item, onServiceSelect }) => {
  const { theme } = useTheme();
  
  const handlePress = useCallback(() => {
    onServiceSelect(item);
  }, [item, onServiceSelect]);

  const handleBookPress = useCallback(() => {
    onServiceSelect(item);
  }, [item, onServiceSelect]);

  return (
    <TouchableOpacity 
      style={[styles.serviceItem, {
        backgroundColor: theme.background,
        shadowColor: theme.black
      }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.serviceInfo}>
        <View>
          <Text style={[styles.serviceName, { color: theme.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.serviceDescription, { color: theme.textLight }]} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
        </View>
        <View style={styles.serviceBottomRow}>
          <Text style={[styles.serviceDuration, { color: theme.textLight }]}>
            <FontAwesome5 name="clock" size={12} color={theme.textLight} /> {item.durationMinutes} min
          </Text>
          <Text style={[styles.servicePrice, { color: theme.primary }]}>${item.price}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.bookIconWrapper, { backgroundColor: theme.primary }]}
        onPress={handleBookPress}
      >
        <FontAwesome5 name="calendar-plus" size={16} style={[styles.bookIcon, { color: theme.white }]} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const ServicesList = ({ services = [], onServiceSelect }) => {
  const { theme } = useTheme();
  
  // Memoize the key extractor function
  const keyExtractor = useCallback((item) => item._id.toString(), []);
  
  // Memoize the render item function
  const renderServiceItem = useCallback(({ item }) => (
    <ServiceItem 
      item={item} 
      onServiceSelect={onServiceSelect}
    />
  ), [onServiceSelect]);

  // Show message if no services
  if (!services || services.length === 0) {
    return (
      <View style={[styles.tabContent, {
        backgroundColor: theme.background,
        shadowColor: theme.black
      }]}>
        <View style={styles.noServicesContainer}>
          <Text style={[styles.noServicesText, { color: theme.textSecondary }]}>
            No services available for this business
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tabContent, {
      backgroundColor: theme.background,
      shadowColor: theme.black
    }]}>
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={[styles.serviceSeparator, { backgroundColor: theme.borderLight }]} />}
        scrollEnabled={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  tabContent: {
    marginTop: "10@s",
    borderRadius: "12@s",
    padding: "15@s",
    shadowOffset: { width: 0, height: "2@s" },
    shadowOpacity: 0.1,
    shadowRadius: "4@s",
    elevation: 3,
  },
  serviceItem: {
    flexDirection: "row",
    padding: "12@s",
    borderRadius: "12@s",
    marginVertical: "6@s",
    shadowOffset: { width: 0, height: "1@s" },
    shadowOpacity: 0.05,
    shadowRadius: "2@s",
    elevation: 1,
  },

  serviceInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  serviceName: {
    fontSize: "16@s",
    fontFamily: "Inter-SemiBold",
    marginBottom: "4@s",
  },
  serviceDescription: {
    fontSize: "13@s",
    fontFamily: "Inter-Regular",
    marginBottom: "6@s",
    lineHeight: "18@s",
  },
  serviceBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceDuration: {
    fontSize: "12@s",
    fontFamily: "Inter-Regular",
  },
  servicePrice: {
    fontSize: "16@s",
    fontFamily: "Inter-Bold",
  },
  bookIconWrapper: {
    width: "36@s",
    height: "36@s",
    borderRadius: "18@s",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "10@s",
  },
  bookIcon: {
    // Color set dynamically
  },
  serviceSeparator: {
    height: "1@s",
    marginVertical: "4@s",
  },
  noServicesContainer: {
    padding: "20@s",
    alignItems: 'center',
    justifyContent: 'center',
  },
  noServicesText: {
    fontSize: "16@s",
    textAlign: 'center',
  },
});

export default memo(ServicesList);
// src/BusinessDetailsPage/ImageNameRatingSocial.js
import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { ScaledSheet } from "react-native-size-matters";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { isBusinessLoved, toggleLovedBusiness } from "./LovedBusinesses";
import Colors from '../../Constants/Colors';
import { useTheme } from '../../Context/ThemeContext';

export default function ImageNameRatingSocial({
  businessId,
  name,
  profileImage,
  coverImage,
  rating,
}) {
  const { theme, isDarkMode } = useTheme();
  const [isLoved, setIsLoved] = useState(false);
  

  
  // Check if business is loved on component mount
  useEffect(() => {
    const checkIfLoved = async () => {
      const loved = await isBusinessLoved(businessId);
      setIsLoved(loved);
    };
    
    checkIfLoved();
  }, [businessId]);
  
  // Handle love button press
  const handleToggleLove = async () => {
    try {
      // Toggle loved status in AsyncStorage
      const newLovedStatus = await toggleLovedBusiness(businessId);
      // Update UI state
      setIsLoved(newLovedStatus);
      
      // Optional: Show feedback to the user
      if (newLovedStatus) {
        // Could show a small toast notification here
        console.log('Added to loved businesses');
      } else {
        console.log('Removed from loved businesses');
      }
    } catch (error) {
      console.error('Error toggling loved status:', error);
    }
  };

  return (
    <View>
      {coverImage ? (
        <Image 
          style={[styles.coverImage, { borderColor: theme.primary }]} 
          source={{ uri: coverImage }} 
          resizeMode="cover"
          onError={(error) => console.log('Cover image error:', error.nativeEvent.error)}
        />
      ) : (
        <View style={[styles.coverImage, styles.coverIconContainer, { borderColor: theme.primary, backgroundColor: theme.primaryUltraLight }]}>
          <FontAwesome5 
            name="building" 
            size={40} 
            color={theme.primary} 
          />
        </View>
      )}
      {profileImage ? (
        <Image 
          style={[styles.profileImage, { borderColor: theme.primary }]} 
          source={{ uri: profileImage }} 
          resizeMode="cover"
          onError={(error) => console.log('Profile image error:', error.nativeEvent.error)}
        />
      ) : (
        <View style={[styles.profileImage, styles.profileIconContainer, { borderColor: theme.primary, backgroundColor: theme.primaryUltraLight }]}>
          <FontAwesome5 
            name="building" 
            size={24} 
            color={theme.primary} 
          />
        </View>
      )}
      <View style={styles.row}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
        <View style={styles.rowActions}>
          <View style={styles.rowRating}>
            <FontAwesome name="star" style={styles.star} />
            <Text style={[styles.rating, { color: theme.textPrimary }]}>{rating}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.loveButton, { backgroundColor: theme.backgroundGray }]}
            onPress={handleToggleLove}
          >
            <FontAwesome 
              name={isLoved ? "heart" : "heart-o"} 
              style={[
                styles.loveIcon,
                { color: theme.textPrimary },
                isLoved && styles.lovedIcon
              ]} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = ScaledSheet.create({
  coverImage: {
    width: "100%",
    height: "170@s",
    borderRadius: "5@s",
    borderWidth: "1@s",
    marginBottom: "-45@s",
  },
  coverIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    marginLeft: "15@s",
    width: "65@s",
    height: "65@s",
    borderRadius: "30@s",
    borderWidth: "1.3@s",
  },
  profileIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    marginHorizontal: "5@s",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowRating: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: "12@s",
  },
  star: {
    fontSize: "15@s",
    color: "#FFA700",
  },
  rating: {
    fontSize: "15@s",
    marginLeft: "4@s",
  },
  name: {
    marginTop: "10@s",
    fontSize: "17@s",
    fontFamily: "Inter-SemiBold",
  },
  loveButton: {
    width: "32@s",
    height: "32@s",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "16@s",
  },
  loveIcon: {
    fontSize: "18@s",
  },
  lovedIcon: {
    color: Colors.danger,
  },
});
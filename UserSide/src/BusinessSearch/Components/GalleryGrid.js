// src/BusinessDetailsPage/GalleryGrid.js
import React, { useState } from "react";
import { View, TouchableOpacity, Image, Text, Modal, Dimensions } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { useTheme } from '../../Context/ThemeContext';

const GalleryGrid = ({ gallery }) => {
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  
  // Base URL for the server
  const SERVER_BASE_URL = 'http://10.0.0.6:3000';
  
  // Helper function to construct full image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    // If path already starts with http, return as is
    if (path.startsWith('http')) return path;
    // Otherwise, prepend server base URL
    const fullUrl = `${SERVER_BASE_URL}${path}`;
    console.log('Constructed image URL:', fullUrl);
    return fullUrl;
  };

  // Function to open image preview modal
  const openImagePreview = (imagePath) => {
    setSelectedImage(imagePath);
    setModalVisible(true);
  };

  // Function to close image preview modal
  const closeImagePreview = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };
  
  // Filter out invalid gallery items and sort by order
  const validGalleryItems = (gallery || [])
    .filter(item => item && item.path)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  
  if (!validGalleryItems.length) {
    return (
      <View style={[styles.tabContent, {
        backgroundColor: theme.background,
        shadowColor: theme.black
      }]}>
        <View style={styles.noImagesContainer}>
          <Text style={[styles.noImagesText, { color: theme.textSecondary }]}>
            No gallery images available
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
      <View style={styles.galleryGrid}>
        {validGalleryItems.map((item, index) => {
          // Check if this is the last item in a row (every 3rd item)
          const isLastInRow = (index + 1) % 3 === 0;
          
          return (
            <TouchableOpacity 
              key={item._id || index} 
              style={[
                styles.galleryItem,
                isLastInRow && { marginRight: 0 } // Remove right margin for last item in row
              ]}
              onPress={() => {
                // Open image preview modal
                openImagePreview(item.path);
              }}
            >
            <Image 
              source={{ uri: getImageUrl(item.path) }} 
              style={styles.galleryImage} 
              resizeMode="cover"
              onError={(error) => console.log('Gallery image error for path:', item.path, error.nativeEvent.error)}
              onLoad={() => console.log('Gallery image loaded successfully:', item.path)}
            />
          </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Image Preview Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImagePreview}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeImagePreview}
        >
          <View style={styles.modalImageContainer}>
            <Image 
              source={{ uri: getImageUrl(selectedImage) }}
              style={styles.modalImage}
              resizeMode="contain"
              onError={(error) => console.log('Modal image error:', error.nativeEvent.error)}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Changed from space-between to flex-start for consistent spacing
  },
  galleryItem: {
    width: "32%", // Increased from 30% to 32% for slightly bigger images
    aspectRatio: 1, // Make images square
    marginBottom: "8@s",
    marginRight: "2%", // Reduced margin to accommodate larger images
    borderRadius: "8@s",
    overflow: 'hidden',
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  noImagesContainer: {
    padding: "20@s",
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImagesText: {
    fontSize: "16@s",
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});

export default GalleryGrid;
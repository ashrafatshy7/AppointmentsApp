// src/BusinessProfile/Screens/BusinessProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';
import { useAuth } from '../../Auth/Context/AuthContext';
import BusinessInfoCard from '../Components/BusinessInfoCard';
import ApiService from '../../Dashboard/Service/ApiService';

const BusinessProfileScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const { activeBusiness, changeActiveBusiness, updateBusinessLogo, updateBusinessCoverPhoto, addGalleryImage, removeGalleryImage, refreshBusinessData } = useBusiness();
  const { userData, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [businessLogo, setBusinessLogo] = useState(null);
  const [businessCoverPhoto, setBusinessCoverPhoto] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isAddingGalleryImage, setIsAddingGalleryImage] = useState(false);
  
  // Load business logo and cover photo from business context only (no local storage)
  useEffect(() => {
    const loadBusinessImages = async () => {
      try {
        // Get logo from business context only
        if (activeBusiness?.profileImage) {
          const fullImageUrl = ApiService.getFullImageUrl(activeBusiness.profileImage);
          setBusinessLogo(fullImageUrl);
        } else {
          setBusinessLogo(null);
        }
        
        // Get cover photo from business context only
        if (activeBusiness?.coverImage) {
          const fullCoverUrl = ApiService.getFullImageUrl(activeBusiness.coverImage);
          setBusinessCoverPhoto(fullCoverUrl);
        } else {
          setBusinessCoverPhoto(null);
        }
        
        // Get gallery images from business context
        if (activeBusiness?.gallery && Array.isArray(activeBusiness.gallery)) {
          // Handle both old (string array) and new (object array) gallery structures
          let processedGallery;
          
          if (activeBusiness.gallery.length > 0 && typeof activeBusiness.gallery[0] === 'string') {
            // Old structure: array of strings
            processedGallery = activeBusiness.gallery.map((item, index) => ({
              path: ApiService.getFullImageUrl(item),
              originalPath: item,
              order: index + 1
            }));
          } else {
            // New structure: array of objects with path and order
            processedGallery = activeBusiness.gallery
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(item => ({
                path: ApiService.getFullImageUrl(item.path),
                originalPath: item.path,
                order: item.order
              }));
          }
          
          setGalleryImages(processedGallery);
        } else {
          setGalleryImages([]);
        }
      } catch (error) {
        console.error('Error loading business images:', error);
      }
    };
    
    loadBusinessImages();
  }, [activeBusiness]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBusinessData();
    } catch (error) {
      console.error('Error refreshing business data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle image picker for logo
  const handlePickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant access to your photo library to change business logo.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setBusinessLogo(selectedAsset.uri);
        
        // Update through business context (which also saves to AsyncStorage)
        await updateBusinessLogo(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Handle image picker for gallery
  const handlePickGalleryImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant access to your photo library to add gallery images.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.5,
      });
      
      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setIsAddingGalleryImage(true);
        
        try {
          // Add to gallery through business context
          const result = await addGalleryImage(selectedAsset.uri);
          
          if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to add gallery image');
          }
        } catch (error) {
          console.error('Error adding gallery image:', error);
          Alert.alert('Error', 'Failed to add gallery image. Please try again.');
        } finally {
          setIsAddingGalleryImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking gallery image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

    // Handle gallery image deletion
  const handleDeleteGalleryImage = async (originalPath, index) => {
    if (!originalPath) {
      return;
    }
    
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image from the gallery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeGalleryImage(originalPath);
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to delete gallery image');
              }
            } catch (error) {
              console.error('Error deleting gallery image:', error);
              Alert.alert('Error', 'Failed to delete gallery image. Please try again.');
            }
          }
        }
      ]
    );
  };



  // Handle image picker for cover photo
  const handlePickCoverPhoto = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant access to your photo library to change business cover photo.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Wide aspect ratio for cover photo
        quality: 0.5,
      });
      
      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setBusinessCoverPhoto(selectedAsset.uri);
        
        // Update through business context
        await updateBusinessCoverPhoto(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking cover photo:', error);
      Alert.alert('Error', 'Failed to select cover photo. Please try again.');
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await logout();
              // Navigation will be handled by AuthStack based on auth state
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };
  
  // Get business and owner information from userData or activeBusiness
  const businessInfo = userData?.business || activeBusiness;
  const businessName = businessInfo?.name || businessInfo?.businessName || 'Your Business';
  const ownerName = businessInfo?.ownerName || userData?.name || 'Business Owner';
  
  // Render profile section
  const renderProfileSection = () => (
    <View style={[styles.profileSection, { backgroundColor: theme.backgroundLight }]}>
      {/* Cover Photo Section */}
      <TouchableOpacity
        style={styles.coverPhotoContainer}
        onPress={handlePickCoverPhoto}
        activeOpacity={0.8}
      >
        {businessCoverPhoto ? (
          <Image source={{ uri: businessCoverPhoto }} style={styles.coverPhoto} />
        ) : (
          <View style={[styles.coverPhotoPlaceholder, { backgroundColor: theme.primaryBackground }]}>
            <FontAwesome5 name="image" size={24} color={theme.primary} />
            <Text style={[styles.coverPhotoText, { color: theme.primary }]}>
              Add Cover Photo
            </Text>
          </View>
        )}
        <View style={styles.coverPhotoOverlay}>
          <FontAwesome5 name="camera" size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          {businessLogo ? (
            <Image source={{ uri: businessLogo }} style={styles.businessLogo} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: theme.primaryBackground }]}>
              <Text style={[styles.logoInitials, { color: theme.primary }]}>
                {businessName.charAt(0).toUpperCase()}
              </Text>
              <FontAwesome5 name="camera" size={16} color={theme.primary} style={styles.cameraIcon} />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: theme.textPrimary }]}>
            {businessName}
          </Text>
          <Text style={[styles.ownerName, { color: theme.textSecondary }]}>
            {ownerName}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.editProfileButton, { borderColor: theme.border }]}
        onPress={() => navigation.navigate('EditBusinessProfile')}
      >
        <FontAwesome5 name="edit" size={14} color={theme.primary} style={styles.editIcon} />
        <Text style={[styles.editButtonText, { color: theme.primary }]}>
          Edit Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render menu item
  const renderMenuItem = (icon, title, onPress, rightComponent = null, isDestructive = false, isComingSoon = false) => (
    <TouchableOpacity
      style={[
        styles.menuItem, 
        { borderBottomColor: theme.border },
        isComingSoon && { opacity: 0.6 }
      ]}
      onPress={isComingSoon ? null : onPress}
      disabled={isComingSoon}
    >
      <View style={styles.menuItemLeft}>
        <FontAwesome5 
          name={icon} 
          size={18} 
          color={isDestructive ? theme.danger : theme.primary} 
          style={styles.menuIcon} 
          solid 
        />
        <Text style={[
          styles.menuTitle, 
          { 
            color: isDestructive ? theme.danger : theme.textPrimary 
          }
        ]}>
          {title}
        </Text>
        {isComingSoon && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        )}
      </View>
      
      {rightComponent ? (
        rightComponent
      ) : (
        !isComingSoon && <FontAwesome5 name="chevron-right" size={16} color={theme.textLight} />
      )}
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Business Profile
          </Text>
        </View>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {renderProfileSection()}
          
          {/* Gallery Section */}
          <View style={styles.menuSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Gallery
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={handlePickGalleryImage}
                disabled={isAddingGalleryImage}
              >
                {isAddingGalleryImage ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <FontAwesome5 name="plus" size={16} color={theme.white} />
                )}
              </TouchableOpacity>
            </View>
            
                          {Array.isArray(galleryImages) && galleryImages.length > 0 ? (
                <>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryContainer}
                  >
                    {galleryImages
                      .filter(item => item && item.path) // Filter out invalid items
                      .map((item, index) => (
                        <View key={`gallery-${index}-${item.originalPath || Date.now()}`} style={styles.galleryImageContainer}>
                          <Image source={{ uri: item.path }} style={styles.galleryImage} />
                          <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: theme.danger }]}
                            onPress={() => handleDeleteGalleryImage(item.originalPath, index)}
                          >
                            <FontAwesome5 name="trash" size={12} color={theme.white} />
                          </TouchableOpacity>
                        </View>
                      ))}
                  </ScrollView>

                </>
              ) : (
                <View style={[styles.emptyGallery, { backgroundColor: theme.backgroundLight }]}>
                  <FontAwesome5 name="images" size={24} color={theme.textLight} />
                  <Text style={[styles.emptyGalleryText, { color: theme.textLight }]}>
                    No gallery images yet
                  </Text>
                  <Text style={[styles.emptyGallerySubtext, { color: theme.textLight }]}>
                    Tap the + button to add images
                  </Text>
                </View>
              )}
          </View>
          
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Business Details
            </Text>
            

            
            {renderMenuItem('building', 'Branches', null, null, false, true)}

            {renderMenuItem('chart-bar', 'Analytics', null, null, false, true)}
           
          </View>
          
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              App Settings
            </Text>
            
            {renderMenuItem('bell', 'Notifications', () => 
              navigation.navigate('NotificationSettings')
            )}
            
            {renderMenuItem('credit-card', 'Payment Settings', () => 
              navigation.navigate('PaymentSettings')
            )}
            
            {renderMenuItem('calendar-alt', 'Calendar Integration', () => 
              navigation.navigate('CalendarIntegration')
            )}
            
            {renderMenuItem('moon', 'Dark Mode', null, (
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.backgroundGray, true: theme.primary + '50' }}
                thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
              />
            ))}
          </View>
          
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Account
            </Text>
            
            {renderMenuItem('user-shield', 'Privacy Settings', () => 
              navigation.navigate('PrivacySettings')
            )}
            
            {renderMenuItem('question-circle', 'Help & Support', () => 
              navigation.navigate('HelpSupport')
            )}
            
            {renderMenuItem('file-alt', 'Terms & Policies', () => 
              navigation.navigate('TermsPolicies')
            )}
            
            {renderMenuItem('sign-out-alt', 'Logout', handleLogout, null, true)}
          </View>
          
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: theme.textLight }]}>
              Version 1.0.0
            </Text>
          </View>
        </ScrollView>
        
        {isLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.overlay }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: '12@s',
    padding: '3@s',
  },
  headerTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    flex: 1,
  },
  profileSection: {
    margin: '12@s',
    borderRadius: '10@s',
    padding: '12@s',
  },
  coverPhotoContainer: {
    position: 'relative',
    marginBottom: '12@vs',
    borderRadius: '10@s',
    overflow: 'hidden',
  },
  coverPhoto: {
    width: '100%',
    height: '120@vs',
    borderRadius: '10@s',
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: '120@vs',
    borderRadius: '10@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPhotoText: {
    fontSize: '14@s',
    fontWeight: '500',
    marginTop: '8@vs',
  },
  coverPhotoOverlay: {
    position: 'absolute',
    top: '8@vs',
    right: '8@s',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: '8@s',
    borderRadius: '20@s',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  logoContainer: {
    marginRight: '12@s',
  },
  businessLogo: {
    width: '64@s',
    height: '64@s',
    borderRadius: '32@s',
  },
  logoPlaceholder: {
    width: '64@s',
    height: '64@s',
    borderRadius: '32@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitials: {
    fontSize: '24@s',
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: '4@vs',
    right: '4@s',
    padding: '4@s',
    backgroundColor: '#FFF',
    borderRadius: '12@s',
    overflow: 'hidden',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: '18@s',
    fontWeight: 'bold',
    marginBottom: '3@vs',
  },
  ownerName: {
    fontSize: '14@s',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10@s',
    borderRadius: '6@s',
    borderWidth: 1,
    marginTop: '6@vs',
  },
  editIcon: {
    marginRight: '6@s',
  },
  editButtonText: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  menuSection: {
    margin: '12@s',
    marginTop: '0@vs',
  },
  sectionTitle: {
    fontSize: '12@s',
    fontWeight: '600',
    marginVertical: '6@vs',
    textTransform: 'uppercase',
    letterSpacing: '1@s',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: '20@s',
    marginRight: '12@s',
  },
  menuTitle: {
    fontSize: '14@s',
  },
  comingSoonBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
    borderRadius: '10@s',
    marginLeft: '8@s',
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: '10@s',
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: '24@vs',
  },
  versionText: {
    fontSize: '14@s',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12@vs',
  },
  addButton: {
    width: '32@s',
    height: '32@s',
    borderRadius: '16@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryContainer: {
    paddingRight: '12@s',
  },
  galleryImageContainer: {
    position: 'relative',
    marginRight: '12@s',
  },
  galleryImage: {
    width: '120@s',
    height: '90@vs',
    borderRadius: '8@s',
  },
  deleteButton: {
    position: 'absolute',
    top: '4@vs',
    right: '4@s',
    width: '20@s',
    height: '20@s',
    borderRadius: '10@s',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyGallery: {
    alignItems: 'center',
    padding: '24@vs',
    borderRadius: '8@s',
  },
  emptyGalleryText: {
    fontSize: '14@s',
    fontWeight: '500',
    marginTop: '8@vs',
  },
  emptyGallerySubtext: {
    fontSize: '12@s',
    marginTop: '4@vs',
    textAlign: 'center',
  },

});

export default BusinessProfileScreen;

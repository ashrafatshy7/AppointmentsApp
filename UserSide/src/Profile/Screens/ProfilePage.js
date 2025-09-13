// src/ProfilePage/ProfilePage.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ScaledSheet } from 'react-native-size-matters';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useUser, LANGUAGES } from '../../Context/UserContext';
import { useAuth } from '../../Auth/Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext'; // Import useTheme hook
import LanguageSelectionModal from '../../Components/Common/LanguageSelectionModal';
import DarkModeToggle from '../../Components/Common/DarkModeToggle';
import { ThemedStatusBar } from '../../Components/Themed/ThemedStatusBar';
import { uploadUserAvatar } from '../../Services/UserService';

const ProfilePage = () => {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { userData, updateProfileImage, updateLanguage, getCurrentLanguage } = useUser();
  const { logout, user } = useAuth();
  const { theme, isDarkMode } = useTheme(); // Use the theme context
  
  // Function to pick an image from the gallery
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'You need to allow access to your photos to change your profile picture.');
        return;
      }
      
      // Launch image picker - using string value to avoid API compatibility issues
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        // Upload to server; get relative URL; store full URL in context for instant UI update
        try {
          const uploaded = await uploadUserAvatar((user && (user.id || user._id)) || userData.id, uri);
          const fullUrl = uploaded.profileUrl?.startsWith('http') ? uploaded.profileUrl : `http://10.0.0.109:3000${uploaded.profileUrl}`;
          updateProfileImage(fullUrl);
        } catch (e) {
          // Fallback: still show locally selected image even if upload failed
          updateProfileImage(uri);
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'There was an error selecting the image. Please try again.'
      );
      console.error('Image picker error: ', error);
    }
  };

  // Handle language change
  const handleLanguageChange = (languageCode) => {
    // Update language in context
    updateLanguage(languageCode);
    
    // In a real app, we would show a confirmation dialog and restart the app
    Alert.alert(
      "Language Changed",
      "Your language preference has been saved. The app would normally restart to apply this change.",
      [{ text: "OK" }]
    );
  };

  // Handle logout - using the logout function directly from Auth context
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Logout Error', 'Failed to log out properly');
    }
  };

  // Get full name from auth context or user context
  const getFullName = () => {
    // First check auth context user - name property from server
    if (user && user.name) {
      return user.name;
    }
    
    // Legacy check for firstName/lastName format
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (userData && userData.name) {
      return userData.name;
    }
    
    return 'Demo User';
  };
  
  // Get email from auth context or user context
  const getEmail = () => {
    if (user && user.email) {
      return user.email;
    }
    
    if (userData && userData.email) {
      return userData.email;
    }
    
    return 'user@example.com';
  };
  
  // Get phone from auth context or user context
  const getPhone = () => {
    if (user && user.phone) {
      return user.phone;
    }
    
    if (userData && userData.phone) {
      return userData.phone;
    }
    
    return '+972 50 123 4567';
  };

  const menuItems = [
    { 
      id: 'personal-info', 
      title: 'Personal Information', 
      icon: 'user', 
      onPress: () => console.log('Personal Information pressed') 
    },
    { 
      id: 'payment-methods', 
      title: 'Payment Methods', 
      icon: 'credit-card', 
      onPress: () => console.log('Payment Methods pressed') 
    },
    { 
      id: 'default-area', 
      title: 'Default Area', 
      icon: 'map-marker-alt', 
      onPress: () => console.log('Default Area pressed') 
    },
    { 
      id: 'favorites', 
      title: 'Favorite Businesses', 
      icon: 'heart', 
      onPress: () => console.log('Favorites pressed') 
    },
    { 
      id: 'help', 
      title: 'Help & Support', 
      icon: 'question-circle', 
      onPress: () => console.log('Help pressed') 
    },
  ];
  
  const renderMenuItem = (item) => (
    <TouchableOpacity 
      key={item.id} 
      style={[styles.menuItem, { borderBottomColor: theme.border }]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <FontAwesome5 name={item.icon} size={16} color={theme.primary} />
        </View>
        <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>{item.title}</Text>
      </View>
      <FontAwesome5 name="chevron-right" size={16} color={theme.textLight} />
    </TouchableOpacity>
  );
  
  // Get profile image source
  const getProfileImageSource = () => {
    if (userData.profileImageUri) {
      return { uri: userData.profileImageUri };
    }
    return null; // Return null to show icon fallback instead
  };
  
  // Get current language display name
  const currentLanguage = getCurrentLanguage();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryUltraLight }]}>
      <ThemedStatusBar />
      
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Profile</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { 
          backgroundColor: theme.background,
          shadowColor: theme.black
        }]}>
          <View style={styles.profileImageContainer}>
            {getProfileImageSource() ? (
              <Image 
                source={getProfileImageSource()} 
                style={[styles.profileImage, { borderColor: theme.primaryLight }]} 
              />
            ) : (
              <View style={[styles.profileImage, styles.profileIconContainer, { 
                borderColor: theme.primaryLight, 
                backgroundColor: theme.primaryUltraLight 
              }]}>
                <FontAwesome5 
                  name="user" 
                  size={32} 
                  color={theme.primaryLight} 
                />
              </View>
            )}
            <TouchableOpacity 
              style={[styles.editButton, { 
                backgroundColor: theme.background, 
                borderColor: theme.border,
                shadowColor: theme.black
              }]}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="edit" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>{getFullName()}</Text>
            <Text style={[styles.profileContact, { color: theme.textSecondary }]}>{getEmail()}</Text>
            <Text style={[styles.profileContact, { color: theme.textSecondary }]}>{getPhone()}</Text>
          </View>
        </View>
        
        {/* Settings Section */}
        <View style={[styles.section, { 
          backgroundColor: theme.background,
          shadowColor: theme.black
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Settings</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <DarkModeToggle />
          </View>
          
          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <FontAwesome5 name="bell" size={16} color={theme.primary} style={styles.settingIcon} />
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Notification Settings</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color={theme.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.settingItemLast]}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingLeft}>
              <FontAwesome5 name="language" size={16} color={theme.primary} style={styles.settingIcon} />
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: theme.textLight }]}>{currentLanguage.name}</Text>
              <FontAwesome5 name="chevron-right" size={16} color={theme.textLight} style={styles.settingArrow} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Menu Section */}
        <View style={[styles.section, { 
          backgroundColor: theme.background,
          shadowColor: theme.black
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Account</Text>
          {menuItems.map(renderMenuItem)}
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.backgroundLight }]}
          onPress={handleLogout}
        >
          <FontAwesome5 name="sign-out-alt" size={16} color={theme.danger} style={styles.logoutIcon} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>Logout</Text>
        </TouchableOpacity>
        
        {/* Version info */}
        <Text style={[styles.versionText, { color: theme.textLight }]}>Version 1.0.0</Text>
      </ScrollView>
      
      {/* Language Selection Modal */}
      <LanguageSelectionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={handleLanguageChange}
        currentLanguage={userData.language}
      />
    </SafeAreaView>
  );
};
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
    marginBottom: "60@s",
  },
  header: {
    padding: '15@s',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: '15@s',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: '12@s',
    padding: '15@s',
    marginBottom: '20@s',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '3@s',
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: '80@s',
    height: '80@s',
    borderRadius: '40@s',
    borderWidth: '2@s',
  },
  profileIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: '15@s',
  },
  profileName: {
    fontSize: '18@s',
    fontWeight: 'bold',
    marginBottom: '5@s',
  },
  profileContact: {
    fontSize: '14@s',
    marginBottom: '2@s',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '30@s',
    height: '30@s',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '15@s',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.2,
    shadowRadius: '2@s',
    elevation: 2,
    borderWidth: '1@s',
  },
  section: {
    borderRadius: '12@s',
    padding: '15@s',
    marginBottom: '20@s',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '3@s',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: '16@s',
    fontWeight: 'bold',
    marginBottom: '15@s',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@s',
    borderBottomWidth: 1,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: '10@s',
    width: '24@s',
  },
  settingText: {
    fontSize: '15@s',
  },
  settingValue: {
    fontSize: '14@s',
    marginRight: '5@s',
  },
  settingArrow: {
    marginLeft: '5@s',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@s',
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: '24@s',
    marginRight: '10@s',
  },
  menuItemText: {
    fontSize: '15@s',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8@s',
    padding: '15@s',
    marginBottom: '20@s',
  },
  logoutIcon: {
    marginRight: '10@s',
  },
  logoutText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: '13@s',
    marginBottom: '20@s',
  },
});

export default ProfilePage;
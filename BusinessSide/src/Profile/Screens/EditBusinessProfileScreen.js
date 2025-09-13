// src/BusinessProfile/Screens/EditBusinessProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import { useBusiness } from '../../Context/BusinessContext';

const EditBusinessProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { activeBusiness, updateBusinessProfile } = useBusiness();
  
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [website, setWebsite] = useState('');
  const [about, setAbout] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Load business profile data from context only (no AsyncStorage)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Set form data from active business context
        if (activeBusiness) {
          setBusinessName(activeBusiness.businessName || activeBusiness.name || '');
          setOwnerName(activeBusiness.ownerName || '');
          setEmail(activeBusiness.email || '');
          setPhone(activeBusiness.phone || activeBusiness.businessPhone || '');
          setAddress(activeBusiness.address?.fullAddress || '');
          setInstagram(activeBusiness.socialMedia?.instagram || '');
          setFacebook(activeBusiness.socialMedia?.facebook || '');
          setTiktok(activeBusiness.socialMedia?.tiktok || '');
          setWebsite(activeBusiness.website || activeBusiness.socialMedia?.website || '');
          setAbout(activeBusiness.about || activeBusiness.description || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load business profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [activeBusiness]);
  

  
  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (email && !email.includes('@')) {
      newErrors.email = 'Enter a valid email address';
    }
    
    if (website && !website.includes('.')) {
      newErrors.website = 'Enter a valid website URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Save profile data
      const profileData = {
        name: businessName,
        email,
        address: {
          fullAddress: address
        },
        socialMedia: {
          instagram,
          facebook,
          tiktok,
          website
        },
        about
      };
      
      await updateBusinessProfile(profileData);
      
      Alert.alert(
        'Success',
        'Business profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save business profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading business profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Edit Business Profile
          </Text>
        </View>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Business Name*
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: errors.businessName ? theme.danger : theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter business name"
                placeholderTextColor={theme.textLight}
                value={businessName}
                onChangeText={text => {
                  setBusinessName(text);
                  if (errors.businessName) {
                    setErrors({...errors, businessName: null});
                  }
                }}
              />
              {errors.businessName && (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {errors.businessName}
                </Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Owner Name
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundGray,
                    color: theme.textSecondary
                  }
                ]}
                placeholder="Owner name"
                placeholderTextColor={theme.textLight}
                value={ownerName}
                editable={false}
              />
              <Text style={[styles.helperText, { color: theme.textLight }]}>
                Owner name cannot be changed
              </Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: errors.email ? theme.danger : theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter email address"
                placeholderTextColor={theme.textLight}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({...errors, email: null});
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {errors.email}
                </Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundGray,
                    color: theme.textSecondary
                  }
                ]}
                placeholder="Phone number"
                placeholderTextColor={theme.textLight}
                value={phone}
                editable={false}
                keyboardType="phone-pad"
              />
              <Text style={[styles.helperText, { color: theme.textLight }]}>
                Phone number cannot be changed
              </Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Business Address
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  styles.multilineInput,
                  { 
                    borderColor: errors.address ? theme.danger : theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter business address"
                placeholderTextColor={theme.textLight}
                value={address}
                onChangeText={text => {
                  setAddress(text);
                  if (errors.address) {
                    setErrors({...errors, address: null});
                  }
                }}
                multiline
                numberOfLines={3}
              />
              {errors.address && (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {errors.address}
                </Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Instagram
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter Instagram profile URL"
                placeholderTextColor={theme.textLight}
                value={instagram}
                onChangeText={setInstagram}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Facebook
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter Facebook page URL"
                placeholderTextColor={theme.textLight}
                value={facebook}
                onChangeText={setFacebook}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                TikTok
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter TikTok profile URL"
                placeholderTextColor={theme.textLight}
                value={tiktok}
                onChangeText={setTiktok}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Website
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: errors.website ? theme.danger : theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter website URL"
                placeholderTextColor={theme.textLight}
                value={website}
                onChangeText={text => {
                  setWebsite(text);
                  if (errors.website) {
                    setErrors({...errors, website: null});
                  }
                }}
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.website && (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {errors.website}
                </Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                About
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  styles.multilineInput,
                  styles.descriptionInput,
                  { 
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Tell us about your business"
                placeholderTextColor={theme.textLight}
                value={about}
                onChangeText={setAbout}
                multiline
                numberOfLines={5}
              />
            </View>
          </View>
        </ScrollView>
        
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { 
                backgroundColor: theme.primary,
                opacity: isSubmitting ? 0.7 : 1
              }
            ]}
            onPress={handleSaveProfile}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.white }]}>
                Save Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '16@s',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: '16@s',
    padding: '4@s',
  },
  headerTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: '20@vs',
  },
  formContainer: {
    padding: '16@s',
  },
  formGroup: {
    marginBottom: '16@vs',
  },
  label: {
    fontSize: '16@s',
    fontWeight: '500',
    marginBottom: '8@vs',
  },
  input: {
    height: '50@vs',
    borderWidth: 1,
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    fontSize: '16@s',
  },
  multilineInput: {
    height: 'auto',
    paddingTop: '12@s',
    paddingBottom: '12@s',
    textAlignVertical: 'top',
  },
  descriptionInput: {
    minHeight: '100@vs',
  },
  errorText: {
    fontSize: '14@s',
    marginTop: '4@vs',
  },
  helperText: {
    fontSize: '12@s',
    marginTop: '4@vs',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: '16@s',
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: '50@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8@s',
    borderWidth: 1,
    marginRight: '12@s',
  },
  cancelButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    height: '50@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8@s',
  },
  saveButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
});

export default EditBusinessProfileScreen;

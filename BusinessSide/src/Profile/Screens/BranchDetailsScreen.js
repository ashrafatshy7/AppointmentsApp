// src/BusinessProfile/Screens/BranchDetailsScreen.js
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

const BranchDetailsScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { getBusinessBranches, changeActiveBranch } = useBusiness();
  
  const { branchId } = route.params || {};
  const isNewBranch = !branchId;
  
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(!isNewBranch);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Load branch details if editing
  useEffect(() => {
    const loadBranchDetails = async () => {
      if (isNewBranch) return;
      
      try {
        const branches = await getBusinessBranches();
        const branch = branches.find(b => b.id === branchId);
        
        if (!branch) {
          Alert.alert('Error', 'Branch not found');
          navigation.goBack();
          return;
        }
        
        setName(branch.name);
        setAddress(branch.address || '');
        setPhone(branch.phone || '');
        setEmail(branch.email || '');
      } catch (error) {
        console.error('Error loading branch details:', error);
        Alert.alert('Error', 'Failed to load branch details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBranchDetails();
  }, [branchId, getBusinessBranches, isNewBranch, navigation]);
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Branch name is required';
    }
    
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle save branch
  const handleSaveBranch = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would call your API
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const branchData = {
        id: isNewBranch ? `new-${Date.now()}` : branchId,
        name,
        address,
        phone,
        email
      };
      
      // This would be handled by actual API in a real app
      Alert.alert(
        'Success',
        isNewBranch ? 'Branch created successfully' : 'Branch updated successfully',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // If creating a new branch, set it as active
              if (isNewBranch) {
                changeActiveBranch(branchData);
              }
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving branch:', error);
      Alert.alert('Error', 'Failed to save branch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete branch
  const handleDeleteBranch = () => {
    Alert.alert(
      'Delete Branch',
      'Are you sure you want to delete this branch? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            
            try {
              // In a real app, this would call your API
              // Simulate API delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              Alert.alert(
                'Branch Deleted',
                'The branch has been successfully deleted.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error deleting branch:', error);
              Alert.alert('Error', 'Failed to delete branch. Please try again.');
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading branch details...
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
            {isNewBranch ? 'Add Branch' : 'Branch Details'}
          </Text>
          {!isNewBranch && (
            <TouchableOpacity
              onPress={handleDeleteBranch}
              style={styles.deleteButton}
              disabled={isSubmitting}
            >
              <FontAwesome5 name="trash-alt" size={20} color={theme.danger} />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Branch Name*
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: errors.name ? theme.danger : theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter branch name"
                placeholderTextColor={theme.textLight}
                value={name}
                onChangeText={text => {
                  setName(text);
                  if (errors.name) {
                    setErrors({...errors, name: null});
                  }
                }}
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {errors.name}
                </Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Address*
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
                placeholder="Enter full address"
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
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: errors.phone ? theme.danger : theme.border,
                    backgroundColor: theme.backgroundLight,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Enter branch phone number"
                placeholderTextColor={theme.textLight}
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  if (errors.phone) {
                    setErrors({...errors, phone: null});
                  }
                }}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {errors.phone}
                </Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Email
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
                placeholder="Enter branch email address"
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
            onPress={handleSaveBranch}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.white }]}>
                {isNewBranch ? 'Add Branch' : 'Save Changes'}
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
  deleteButton: {
    padding: '4@s',
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: '16@s',
  },
  formGroup: {
    marginBottom: '20@vs',
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
    height: '100@vs',
    paddingTop: '12@s',
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: '14@s',
    marginTop: '4@vs',
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

export default BranchDetailsScreen;

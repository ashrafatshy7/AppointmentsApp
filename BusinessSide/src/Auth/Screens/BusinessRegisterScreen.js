// src/Auth/Screens/BusinessRegisterScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { ScaledSheet } from "react-native-size-matters";
import Colors from "../../Constants/Colors";
import AuthButton from "../Components/AuthButton";
import PhoneInput from "../Components/PhoneInput";
import { validateName } from "../Utils/validators";
import { createBusiness, getCities } from "../Services/ApiService";
import { useAuth } from "../Context/AuthContext";
import {
  requestLocationPermission,
  getCurrentLocation,
  findNearestCity,
} from "../Services/LocationService";

const BusinessRegisterScreen = ({ navigation, route }) => {
  // Business categories will be fetched from server
  const [businessCategories, setBusinessCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  // Get phone number from OTP verification if coming from that flow
  const { phoneNumber: prefilledPhone, isFromOTPVerification } =
    route.params || {};

  // Fetch categories from server
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch('http://10.0.0.6:3000/api/categories');
      if (response.ok) {
        const data = await response.json();
        setBusinessCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Auth context
  const { login } = useAuth();

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState(prefilledPhone || "");
  const [useSamePhoneNumber, setUseSamePhoneNumber] = useState(true);
  const [businessPhone, setBusinessPhone] = useState(prefilledPhone || "");
  const [selectedCity, setSelectedCity] = useState(null);
  const [street, setStreet] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [category, setCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location state
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isAtBusiness, setIsAtBusiness] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form validation state
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // Add step tracking

  // Refs for handling next input focus
  const ownerNameRef = useRef(null);
  const businessPhoneRef = useRef(null);
  const streetRef = useRef(null);
  const buildingNumberRef = useRef(null);

  // Handle phone number toggle
  useEffect(() => {
    if (useSamePhoneNumber) {
      setBusinessPhone(ownerPhone);
    } else if (businessPhone === ownerPhone) {
      setBusinessPhone("");
    }
  }, [useSamePhoneNumber, ownerPhone]);

  // Load cities and request location on component mount
  useEffect(() => {
    loadCities();
    requestLocation();
  }, []);

  // Load cities from API
  const loadCities = async () => {
    try {
      const result = await getCities();
      if (result.success) {
        setCities(result.cities);
      }
    } catch (error) {
      console.error("Error loading cities:", error);
      Alert.alert("Error", "Failed to load cities. Please try again.");
    } finally {
      setLoadingCities(false);
    }
  };

  // Request location permission and get current location
  const requestLocation = async () => {
    try {
      setGettingLocation(true);
      const hasPermission = await requestLocationPermission();
      setLocationPermission(hasPermission);

      if (hasPermission) {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setGettingLocation(false);
    }
  };

  // Auto-select city when cities load and location is available
  useEffect(() => {
    const autoSelectCity = async () => {
      if (currentLocation && cities.length > 0 && !selectedCity) {
        try {
          const nearestCity = await findNearestCity(currentLocation, cities);
          if (nearestCity) {
            setSelectedCity(nearestCity);
          }
        } catch (error) {
          console.error("Error auto-selecting city:", error);
        }
      }
    };

    autoSelectCity();
  }, [currentLocation, cities, selectedCity]);

  // Filter cities based on search
  const [citySearch, setCitySearch] = useState("");
  const filteredCities = cities.filter(
    (city) =>
      city.english?.toLowerCase().includes(citySearch.toLowerCase()) ||
      (city.hebrew && city.hebrew.includes(citySearch))
  );

  // Basic validation
  const validateForm = () => {
    let formErrors = {};

    // Validate business name
    const businessNameValidation = validateName(businessName, {
      required: true,
    });
    if (!businessNameValidation.isValid) {
      formErrors.businessName = businessNameValidation.message;
    }

    // Validate owner name
    const ownerNameValidation = validateName(ownerName, { required: true });
    if (!ownerNameValidation.isValid) {
      formErrors.ownerName = ownerNameValidation.message;
    }

    // Validate owner phone number
    if (!ownerPhone) {
      formErrors.ownerPhone = "Owner phone number is required";
    }

    // Validate business phone number
    if (!businessPhone) {
      formErrors.businessPhone = "Business phone number is required";
    }

    // Validate city
    if (!selectedCity) {
      formErrors.city = "City is required";
    }

    // Validate street
    if (!street.trim()) {
      formErrors.street = "Street is required";
    }

    // Validate building number
    if (!buildingNumber.trim()) {
      formErrors.buildingNumber = "Building number is required";
    }

    // Validate category
    if (!category) {
      formErrors.category = "Business category is required";
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  // Handle business location confirmation
  const handleLocationConfirmation = (atBusiness) => {
    setIsAtBusiness(atBusiness);
    if (atBusiness && !currentLocation) {
      getCurrentLocation()
        .then(setCurrentLocation)
        .catch((error) => {
          console.error("Error getting location:", error);
          Alert.alert(
            "Location Error",
            "Could not get your current location. You can still create your business account without location data."
          );
        });
    }
  };

  // Handle registration submission
  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    if (isAtBusiness === null) {
      Alert.alert(
        "Location Confirmation",
        "Please confirm if you are currently at your business location."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const businessData = {
        businessName,
        ownerName,
        ownerPhone,
        businessPhone,
        city: selectedCity.english,
        street,
        buildingNumber,
        category,
      };

      // Add coordinates only if user is at business and we have location
      if (isAtBusiness && currentLocation) {
        businessData.coordinates = currentLocation.coordinates;
      }

      const result = await createBusiness(businessData);

      if (result.success) {
        // Login with the returned data
        const loginResult = await login(result.token, result.user);

        if (loginResult.success) {
          Alert.alert(
            "Success!",
            "Your business account has been created successfully.",
            [
              {
                text: "Continue",
                onPress: () => {
                  // Navigation will be handled by AppNavigator
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Registration Successful",
            "Business created but login failed. Please try logging in again.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("Login"),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          "Registration Failed",
          result.error || "Failed to create business account"
        );
      }
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error.message ||
          "There was a problem creating your account. Please try again."
      );
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.stepActive]}>
          <FontAwesome5 name="user" size={12} color={Colors.white} />
        </View>
        <Text style={styles.stepLabel}>Personal</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepContainer}>
        <View
          style={[styles.stepCircle, currentStep >= 2 && styles.stepActive]}
        >
          <FontAwesome5
            name="building"
            size={12}
            color={currentStep >= 2 ? Colors.white : Colors.textSecondary}
          />
        </View>
        <Text style={styles.stepLabel}>Business</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepContainer}>
        <View
          style={[styles.stepCircle, currentStep >= 3 && styles.stepActive]}
        >
          <FontAwesome5
            name="map-marker-alt"
            size={12}
            color={currentStep >= 3 ? Colors.white : Colors.textSecondary}
          />
        </View>
        <Text style={styles.stepLabel}>Location</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5
              name="arrow-left"
              size={20}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Business</Text>
            <Text style={styles.headerSubtitle}>
              Let's set up your business profile
            </Text>
          </View>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Personal Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5
                name="user-circle"
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>

            <View style={styles.cardContent}>
              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.businessName && styles.inputError,
                  ]}
                >
                  <FontAwesome5
                    name="store"
                    size={16}
                    color={Colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={businessName}
                    onChangeText={(text) => {
                      setBusinessName(text);
                      if (errors.businessName) {
                        setErrors({ ...errors, businessName: null });
                      }
                    }}
                    placeholder="Enter your business name"
                    returnKeyType="next"
                    onSubmitEditing={() => ownerNameRef.current?.focus()}
                    autoCapitalize="words"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
                {errors.businessName && (
                  <Text style={styles.errorText}>{errors.businessName}</Text>
                )}
              </View>

              {/* Owner Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Full Name</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.ownerName && styles.inputError,
                  ]}
                >
                  <FontAwesome5
                    name="user"
                    size={16}
                    color={Colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={ownerNameRef}
                    style={styles.textInput}
                    value={ownerName}
                    onChangeText={(text) => {
                      setOwnerName(text);
                      if (errors.ownerName) {
                        setErrors({ ...errors, ownerName: null });
                      }
                    }}
                    placeholder="Enter your full name"
                    returnKeyType="next"
                    autoCapitalize="words"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
                {errors.ownerName && (
                  <Text style={styles.errorText}>{errors.ownerName}</Text>
                )}
              </View>

              {/* Owner Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Phone Number</Text>
                <PhoneInput
                  value={ownerPhone}
                  onChangeText={(text) => {
                    setOwnerPhone(text);
                    if (errors.ownerPhone) {
                      setErrors({ ...errors, ownerPhone: null });
                    }
                  }}
                  error={errors.ownerPhone}
                  disabled={isFromOTPVerification}
                  placeholder="Your personal phone number"
                  containerStyle={styles.phoneInputContainer}
                />
                {isFromOTPVerification && (
                  <View style={styles.verifiedBadge}>
                    <FontAwesome5
                      name="check-circle"
                      size={14}
                      color={Colors.success}
                    />
                    <Text style={styles.verifiedText}>Verified via SMS</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Business Contact Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="phone" size={24} color={Colors.primary} />
              <Text style={styles.cardTitle}>Business Contact</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.toggleSection}>
                <View style={styles.toggleHeader}>
                  <Text style={styles.toggleTitle}>
                    Use same phone number for business?
                  </Text>
                  <Switch
                    value={useSamePhoneNumber}
                    onValueChange={(value) => {
                      setUseSamePhoneNumber(value);
                      if (errors.businessPhone) {
                        setErrors({ ...errors, businessPhone: null });
                      }
                    }}
                    trackColor={{
                      false: Colors.border,
                      true: Colors.primaryLight,
                    }}
                    thumbColor={
                      useSamePhoneNumber ? Colors.primary : Colors.textLight
                    }
                    style={styles.switch}
                  />
                </View>
                <Text style={styles.toggleDescription}>
                  {useSamePhoneNumber
                    ? "Customers will contact you on your personal number"
                    : "Set a different number for customer contacts"}
                </Text>
              </View>

              {!useSamePhoneNumber && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Phone Number</Text>
                  <PhoneInput
                    ref={businessPhoneRef}
                    value={businessPhone}
                    onChangeText={(text) => {
                      setBusinessPhone(text);
                      if (errors.businessPhone) {
                        setErrors({ ...errors, businessPhone: null });
                      }
                    }}
                    error={errors.businessPhone}
                    placeholder="Business contact phone number"
                    containerStyle={styles.phoneInputContainer}
                  />
                  <Text style={styles.helpText}>
                    This number will be visible to customers
                  </Text>
                </View>
              )}

              {errors.businessPhone && (
                <Text style={styles.errorText}>{errors.businessPhone}</Text>
              )}
            </View>
          </View>

          {/* Business Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="building" size={24} color={Colors.primary} />
              <Text style={styles.cardTitle}>Business Details</Text>
            </View>

            <View style={styles.cardContent}>
              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Category</Text>
                {isLoadingCategories ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading categories...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.dropdownWrapper,
                      errors.category && styles.inputError,
                    ]}
                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <FontAwesome5
                      name={
                        category
                          ? businessCategories.find(
                              (cat) => cat.name === category
                            )?.icon || "briefcase"
                          : "briefcase"
                      }
                      size={16}
                      color={Colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <Text
                      style={[
                        styles.dropdownText,
                        !category && styles.placeholderText,
                      ]}
                    >
                      {category || "Select your business category"}
                    </Text>
                    <FontAwesome5
                      name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}

                {showCategoryDropdown && (
                  <View style={styles.dropdown}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                    >
                      {businessCategories.map((cat, index) => (
                        <TouchableOpacity
                          key={cat._id || cat.name || `category-${index}`}
                          style={styles.categoryItem}
                          onPress={() => {
                            setCategory(cat.name);
                            setShowCategoryDropdown(false);
                            if (errors.category) {
                              setErrors({ ...errors, category: null });
                            }
                          }}
                        >
                          <FontAwesome5
                            name={cat.icon}
                            size={18}
                            color={Colors.primary}
                            style={styles.categoryIcon}
                          />
                          <Text style={styles.categoryText}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {errors.category && (
                  <Text style={styles.errorText}>{errors.category}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5
                name="map-marker-alt"
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.cardTitle}>Business Location</Text>
            </View>

            <View style={styles.cardContent}>
              {/* Location Status */}
              {(gettingLocation ||
                locationPermission !== null ||
                currentLocation) && (
                <View style={styles.locationStatusCard}>
                  {gettingLocation && (
                    <View style={styles.statusItem}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.statusText}>
                        Detecting your location...
                      </Text>
                    </View>
                  )}

                  {locationPermission === false && (
                    <View style={styles.statusItem}>
                      <FontAwesome5
                        name="exclamation-triangle"
                        size={16}
                        color={Colors.warning}
                      />
                      <Text style={styles.statusText}>
                        Location access denied. Please select manually.
                      </Text>
                    </View>
                  )}

                  {currentLocation && (
                    <View style={styles.statusItem}>
                      <FontAwesome5
                        name="check-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.statusText}>
                        Location detected successfully
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* City Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City</Text>
                {loadingCities ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading cities...</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.dropdownWrapper,
                        errors.city && styles.inputError,
                      ]}
                      onPress={() => setShowCityDropdown(!showCityDropdown)}
                    >
                      <FontAwesome5
                        name="city"
                        size={16}
                        color={Colors.textSecondary}
                        style={styles.inputIcon}
                      />
                      <Text
                        style={[
                          styles.dropdownText,
                          !selectedCity && styles.placeholderText,
                        ]}
                      >
                        {selectedCity
                          ? selectedCity.english
                          : "Select your city"}
                      </Text>
                      <FontAwesome5
                        name={showCityDropdown ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {showCityDropdown && (
                      <View style={styles.dropdown}>
                        <View style={styles.searchWrapper}>
                          <FontAwesome5
                            name="search"
                            size={14}
                            color={Colors.textLight}
                            style={styles.searchIcon}
                          />
                          <TextInput
                            style={styles.searchInput}
                            value={citySearch}
                            onChangeText={setCitySearch}
                            placeholder="Search cities..."
                            placeholderTextColor={Colors.textLight}
                          />
                        </View>
                        <ScrollView
                          style={styles.dropdownScroll}
                          nestedScrollEnabled
                        >
                          {filteredCities.slice(0, 50).map((city, index) => (
                            <TouchableOpacity
                              key={city.english || city.name || `city-${index}`}
                              style={styles.cityItem}
                              onPress={() => {
                                setSelectedCity(city);
                                setShowCityDropdown(false);
                                setCitySearch("");
                                if (errors.city) {
                                  setErrors({ ...errors, city: null });
                                }
                              }}
                            >
                              <View style={styles.cityContent}>
                                <Text style={styles.cityName}>
                                  {city.english}
                                </Text>
                                {city.hebrew && (
                                  <Text style={styles.cityNameHebrew}>
                                    {city.hebrew}
                                  </Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
                {errors.city && (
                  <Text style={styles.errorText}>{errors.city}</Text>
                )}
              </View>

              {/* Address Inputs */}
              <View style={styles.addressRow}>
                <View style={[styles.inputGroup, styles.streetInput]}>
                  <Text style={styles.inputLabel}>Street</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.street && styles.inputError,
                    ]}
                  >
                    <FontAwesome5
                      name="road"
                      size={16}
                      color={Colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={streetRef}
                      style={styles.textInput}
                      value={street}
                      onChangeText={(text) => {
                        setStreet(text);
                        if (errors.street) {
                          setErrors({ ...errors, street: null });
                        }
                      }}
                      placeholder="Street name"
                      returnKeyType="next"
                      onSubmitEditing={() => buildingNumberRef.current?.focus()}
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                  {errors.street && (
                    <Text style={styles.errorText}>{errors.street}</Text>
                  )}
                </View>

                <View style={[styles.inputGroup, styles.buildingInput]}>
                  <Text style={styles.inputLabel}>Building #</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.buildingNumber && styles.inputError,
                    ]}
                  >
                    <FontAwesome5
                      name="hashtag"
                      size={16}
                      color={Colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={buildingNumberRef}
                      style={styles.textInput}
                      value={buildingNumber}
                      onChangeText={(text) => {
                        setBuildingNumber(text);
                        if (errors.buildingNumber) {
                          setErrors({ ...errors, buildingNumber: null });
                        }
                      }}
                      placeholder="Number"
                      returnKeyType="done"
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                  {errors.buildingNumber && (
                    <Text style={styles.errorText}>
                      {errors.buildingNumber}
                    </Text>
                  )}
                </View>
              </View>

              {/* Location Confirmation */}
              <View style={styles.locationConfirmation}>
                <Text style={styles.confirmationTitle}>
                  Are you currently at your business?
                </Text>
                <Text style={styles.confirmationDescription}>
                  This helps us provide accurate directions to your customers
                </Text>
                <View style={styles.confirmationButtons}>
                  <TouchableOpacity
                    style={[
                      styles.confirmationButton,
                      isAtBusiness === true &&
                        styles.confirmationButtonSelected,
                    ]}
                    onPress={() => handleLocationConfirmation(true)}
                  >
                    <FontAwesome5
                      name="check"
                      size={16}
                      color={
                        isAtBusiness === true
                          ? Colors.white
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.confirmationButtonText,
                        isAtBusiness === true &&
                          styles.confirmationButtonTextSelected,
                      ]}
                    >
                      Yes, I'm here
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmationButton,
                      isAtBusiness === false &&
                        styles.confirmationButtonSelected,
                    ]}
                    onPress={() => handleLocationConfirmation(false)}
                  >
                    <FontAwesome5
                      name="times"
                      size={16}
                      color={
                        isAtBusiness === false
                          ? Colors.white
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.confirmationButtonText,
                        isAtBusiness === false &&
                          styles.confirmationButtonTextSelected,
                      ]}
                    >
                      No, I'm not
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <AuthButton
            title="Create Business Account"
            onPress={handleCreateAccount}
            loading={isSubmitting}
            style={styles.createButton}
            icon="rocket"
            iconPosition="right"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "20@s",
    paddingVertical: "16@vs",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: "40@s",
    height: "40@s",
    borderRadius: "20@s",
    backgroundColor: Colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: "16@s",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: "24@s",
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: "14@s",
    color: Colors.textSecondary,
    marginTop: "2@vs",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: "20@vs",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepContainer: {
    alignItems: "center",
  },
  stepCircle: {
    width: "32@s",
    height: "32@s",
    borderRadius: "16@s",
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "4@vs",
  },
  stepActive: {
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    fontSize: "12@s",
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  stepLine: {
    width: "40@s",
    height: "2@vs",
    backgroundColor: Colors.border,
    marginHorizontal: "8@s",
    marginBottom: "20@vs",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: "16@s",
    paddingBottom: "100@vs",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: "16@s",
    marginBottom: "16@vs",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: "2@vs",
    },
    shadowOpacity: 0.1,
    shadowRadius: "8@s",
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: "20@s",
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  cardTitle: {
    fontSize: "18@s",
    fontWeight: "600",
    color: Colors.textPrimary,
    marginLeft: "12@s",
  },
  cardContent: {
    padding: "20@s",
  },
  inputGroup: {
    marginBottom: "20@vs",
  },
  inputLabel: {
    fontSize: "14@s",
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: "8@vs",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: "2@s",
    borderColor: Colors.border,
    borderRadius: "12@s",
    paddingHorizontal: "16@s",
    paddingVertical: "14@vs",
    backgroundColor: Colors.backgroundLight,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: "#FFF5F5",
  },
  inputIcon: {
    marginRight: "12@s",
  },
  textInput: {
    flex: 1,
    fontSize: "16@s",
    color: Colors.textPrimary,
    padding: 0,
  },
  phoneInputContainer: {
    borderRadius: "12@s",
    borderWidth: "2@s",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "8@vs",
    paddingHorizontal: "12@s",
    paddingVertical: "6@vs",
    backgroundColor: Colors.successLight,
    borderRadius: "20@s",
    alignSelf: "flex-start",
  },
  verifiedText: {
    fontSize: "12@s",
    color: Colors.success,
    fontWeight: "600",
    marginLeft: "6@s",
  },
  toggleSection: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: "12@s",
    padding: "16@s",
    marginBottom: "16@vs",
  },
  toggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8@vs",
  },
  toggleTitle: {
    fontSize: "16@s",
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  switch: {
    marginLeft: "12@s",
  },
  toggleDescription: {
    fontSize: "14@s",
    color: Colors.textSecondary,
    lineHeight: "20@vs",
  },
  helpText: {
    fontSize: "12@s",
    color: Colors.textSecondary,
    marginTop: "6@vs",
    fontStyle: "italic",
  },
  dropdownWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: "2@s",
    borderColor: Colors.border,
    borderRadius: "12@s",
    paddingHorizontal: "16@s",
    paddingVertical: "14@vs",
    backgroundColor: Colors.backgroundLight,
  },
  dropdownText: {
    flex: 1,
    fontSize: "16@s",
    color: Colors.textPrimary,
  },
  placeholderText: {
    color: Colors.textLight,
  },
  loadingContainer: {
    padding: "16@s",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundLight,
    borderRadius: "8@s",
    borderWidth: "1@s",
    borderColor: Colors.border,
  },
  loadingText: {
    marginTop: "8@vs",
    fontSize: "14@s",
    color: Colors.textSecondary,
    fontFamily: "Inter-Regular",
  },
  dropdown: {
    borderWidth: "2@s",
    borderColor: Colors.border,
    borderRadius: "12@s",
    backgroundColor: Colors.white,
    marginTop: "8@vs",
    maxHeight: "250@vs",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: "4@vs",
    },
    shadowOpacity: 0.15,
    shadowRadius: "12@s",
    elevation: 8,
  },
  dropdownScroll: {
    maxHeight: "200@vs",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "16@s",
    paddingVertical: "12@vs",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchIcon: {
    marginRight: "10@s",
  },
  searchInput: {
    flex: 1,
    fontSize: "14@s",
    color: Colors.textPrimary,
    padding: 0,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "16@s",
    paddingVertical: "16@vs",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryIcon: {
    marginRight: "16@s",
    width: "20@s",
  },
  categoryText: {
    fontSize: "16@s",
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  cityItem: {
    paddingHorizontal: "16@s",
    paddingVertical: "12@vs",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityContent: {
    flex: 1,
  },
  cityName: {
    fontSize: "16@s",
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  cityNameHebrew: {
    fontSize: "14@s",
    color: Colors.textSecondary,
    marginTop: "2@vs",
  },
  locationStatusCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: "12@s",
    padding: "16@s",
    marginBottom: "20@vs",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: "14@s",
    color: Colors.textSecondary,
    marginLeft: "10@s",
    flex: 1,
  },
  loadingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "16@s",
    paddingVertical: "16@vs",
    borderWidth: "2@s",
    borderColor: Colors.border,
    borderRadius: "12@s",
    backgroundColor: Colors.backgroundLight,
  },
  loadingText: {
    fontSize: "16@s",
    color: Colors.textSecondary,
    marginLeft: "12@s",
  },
  addressRow: {
    flexDirection: "row",
    marginBottom: "20@vs",
  },
  streetInput: {
    flex: 2,
    marginRight: "12@s",
  },
  buildingInput: {
    flex: 1,
  },
  locationConfirmation: {
    backgroundColor: Colors.primaryBackground,
    borderRadius: "12@s",
    padding: "20@s",
    borderWidth: "2@s",
    borderColor: Colors.primaryLight,
  },
  confirmationTitle: {
    fontSize: "16@s",
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: "8@vs",
    textAlign: "center",
  },
  confirmationDescription: {
    fontSize: "14@s",
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: "20@vs",
    lineHeight: "20@vs",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 0.48,
    paddingVertical: "14@vs",
    borderWidth: "2@s",
    borderColor: Colors.border,
    borderRadius: "12@s",
    backgroundColor: Colors.white,
  },
  confirmationButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  confirmationButtonText: {
    fontSize: "14@s",
    color: Colors.textSecondary,
    marginLeft: "8@s",
    fontWeight: "600",
  },
  confirmationButtonTextSelected: {
    color: Colors.white,
  },
  errorText: {
    color: Colors.danger,
    fontSize: "12@s",
    marginTop: "6@vs",
    fontWeight: "500",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: "20@s",
    paddingVertical: "16@vs",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: "-2@vs",
    },
    shadowOpacity: 0.1,
    shadowRadius: "8@s",
    elevation: 8,
  },
  createButton: {
    height: "56@vs",
    borderRadius: "16@s",
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: "4@vs",
    },
    shadowOpacity: 0.3,
    shadowRadius: "8@s",
    elevation: 8,
  },
});

export default BusinessRegisterScreen;


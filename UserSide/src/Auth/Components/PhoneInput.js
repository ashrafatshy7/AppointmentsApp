// src/Auth/Components/PhoneInput.js
import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { FontAwesome5 } from "@expo/vector-icons";
import Colors from "../../Constants/Colors";

// Sample country codes - in a real app, you would have a complete list
const countryCodes = [
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
];

const PhoneInput = ({
  value,
  onChangeText,
  placeholder = "Enter phone number",
  error = null,
  containerStyle = {},
  disabled = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle phone number with country code
  const handleChange = (text) => {
    // Remove any non-numeric characters
    const numericText = text.replace(/[^0-9]/g, "");

    if (onChangeText) {
      // Return the full phone number with country code
      const fullPhoneNumber = `${selectedCountry.code}${numericText}`;
      onChangeText(fullPhoneNumber);
    }
  };

  // Extract the phone number without country code
  const getPhoneNumberWithoutCode = () => {
    if (!value) return "";

    // Find the country code in the value
    const countryCode = countryCodes.find((cc) => value.startsWith(cc.code));

    if (countryCode) {
      return value.substring(countryCode.code.length);
    }

    return value;
  };

  // Filter countries based on search query
  const getFilteredCountries = () => {
    if (!searchQuery.trim()) {
      return countryCodes;
    }

    const query = searchQuery.toLowerCase();
    return countryCodes.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.code.includes(query)
    );
  };

  // Render each country item
  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
        // Update the complete phone number with new country code
        if (value) {
          onChangeText(`${item.code}${getPhoneNumberWithoutCode()}`);
        }
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Phone Input with Country Code Selector */}
      <View
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        {/* Country Code Selector */}
        <TouchableOpacity
          style={styles.countryCodeSelector}
          onPress={() => setShowCountryPicker(true)}
          disabled={disabled}
        >
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
          <FontAwesome5
            name="chevron-down"
            size={12}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Phone Number Input */}
        <TextInput
          style={styles.phoneInput}
          value={getPhoneNumberWithoutCode()}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          keyboardType="phone-pad"
          editable={!disabled}
        />
      </View>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <FontAwesome5 name="times" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Country</Text>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <FontAwesome5
              name="search"
              size={16}
              color={Colors.textLight}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by country name or code"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery("")}
              >
                <FontAwesome5
                  name="times-circle"
                  size={16}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Countries List */}
          <FlatList
            data={getFilteredCountries()}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.code}
            style={styles.countriesList}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: "16@s",
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    minHeight: "56@vs",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainerError: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Keep same background as normal state
    shadowColor: Colors.danger,
    shadowOpacity: 0.2,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.backgroundGray,
    opacity: 0.7,
  },
  countryCodeSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "12@s",
    paddingVertical: "12@vs",
  },
  countryFlag: {
    fontSize: "15@s",
    marginRight: "6@s",
  },
  countryCodeText: {
    fontSize: "14@s",
    color: Colors.textPrimary,
    marginRight: "6@s",
    fontFamily: 'Poppins-Medium',
  },
  separator: {
    width: 1,
    height: "24@vs",
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: "12@s",
    fontSize: "14@s",
    color: Colors.textPrimary,
    fontFamily: 'Poppins-Medium',
  },
  errorText: {
    color: Colors.danger,
    fontSize: "12@s",
    marginTop: "6@vs",
    marginLeft: "4@s",
    fontFamily: 'Poppins-Regular',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: "16@s",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: "8@s",
  },
  modalTitle: {
    fontSize: "18@s",
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginLeft: "16@s",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: "16@s",
    paddingHorizontal: "12@s",
    paddingVertical: "8@vs",
    backgroundColor: Colors.backgroundLight,
    borderRadius: "8@s",
  },
  searchIcon: {
    marginRight: "8@s",
  },
  searchInput: {
    flex: 1,
    fontSize: "16@s",
    color: Colors.textPrimary,
  },
  clearButton: {
    padding: "4@s",
  },
  countriesList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: "16@s",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryName: {
    flex: 1,
    fontSize: "16@s",
    color: Colors.textPrimary,
  },
  countryCode: {
    fontSize: "16@s",
    color: Colors.textSecondary,
    marginLeft: "8@s",
  },
});

export default PhoneInput;
// src/Auth/Services/LocationService.js
import * as Location from "expo-location";

export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 10000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      coordinates: [location.coords.longitude, location.coords.latitude],
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    throw error;
  }
};

// Calculate Levenshtein distance between two strings
const levenshteinDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

// Calculate similarity percentage
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = levenshteinDistance(longer, shorter);

  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance) / longer.length;
};

// Find best matching city using fuzzy matching
const findBestCityMatch = (detectedCityName, cities) => {
  let bestMatch = null;
  let bestSimilarity = 0;
  const minSimilarity = 0.7; // 70% similarity threshold

  cities.forEach((city) => {
    // Check English name similarity
    const englishSimilarity = calculateSimilarity(
      detectedCityName.toLowerCase(),
      city.english?.toLowerCase() || ''
    );

    // Check Hebrew name similarity (if exists)
    let hebrewSimilarity = 0;
    if (city.hebrew) {
      hebrewSimilarity = calculateSimilarity(
        detectedCityName.toLowerCase(),
        city.hebrew.toLowerCase()
      );
    }

    const maxSimilarity = Math.max(englishSimilarity, hebrewSimilarity);

    if (maxSimilarity > bestSimilarity && maxSimilarity >= minSimilarity) {
      bestSimilarity = maxSimilarity;
      bestMatch = city;
    }
  });


  return bestMatch;
};

// Improved city matching with fuzzy matching
export const findNearestCity = async (userLocation, cities) => {
  if (!userLocation || !cities || cities.length === 0) {
    return null;
  }

  try {
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });

    if (reverseGeocode && reverseGeocode.length > 0) {
      const address = reverseGeocode[0];

      const possibleCityNames = [
        address.city,
        address.subregion,
        address.region,
        address.district,
        address.name,
        address.street,
      ].filter(Boolean);

      // Try exact matches first
      for (const cityName of possibleCityNames) {
        const exactMatch = cities.find(
          (city) =>
            city.english?.toLowerCase() === cityName.toLowerCase() ||
            city.hebrew === cityName
        );

        if (exactMatch) {
          return exactMatch;
        }
      }

      // If no exact match, try fuzzy matching
      for (const cityName of possibleCityNames) {
        const fuzzyMatch = findBestCityMatch(cityName, cities);

        if (fuzzyMatch) {
          return fuzzyMatch;
        }
      }

    }

    return null;
  } catch (error) {
    return null;
  }
};

export default {
  requestLocationPermission,
  getCurrentLocation,
  findNearestCity,
};


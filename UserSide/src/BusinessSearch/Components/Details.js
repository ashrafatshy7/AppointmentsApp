// src/BusinessDetailsPage/Details.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import Colors from "../../Constants/Colors";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { ScaledSheet } from "react-native-size-matters";
import { useTheme } from '../../Context/ThemeContext';

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Details({ openHours, bio, businessData }) {
  const { theme, isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  
  // Check if bio is long enough to need expansion
  const BIO_CHARACTER_LIMIT = 60; // Reduced from 100 to show fewer lines initially
  const isBioLong = bio && bio.length > BIO_CHARACTER_LIMIT;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const toggleBioExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBioExpanded(!bioExpanded);
  };

  // Define days of the week in order - match server format
  const daysOfWeek = [
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
  ];

  // Helper function to capitalize day names
  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    
    // Map abbreviated day names to full names
    const dayMap = {
      'sun': 'Sunday',
      'mon': 'Monday', 
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday'
    };
    
    return dayMap[s] || s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.primaryBackground,
      shadowColor: theme.black 
    }]}>
      {/* Bio Section */}
      <View style={[styles.bioContainer, { borderBottomColor: theme.borderLight }]}>
        <Text style={[styles.bioTitle, { color: theme.primary }]}>About</Text>
        <Text style={[styles.bioText, { color: theme.textPrimary }]} numberOfLines={bioExpanded ? null : 2}>
          {bio}
        </Text>
        {isBioLong && (
          <TouchableOpacity onPress={toggleBioExpand} style={styles.readMoreButton}>
            <Text style={[styles.readMoreText, { color: theme.primary }]}>
              {bioExpanded ? "Read Less" : "Read More"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Header */}
      <TouchableOpacity onPress={toggleExpand} style={[styles.header, { backgroundColor: theme.borderLight }]}>
        <Text style={[styles.headerText, { color: theme.primary }]}>Details</Text>
        <FontAwesome5
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.primary}
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.content}>
          {/* Address */}
          <View style={styles.section}>
            <View style={styles.row}>
              <FontAwesome5
                name="map-marker-alt"
                size={20}
                color={theme.primary}
                style={styles.icon}
              />
              <Text style={[styles.addressText, { color: theme.textPrimary }]}>
                {businessData?.address?.fullAddress || businessData?.address?.street || 'Address not available'}
              </Text>
            </View>
          </View>

          {/* Contact Information */}
          {businessData?.businessPhone && (
            <View style={styles.section}>
              <View style={styles.row}>
                <FontAwesome5
                  name="phone"
                  size={20}
                  color={theme.primary}
                  style={styles.icon}
                />
                <Text style={[styles.contactText, { color: theme.textPrimary }]}>
                  {businessData.businessPhone}
                </Text>
              </View>
            </View>
          )}

          {/* Social Media Icons */}
          <View style={styles.section}>
            <View style={styles.socialRow}>
              <TouchableOpacity 
                style={[styles.socialButton, { 
                  backgroundColor: theme.primaryBackground,
                  shadowColor: theme.black
                }]}
                onPress={() => {
                  if (businessData?.businessPhone) {
                    // Handle phone call - you can add Linking.openURL here if needed
                    console.log('Calling:', businessData.businessPhone);
                  }
                }}
              >
                <FontAwesome
                  name="phone"
                  size={24}
                  color={theme.primary}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, { 
                backgroundColor: theme.primaryBackground,
                shadowColor: theme.black
              }]}>
                <FontAwesome5
                  name="instagram"
                  size={24}
                  color={theme.primary}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, { 
                backgroundColor: theme.primaryBackground,
                shadowColor: theme.black
              }]}>
                <FontAwesome5
                  name="whatsapp"
                  size={24}
                  color={theme.primary}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, { 
                backgroundColor: theme.primaryBackground,
                shadowColor: theme.black
              }]}>
                <FontAwesome5
                  name="facebook"
                  size={24}
                  color={theme.primary}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Open Hours */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Open Hours:</Text>
            {daysOfWeek.map((day) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={[styles.dayText, { color: theme.textPrimary }]}>{capitalize(day)}:</Text>
                <Text style={[styles.timeText, { color: theme.textPrimary }]}>
                  {openHours && openHours[day] && openHours[day].open && openHours[day].close
                    ? `${openHours[day].open} - ${openHours[day].close}`
                    : "Closed"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    marginTop: "10@s",
    borderRadius: "12@s",
    overflow: "hidden",
    shadowOffset: { width: 0, height: "2@s" },
    shadowOpacity: 0.1,
    shadowRadius: "4@s",
    elevation: 3,
    marginBottom: "10@s",
  },
  bioContainer: {
    padding: "15@s",
    borderBottomWidth: "1@s",
  },
  bioTitle: {
    fontSize: "17@s",
    fontFamily: "Inter-SemiBold",
    marginBottom: "8@s",
  },
  bioText: {
    fontSize: "14@s",
    fontFamily: "Inter-Regular",
    lineHeight: "20@s",
  },
  readMoreButton: {
    marginTop: "5@s",
    alignSelf: "flex-end",
  },
  readMoreText: {
    fontSize: "14@s",
    fontFamily: "Inter-SemiBold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: "12@s",
    paddingHorizontal: "15@s",
  },
  headerText: {
    fontSize: "17@s",
    fontFamily: "Inter-SemiBold",
  },
  content: {
    padding: "15@s",
  },
  section: {
    marginTop: "10@s",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: "10@s",
  },
  addressText: {
    fontSize: "15@s",
    fontFamily: "Inter-Regular",
  },
  contactText: {
    fontSize: "15@s",
    fontFamily: "Inter-Regular",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "10@s",
  },
  socialButton: {
    width: "50@s",
    height: "50@s",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "25@s",
    shadowOffset: { width: 0, height: "1@s" },
    shadowOpacity: 0.05,
    shadowRadius: "2@s",
    elevation: 1,
  },
  socialIcon: {
    marginHorizontal: "10@s",
  },
  sectionTitle: {
    fontSize: "16@s",
    fontFamily: "Inter-Medium",
    marginBottom: "8@s",
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "10@s",
    marginBottom: "5@s",
  },
  dayText: {
    fontSize: "15@s",
    fontFamily: "Inter-Regular",
  },
  timeText: {
    fontSize: "15@s",
    fontFamily: "Inter-Regular",
  },
});
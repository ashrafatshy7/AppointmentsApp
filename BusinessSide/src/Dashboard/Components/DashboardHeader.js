// src/Dashboard/Components/DashboardHeader.js
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../Constants/Colors';
import { useBusiness } from '../../Context/BusinessContext';
import ApiService from '../Service/ApiService';

const DashboardHeader = ({ theme, navigation }) => {
  const { activeBusiness } = useBusiness(); // Get activeBusiness from context - no more AsyncStorage

  // Get dynamic greeting based on current time
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return "Good Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      return "Good Afternoon";
    } else if (currentHour >= 17 && currentHour < 21) {
      return "Good Evening";
    } else {
      return "Good Night";
    }
  };

  // Format date
  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const todayFormatted = formatDate(new Date());
  const greeting = getGreeting();

  // Get business info from context only (no more cached data)
  const businessName = activeBusiness?.name || activeBusiness?.businessName || 'Your Business';
  const ownerName = activeBusiness?.ownerName || 'Business Owner';
  const profileImagePath = activeBusiness?.profileImage; // Use profileImage directly from context
  const profileImage = ApiService.getFullImageUrl(profileImagePath); // Convert to full URL

  return (
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      <View style={styles.headerContent}>
        <View>
          <Text style={[styles.greeting, { color: Colors.white, fontFamily: 'Inter-Medium' }]}>
            {greeting},
          </Text>
          <Text style={[styles.businessName, { color: Colors.white, fontFamily: 'Inter-Bold' }]}>
            {businessName}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.profileButton, { backgroundColor: theme.primaryDark }]}
          onPress={() => navigation.navigate('BusinessProfile')}
        >
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <FontAwesome5 name="user" size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.dateContainer}>
        <FontAwesome5 name="calendar-day" size={14} color={Colors.white} style={styles.dateIcon} />
        <Text style={[styles.currentDate, { color: Colors.white, fontFamily: 'Inter-Regular' }]}>
          {todayFormatted}
        </Text>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  header: {
    paddingTop: '15@s',
    paddingBottom: '10@s',
    paddingHorizontal: '18@s',
    borderBottomLeftRadius: '20@s',
    borderBottomRightRadius: '20@s',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: '14@s',
    fontFamily: 'Inter-Medium',
  },
  businessName: {
    fontSize: '20@s',
    fontFamily: 'Inter-Bold',
    marginTop: '4@s',
  },
  profileButton: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '6@s',
  },
  dateIcon: {
    marginRight: '6@s',
  },
  currentDate: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
  },
});

export default DashboardHeader;

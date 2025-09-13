// src/Auth/Components/AuthHeader.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import Colors from '../../Constants/Colors';

const AuthHeader = ({
  title,
  subtitle = null,
  showBackButton = false,
  onBackPress = null,
  rightComponent = null,
  containerStyle = {},
  titleStyle = {},
  subtitleStyle = {},
}) => {
  const navigation = useNavigation();

  // Handle back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // Memoize container style to prevent unnecessary re-renders
  const containerStyles = useMemo(() => [
    styles.container,
    containerStyle,
  ], [containerStyle]);

  // Memoize title style to prevent unnecessary re-renders
  const titleStyles = useMemo(() => [
    styles.title,
    titleStyle,
  ], [titleStyle]);

  // Memoize subtitle style to prevent unnecessary re-renders
  const subtitleStyles = useMemo(() => [
    styles.subtitle,
    subtitleStyle,
  ], [subtitleStyle]);

  return (
    <View style={containerStyles}>
      <View style={styles.row}>
        {/* Back Button (conditional) */}
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <FontAwesome5 name="arrow-left" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}

        {/* Center column with title and subtitle */}
        <View style={styles.centerColumn}>
          <Text style={titleStyles}>{title}</Text>
          {subtitle && <Text style={subtitleStyles}>{subtitle}</Text>}
        </View>

        {/* Right Component (optional) */}
        {rightComponent ? (
          <View style={styles.rightComponent}>{rightComponent}</View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? Constants.statusBarHeight + 10 : Constants.statusBarHeight,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  rightComponent: {
    width: 40,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 40,
  },
});

export default React.memo(AuthHeader);
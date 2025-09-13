import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../Constants/Colors';

const GradientBackground = ({ 
  children, 
  colors = null, 
  style = {}, 
  start = { x: 0, y: 0 }, 
  end = { x: 1, y: 1 },
  locations = null
}) => {
  const defaultColors = [Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd, Colors.gradientDark];
  const defaultLocations = [0, 0.3, 0.7, 1];
  
  const gradientColors = colors || defaultColors;
  const gradientLocations = locations || defaultLocations;

  return (
    <LinearGradient
      colors={gradientColors}
      start={start}
      end={end}
      locations={gradientLocations}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default GradientBackground;
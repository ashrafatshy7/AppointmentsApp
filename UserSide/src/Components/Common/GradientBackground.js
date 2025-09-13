import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../Constants/Colors';
import { useTheme } from '../../Context/ThemeContext';

const GradientBackground = ({ 
  children, 
  colors = null, 
  style = {}, 
  start = { x: 0, y: 0 }, 
  end = { x: 1, y: 1 },
  locations = null
}) => {
  const { theme, isDarkMode } = useTheme();
  
  const defaultColors = isDarkMode 
    ? [theme.primary, theme.primaryDark, theme.background]
    : [Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd, Colors.gradientDark];
  
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
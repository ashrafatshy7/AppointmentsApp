import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../Constants/Colors';

const { width, height } = Dimensions.get('window');

const DecorativeBackground = ({ children }) => {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Large decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />
      <View style={[styles.circle, styles.circle4]} />
      <View style={[styles.circle, styles.circle5]} />
      
      {/* Small decorative circles */}
      <View style={[styles.smallCircle, styles.smallCircle1]} />
      <View style={[styles.smallCircle, styles.smallCircle2]} />
      <View style={[styles.smallCircle, styles.smallCircle3]} />
      <View style={[styles.smallCircle, styles.smallCircle4]} />
      
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    backgroundColor: Colors.accent,
    borderRadius: 1000,
  },
  smallCircle: {
    position: 'absolute',
    backgroundColor: Colors.accentLight,
    borderRadius: 1000,
  },
  // Large circles
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    left: -50,
    opacity: 0.6,
  },
  circle2: {
    width: 150,
    height: 150,
    top: height * 0.3,
    right: -75,
    opacity: 0.4,
  },
  circle3: {
    width: 120,
    height: 120,
    bottom: height * 0.2,
    left: width * 0.7,
    opacity: 0.5,
  },
  circle4: {
    width: 180,
    height: 180,
    bottom: -90,
    right: width * 0.3,
    opacity: 0.3,
  },
  circle5: {
    width: 80,
    height: 80,
    top: height * 0.15,
    left: width * 0.1,
    opacity: 0.7,
  },
  // Small circles
  smallCircle1: {
    width: 20,
    height: 20,
    top: height * 0.25,
    left: width * 0.8,
    opacity: 0.8,
  },
  smallCircle2: {
    width: 15,
    height: 15,
    top: height * 0.45,
    left: width * 0.15,
    opacity: 0.6,
  },
  smallCircle3: {
    width: 25,
    height: 25,
    bottom: height * 0.35,
    right: width * 0.1,
    opacity: 0.7,
  },
  smallCircle4: {
    width: 18,
    height: 18,
    bottom: height * 0.15,
    left: width * 0.2,
    opacity: 0.5,
  },
});

export default DecorativeBackground;
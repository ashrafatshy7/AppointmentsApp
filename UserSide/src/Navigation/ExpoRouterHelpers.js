// src/Navigation/ExpoRouterHelpers.js
// For Expo Router users - alternative to React Navigation

import { router, useSegments } from 'expo-router';

/**
 * Expo Router equivalent of navigateToHome
 * Handles proper back navigation with left-to-right animations
 */
export const navigateToHomeExpoRouter = () => {
  try {
    // Check if we can go back
    if (router.canGoBack()) {
      const segments = useSegments();
      
      // Check if we're in a home-related route
      if (segments.length > 1 && segments[0] === '(tabs)' && segments[1] === 'home') {
        // We're nested in home, go back
        router.back();
        return;
      }
      
      // Check if we're in any nested route that should go back to home
      if (segments.length > 2) {
        router.back();
        return;
      }
    }
    
    // If we can't go back or we're not in a nested context, navigate to home
    // Use replace to avoid stacking duplicate home routes
    router.replace('/');
  } catch (error) {
    console.warn('Expo Router navigation to Home failed:', error);
    // Fallback
    router.push('/');
  }
};

/**
 * Enhanced Expo Router home navigation for complex scenarios
 */
export const navigateToHomeExpoRouterAdvanced = () => {
  try {
    const segments = useSegments();
    
    // If we're already at root, no action needed
    if (segments.length <= 1) {
      return;
    }
    
    // Check if we're in tabs
    const isInTabs = segments[0] === '(tabs)';
    
    if (isInTabs) {
      const currentTab = segments[1];
      
      if (currentTab === 'home' && segments.length > 2) {
        // We're nested in home tab, go back
        router.back();
        return;
      } else if (currentTab !== 'home') {
        // We're in a different tab, navigate to home tab
        router.replace('/(tabs)/home');
        return;
      }
    }
    
    // For any other scenario, use replace to avoid duplicates
    router.replace('/');
    
  } catch (error) {
    console.warn('Advanced Expo Router home navigation failed:', error);
    router.replace('/');
  }
};

/**
 * Custom hook for handling home navigation in Expo Router
 */
export const useHomeNavigation = () => {
  const segments = useSegments();
  
  const navigateHome = () => {
    navigateToHomeExpoRouterAdvanced();
  };
  
  const canGoBackToHome = () => {
    return router.canGoBack() && segments.length > 1;
  };
  
  const isAtHome = () => {
    return segments.length <= 1 || (segments[0] === '(tabs)' && segments[1] === 'home' && segments.length === 2);
  };
  
  return {
    navigateHome,
    canGoBackToHome,
    isAtHome
  };
};
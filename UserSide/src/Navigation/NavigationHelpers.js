// src/Navigation/NavigationHelpers.js
import { CommonActions } from '@react-navigation/native';

/**
 * Safely navigates to Home with proper back animation
 * Works from anywhere in the app - nested stacks, deep navigation, etc.
 */
export const navigateToHome = (navigation) => {
  try {
    const state = navigation.getState();
    
    // Get current route info
    const currentRoute = state?.routes?.[state?.index];
    const isInHomeTab = currentRoute?.name === 'Home';
    
    if (isInHomeTab) {
      // We're in Home tab - check stack depth
      const homeStackState = currentRoute?.state;
      const stackDepth = homeStackState?.routes?.length || 1;
      
      if (stackDepth > 1) {
        // Multiple screens in Home stack - use goBack instead of popToTop
        // This works better from nested screens
        navigation.goBack();
        return;
      } else {
        // Already at Home root - no action needed
        console.log('Already at Home root');
        return;
      }
    }
    
    // Check if we can go back to a previous screen
    if (navigation.canGoBack()) {
      // Try to determine if going back will lead to Home
      const parentState = navigation.getParent()?.getState();
      if (parentState) {
        const parentRoute = parentState.routes?.[parentState.index];
        if (parentRoute?.name === 'Home') {
          // Going back will lead to Home tab
          navigation.goBack();
          return;
        }
      }
      
      // If we're not sure where goBack leads, use tab navigation
      navigation.navigate('Home');
      return;
    }
    
    // Navigate to Home tab (this will trigger the tab listener which resets the stack)
    navigation.navigate('Home');
    
  } catch (error) {
    console.warn('Navigation to Home failed, using fallback:', error);
    // Fallback: direct navigation to Home
    navigation.navigate('Home');
  }
};

/**
 * Enhanced version that handles complex navigation scenarios
 */
export const navigateToHomeAdvanced = (navigation) => {
  try {
    const rootState = navigation.getRootState();
    const tabState = rootState?.routes?.find(route => route.name === 'Main' || route.state?.type === 'tab');
    
    if (!tabState) {
      // No tab navigator found, use simple navigation
      navigation.navigate('Home');
      return;
    }
    
    const homeTabIndex = tabState.state?.routes?.findIndex(route => route.name === 'Home');
    const currentTabIndex = tabState.state?.index;
    
    if (homeTabIndex !== -1 && currentTabIndex === homeTabIndex) {
      // We're on Home tab, pop to top of Home stack
      const homeRoute = tabState.state.routes[homeTabIndex];
      const homeStackState = homeRoute.state;
      
      if (homeStackState?.routes?.length > 1) {
        navigation.popToTop();
      }
      // Already at Home root, no action needed
      return;
    }
    
    // Switch to Home tab (tab listener will reset the stack)
    navigation.navigate('Home');
    
  } catch (error) {
    console.warn('Advanced Home navigation failed, using simple navigation:', error);
    navigation.navigate('Home');
  }
};
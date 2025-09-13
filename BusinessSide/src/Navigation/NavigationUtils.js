// src/Navigation/NavigationUtils.js
import { CommonActions, StackActions } from '@react-navigation/native';
import { Alert, BackHandler } from 'react-native';

/**
 * Reference to the navigation object
 * This will be set from the AppNavigator
 */
let _navigator;

/**
 * Set the navigation reference
 * @param {object} navigatorRef - The navigation reference
 */
export const setNavigationRef = (navigatorRef) => {
  _navigator = navigatorRef;
};

/**
 * Navigate to a screen
 * @param {string} name - The name of the screen
 * @param {object} params - The params to pass to the screen
 */
export const navigate = (name, params) => {
  if (_navigator) {
    _navigator.dispatch(
      CommonActions.navigate({
        name,
        params,
      })
    );
  } else {
    console.warn('Navigation attempted before navigator was ready');
  }
};

/**
 * Push a new screen onto the stack
 * @param {string} name - The name of the screen
 * @param {object} params - The params to pass to the screen
 */
export const push = (name, params) => {
  if (_navigator) {
    _navigator.dispatch(
      StackActions.push(name, params)
    );
  } else {
    console.warn('Navigation (push) attempted before navigator was ready');
  }
};

/**
 * Go back to the previous screen
 */
export const goBack = () => {
  if (_navigator) {
    _navigator.dispatch(CommonActions.goBack());
  } else {
    console.warn('Navigation (goBack) attempted before navigator was ready');
  }
};

/**
 * Reset the navigation stack
 * @param {string} name - The name of the screen to navigate to
 * @param {object} params - The params to pass to the screen
 */
export const reset = (name, params) => {
  if (_navigator) {
    _navigator.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      })
    );
  } else {
    console.warn('Navigation (reset) attempted before navigator was ready');
  }
};

/**
 * Navigate to the root of a specific tab
 * @param {string} tabName - The name of the tab
 */
export const navigateToTab = (tabName) => {
  if (_navigator) {
    _navigator.dispatch(
      CommonActions.navigate({
        name: 'MainTab',
        params: { screen: tabName },
      })
    );
  } else {
    console.warn('Navigation (navigateToTab) attempted before navigator was ready');
  }
};

/**
 * Navigate to a screen in a specific tab
 * @param {string} tabName - The name of the tab
 * @param {string} screenName - The name of the screen
 * @param {object} params - The params to pass to the screen
 */
export const navigateToTabScreen = (tabName, screenName, params) => {
  if (_navigator) {
    _navigator.dispatch(
      CommonActions.navigate({
        name: 'MainTab',
        params: {
          screen: tabName,
          params: {
            screen: screenName,
            params,
          },
        },
      })
    );
  } else {
    console.warn('Navigation (navigateToTabScreen) attempted before navigator was ready');
  }
};

/**
 * Pop back to a specific screen
 * @param {string} name - The name of the screen to pop back to
 */
export const popToScreen = (name) => {
  if (_navigator) {
    _navigator.dispatch(
      StackActions.popTo(name)
    );
  } else {
    console.warn('Navigation (popToScreen) attempted before navigator was ready');
  }
};

/**
 * Pop back multiple screens
 * @param {number} count - The number of screens to pop
 */
export const popMultiple = (count = 1) => {
  if (_navigator) {
    _navigator.dispatch(
      StackActions.pop(count)
    );
  } else {
    console.warn('Navigation (popMultiple) attempted before navigator was ready');
  }
};

/**
 * Pop to the top of the current stack
 */
export const popToTop = () => {
  if (_navigator) {
    _navigator.dispatch(
      StackActions.popToTop()
    );
  } else {
    console.warn('Navigation (popToTop) attempted before navigator was ready');
  }
};

/**
 * Replace the current screen
 * @param {string} name - The name of the screen
 * @param {object} params - The params to pass to the screen
 */
export const replace = (name, params) => {
  if (_navigator) {
    _navigator.dispatch(
      StackActions.replace(name, params)
    );
  } else {
    console.warn('Navigation (replace) attempted before navigator was ready');
  }
};

/**
 * Get the current route name
 * @returns {string} The current route name
 */
export const getCurrentRouteName = () => {
  if (_navigator) {
    return _navigator.getCurrentRoute()?.name;
  }
  return null;
};

/**
 * Check if a screen is focused
 * @param {string} screenName - The name of the screen
 * @returns {boolean} Whether the screen is focused
 */
export const isScreenFocused = (screenName) => {
  if (_navigator) {
    const currentRouteName = _navigator.getCurrentRoute()?.name;
    return currentRouteName === screenName;
  }
  return false;
};

/**
 * Custom back handler with confirmation dialog
 * @param {object} navigation - The navigation object
 * @param {string} message - Confirmation message
 * @param {function} callback - Optional callback after confirmation
 */
export const backWithConfirmation = (navigation, message, callback) => {
  Alert.alert(
    'Confirm',
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          navigation.goBack();
          if (callback) callback();
        },
      },
    ],
    { cancelable: false }
  );
};

/**
 * Register a custom back button handler for a screen
 * @param {function} handler - Function to call on back press
 * @returns {function} Function to remove the listener
 */
export const setCustomBackHandler = (handler) => {
  return BackHandler.addEventListener('hardwareBackPress', handler);
};

export default {
  setNavigationRef,
  navigate,
  push,
  goBack,
  reset,
  navigateToTab,
  navigateToTabScreen,
  popToScreen,
  popMultiple,
  popToTop,
  replace,
  getCurrentRouteName,
  isScreenFocused,
  backWithConfirmation,
  setCustomBackHandler
};

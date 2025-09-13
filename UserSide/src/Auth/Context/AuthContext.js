// src/Auth/Context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { clientApi } from '../Services/ApiService';

// Auth action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  AUTH_ERROR: 'AUTH_ERROR',
  LOGOUT: 'LOGOUT',
  RESTORE_TOKEN: 'RESTORE_TOKEN',
  SET_PHONE: 'SET_PHONE',
  VERIFY_OTP: 'VERIFY_OTP',
  CLEAR_OTP: 'CLEAR_OTP',
  SET_OTP_SENT: 'SET_OTP_SENT',
};

// Initial auth state
const initialState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  user: null,
  tempPhone: null,
  isOtpVerified: false,
  isOtpSent: false,
  error: null,
};

// Auth reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };
    case AUTH_ACTIONS.RESTORE_TOKEN:
      return {
        ...state,
        userToken: action.payload.token,
        user: action.payload.user,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isSignout: false,
        userToken: action.payload.token,
        user: action.payload.user,
        isLoading: false,
        error: null,
        tempPhone: null,
        isOtpVerified: false,
        isOtpSent: false,
      };
    case AUTH_ACTIONS.AUTH_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isSignout: true,
        userToken: null,
        user: null,
        isLoading: false,
        error: null,
        tempPhone: null,
        isOtpVerified: false,
        isOtpSent: false,
      };
    case AUTH_ACTIONS.SET_PHONE:
      return {
        ...state,
        tempPhone: action.payload,
        isOtpVerified: false,
        isOtpSent: false,
      };
    case AUTH_ACTIONS.VERIFY_OTP:
      return {
        ...state,
        isOtpVerified: true,
        error: null,
      };
    case AUTH_ACTIONS.SET_OTP_SENT:
      return {
        ...state,
        isOtpSent: action.payload,
        error: null,
      };
    case AUTH_ACTIONS.CLEAR_OTP:
      return {
        ...state,
        isOtpVerified: false,
        isOtpSent: false,
      };
    default:
      return state;
  }
};

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Effect to restore token from storage
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken = null;
      let userData = null;
      
      try {
        // Load token and user data from AsyncStorage
        userToken = await AsyncStorage.getItem('userToken');
        const userDataString = await AsyncStorage.getItem('userData');
        
        if (userDataString) {
          userData = JSON.parse(userDataString);
        }
      } catch (e) {
        // Token restoration failed
      }
      
      // Restore token and user data or set to null
      dispatch({ 
        type: AUTH_ACTIONS.RESTORE_TOKEN, 
        payload: { token: userToken, user: userData } 
      });
    };

    bootstrapAsync();
  }, []);

  // Send OTP to phone number - SIMPLE VERSION
  const sendOtp = useCallback(async (phone) => {
    try {
      const result = await clientApi.sendOtp(phone);
      
      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.SET_OTP_SENT, payload: true });
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Failed to send OTP' };
    }
  }, []);

  // Verify OTP and handle authentication
  const verifyOtp = useCallback(async (phone, otp, userData = null) => {
    try {
      // For now, accept "111111" as valid OTP
      if (otp === '111111') {
        if (userData) {
          // This is a registration flow - register the user
          
          const registerResult = await clientApi.register(userData);
          if (registerResult.success) {
            const { token, user } = registerResult.data;
            
            // Store auth data
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(user));
            await AsyncStorage.setItem('location_checked', 'true');
            // Don't set default city - user must select one
            
            dispatch({
              type: AUTH_ACTIONS.REGISTER_SUCCESS,
              payload: { token, user },
            });
            
            return { success: true, action: 'registered' };
          } else {
            return { success: false, error: registerResult.error };
          }
        } else {
          // This is a login flow - verify OTP with server and get user token
          const verifyResult = await clientApi.verifyOtp(phone, otp);
          
          if (verifyResult.success && !verifyResult.data.isNewUser) {
            // User exists and OTP is valid - login successful
            const { token, user } = verifyResult.data;
            
            // Store auth data
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(user));
            await AsyncStorage.setItem('location_checked', 'true');
            // Don't set default city - user must select one
            
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { token, user },
            });
            
            return { success: true, action: 'logged_in' };
          } else {
            // OTP verification failed or user doesn't exist
            return { success: false, error: verifyResult.error || 'Invalid OTP or user not found' };
          }
        }
      } else {
        return { success: false, error: 'Invalid OTP code' };
      }
    } catch (error) {
      return { success: false, error: 'OTP verification failed' };
    }
  }, []);

  // Handle user registration
  const register = useCallback(async (userData) => {
    try {
      const result = await clientApi.register(userData);
      
      if (result.success) {
        const { token, user } = result.data;
        
        // Store auth data
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        await AsyncStorage.setItem('location_checked', 'true');
        // Don't set default city - user must select one
        
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { token, user },
        });
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  }, []);

  // Handle user login
  const login = useCallback(async (phone) => {
    try {
      const result = await clientApi.login(phone);
      
      if (result.success) {
        const { token, user } = result.data;
        
        // Store auth data
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        await AsyncStorage.setItem('location_checked', 'true');
        // Don't set default city - user must select one
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { token, user },
        });
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }, []);

  // Handle user logout
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Save phone for OTP verification
  const setPhone = useCallback((phone) => {
    dispatch({ type: AUTH_ACTIONS.SET_PHONE, payload: phone });
  }, []);

  // Clear OTP verification state
  const clearOtp = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_OTP });
  }, []);

  // Clear any auth errors
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.AUTH_ERROR, payload: null });
  }, []);

  // Return the context value
  const contextValue = {
    ...state,
    sendOtp,
    verifyOtp,
    register,
    login,
    logout,
    setPhone,
    clearOtp,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
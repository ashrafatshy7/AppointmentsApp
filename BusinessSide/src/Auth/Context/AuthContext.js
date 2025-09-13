// src/Auth/Context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile } from "../Services/ApiService";

// Create context
const AuthContext = createContext();

// Initial auth state
const initialState = {
  isLoading: true,
  userToken: null,
  userData: null,
  error: null,
};

// Auth action types
const AUTH_ACTIONS = {
  RESTORE_TOKEN: "RESTORE_TOKEN",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  REGISTER: "REGISTER",
  AUTH_ERROR: "AUTH_ERROR",
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.RESTORE_TOKEN:
      return {
        ...state,
        userToken: action.payload.token,
        userData: action.payload.userData,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGIN:
      return {
        ...state,
        userToken: action.payload.token,
        userData: action.payload.userData,
        error: null,
        isLoading: false,
      };
    case AUTH_ACTIONS.REGISTER:
      return {
        ...state,
        userToken: action.payload.token,
        userData: action.payload.userData,
        error: null,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        userToken: null,
        userData: null,
        error: null,
        isLoading: false,
      };
    case AUTH_ACTIONS.AUTH_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Effect to restore authentication from storage on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken = null;
      let userData = null;

      try {
        // Restore authentication tokens (but not business data cache)
        userToken = await AsyncStorage.getItem("businessUserToken");
        const userDataJson = await AsyncStorage.getItem("businessUserData");

        if (userDataJson) {
          userData = JSON.parse(userDataJson);
        }

        // If we have a token, verify it's still valid with the server
        if (userToken && userData) {
          try {
            const profileData = await getUserProfile(userToken);
            // Update userData with fresh server data but keep the token
            userData = {
              ...userData,
              ...profileData.user,
            };
          } catch (error) {
            // Token is invalid, clear it
            console.log("Stored token is invalid, clearing auth data");
            userToken = null;
            userData = null;
            await AsyncStorage.removeItem("businessUserToken");
            await AsyncStorage.removeItem("businessUserData");
          }
        }
      } catch (e) {
        console.error("Failed to restore auth data:", e);
      }

      // Dispatch the restored or cleared token
      dispatch({
        type: AUTH_ACTIONS.RESTORE_TOKEN,
        payload: { token: userToken, userData },
      });
    };

    bootstrapAsync();
  }, []);

  // Auth methods for components to interact with
  const authActions = {
    login: async (token, userData) => {
      try {
        if (!token || !userData) {
          throw new Error("Missing token or user data");
        }

        // Store authentication data for persistence
        await AsyncStorage.setItem("businessUserToken", token);
        await AsyncStorage.setItem("businessUserData", JSON.stringify(userData));

        // Update state
        dispatch({
          type: AUTH_ACTIONS.LOGIN,
          payload: { token, userData },
        });

        return { success: true };
      } catch (error) {
        console.error("Login error:", error);
        dispatch({
          type: AUTH_ACTIONS.AUTH_ERROR,
          payload: error.message || "Authentication failed",
        });

        return {
          success: false,
          error: error.message || "Authentication failed",
        };
      }
    },

    register: async (userData) => {
      try {
        // This method is not used anymore - registration is handled via API calls
        // Keeping for backward compatibility but it doesn't store anything locally
        
        const registeredUser = {
          id: "temp-" + Date.now(),
          businessName: userData.businessName,
          ownerName: userData.ownerName,
          email: userData.email || "",
          phone: userData.phone || "",
        };

        // Update state only - no local storage
        dispatch({
          type: AUTH_ACTIONS.REGISTER,
          payload: { token: null, userData: registeredUser },
        });

        return { success: true };
      } catch (error) {
        dispatch({
          type: AUTH_ACTIONS.AUTH_ERROR,
          payload: error.message || "Registration failed",
        });

        return {
          success: false,
          error: error.message || "Registration failed",
        };
      }
    },

    logout: async () => {
      try {
        // Clear authentication data from storage
        await AsyncStorage.removeItem("businessUserToken");
        await AsyncStorage.removeItem("businessUserData");

        // Update state
        dispatch({ type: AUTH_ACTIONS.LOGOUT });

        return { success: true };
      } catch (error) {
        console.error("Logout error:", error);
        return { success: false, error: "Failed to log out" };
      }
    },

    clearError: () => {
      dispatch({ type: AUTH_ACTIONS.AUTH_ERROR, payload: null });
    },
  };

  // Provide the auth state and methods to components
  const value = {
    ...state,
    ...authActions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


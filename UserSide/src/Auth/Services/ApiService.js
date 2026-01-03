// src/Auth/Services/ApiService.js
import axios from 'axios';

// Base URL for the server - adjust this to match your server configuration
// For React Native, use the machine's IP address, not localhost
const API_BASE_URL = 'http://10.0.0.6:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for debugging
  headers: {
    'Content-Type': 'application/json',
  },
});



// Client authentication API calls using auth routes
export const clientApi = {
  // Check if user exists for login
  checkUserExists: async (phone) => {
    try {
      const response = await api.post('/auth/check-user-exists', { phone });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to check user existence. Please try again.' 
      };
    }
  },

  // Send OTP for phone number
  sendOtp: async (phone) => {
    try {
      const response = await api.post('/auth/send-otp-client', { phone });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to send OTP. Please try again.' 
      };
    }
  },

  // Verify OTP and check if user exists
  verifyOtp: async (phone, otp) => {
    try {
      const response = await api.post('/auth/verify-otp-client', { phone, otp });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Invalid OTP. Please try again.' 
      };
    }
  },

  // Register new client user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register-client', userData);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 400) {
        return { 
          success: false, 
          error: error.response?.data?.error || 'Registration failed. Please check your data.' 
        };
      }
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed. Please try again.' 
      };
    }
  },

  // Login with phone number (legacy - now handled by verifyOtp)
  login: async (phone) => {
    try {
      const response = await api.post('/auth/send-otp-client', { phone });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      };
    }
  },

  // Search clients (for admin purposes)
  search: async (query) => {
    try {
      const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Search failed. Please try again.' 
      };
    }
  },

  // Get all clients (for admin purposes)
  getAll: async () => {
    try {
      const response = await api.get('/clients');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch clients.' 
      };
    }
  }
};

// Business API calls
export const businessApi = {
  // Get businesses by city
  getByCity: async (city) => {
    try {
      const response = await api.get(`/businesses/city/${encodeURIComponent(city)}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch businesses.' 
      };
    }
  },
  
  // Get business details by ID (excluding working hours)
  getDetails: async (businessId) => {
    try {
      const response = await api.get(`/businesses/details/${businessId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch business details.' 
      };
    }
  },
  
  // Get business working hours by ID
  getHours: async (businessId) => {
    try {
      const response = await api.get(`/businesses/hours/${businessId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch business working hours.' 
      };
    }
  },

  // Get businesses by category
  getByCategory: async (category) => {
    try {
      const response = await api.get(`/businesses/category/${encodeURIComponent(category)}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch businesses.' 
      };
    }
  },

  // Get business by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/businesses/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch business details.' 
      };
    }
  },

  // Get business categories
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch categories.' 
      };
    }
  }
};

// Service API calls
export const serviceApi = {
  // Get services for a business
  getByBusiness: async (businessId) => {
    try {
      const response = await api.get(`/services/business/${businessId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch services.' 
      };
    }
  }
};

// Appointment API calls
export const appointmentApi = {
  // Create a new appointment
  create: async (appointmentData, token) => {
    try {
      const config = {
        ...api.defaults,
        headers: {
          ...api.defaults.headers,
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      };
      
      const response = await api.post('/appointments/book', appointmentData, config);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to create appointment. Please try again.',
        details: error.response?.data
      };
    }
  },

  // Get appointments for a specific business
  getByBusiness: async (businessId, date = null) => {
    try {
      const url = date 
        ? `/appointments/business/${businessId}?date=${date}`
        : `/appointments/business/${businessId}`;
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch appointments.' 
      };
    }
  },

  // Get appointments for a specific client
  getByClient: async (clientId) => {
    try {
      const response = await api.get(`/appointments/client/${clientId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch appointments.' 
      };
    }
  }
};

export default {
  client: clientApi,
  business: businessApi,
  service: serviceApi,
  appointment: appointmentApi,
};

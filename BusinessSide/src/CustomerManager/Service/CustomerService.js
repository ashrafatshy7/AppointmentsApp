// src/CustomerManager/Service/CustomerService.js
import ApiService from '../../Dashboard/Service/ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_CUSTOMERS_KEY = 'recent_customers';

class CustomerService {
  constructor() {
    this.apiService = ApiService;
  }

  // Get all customers/clients for the current business (appointment-based)
  async getAllCustomers() {
    try {
      // Get business ID from stored user data
      const businessData = await this.apiService.getBusinessData();
      const businessId = businessData?.businessId || businessData?.business?.id;
      
      if (!businessId) {
        throw new Error('Business ID not found');
      }

      // Get customers based on appointment history for this business
      const response = await this.apiService.makeRequest(`/appointments/business/${businessId}/customers`);
      return response || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Search customers
  async searchCustomers(query) {
    try {
      if (!query || query.trim().length === 0) {
        return await this.getAllCustomers();
      }
      const response = await this.apiService.searchClients(query);
      return response;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Create new customer (disabled - customers created through appointments only)
  async createCustomer(customerData) {
    throw new Error('Direct customer creation is disabled. Customers are created automatically when appointments are booked.');
  }

  // Update customer (disabled - only business-specific notes can be updated)
  async updateCustomer(customerId, customerData) {
    throw new Error('Customer profile updates are disabled. You can only update business-specific notes and tags.');
  }

  // Update business-specific customer notes
  async updateCustomerNotes(customerId, notes) {
    try {
      const businessData = await this.apiService.getBusinessData();
      const businessId = businessData?.businessId || businessData?.business?.id;
      
      if (!businessId) {
        throw new Error('Business ID not found');
      }

      const response = await this.apiService.updateClientNotes(businessId, customerId, notes);
      return response;
    } catch (error) {
      console.error('Error updating customer notes:', error);
      throw error;
    }
  }

  // Add tag to customer
  async addCustomerTag(customerId, tag) {
    try {
      const businessData = await this.apiService.getBusinessData();
      const businessId = businessData?.businessId || businessData?.business?.id;
      
      if (!businessId) {
        throw new Error('Business ID not found');
      }

      const response = await this.apiService.addClientTag(businessId, customerId, tag);
      return response;
    } catch (error) {
      console.error('Error adding customer tag:', error);
      throw error;
    }
  }

  // Remove tag from customer
  async removeCustomerTag(customerId, tag) {
    try {
      const businessData = await this.apiService.getBusinessData();
      const businessId = businessData?.businessId || businessData?.business?.id;
      
      if (!businessId) {
        throw new Error('Business ID not found');
      }

      const response = await this.apiService.removeClientTag(businessId, customerId, tag);
      return response;
    } catch (error) {
      console.error('Error removing customer tag:', error);
      throw error;
    }
  }

  // Update customer status
  async updateCustomerStatus(customerId, status) {
    try {
      const businessData = await this.apiService.getBusinessData();
      const businessId = businessData?.businessId || businessData?.business?.id;
      
      if (!businessId) {
        throw new Error('Business ID not found');
      }

      const response = await this.apiService.updateClientStatus(businessId, customerId, status);
      return response;
    } catch (error) {
      console.error('Error updating customer status:', error);
      throw error;
    }
  }

  // Delete customer (disabled - customers managed through appointments)
  async deleteCustomer(customerId) {
    throw new Error('Customer deletion is disabled. Customers are managed through their appointment history. Cancel or delete appointments instead.');
  }

  // Get customer by ID
  async getCustomerById(customerId) {
    try {
      const response = await this.apiService.makeRequest(`/clients/${customerId}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
      throw error;
    }
  }

  // Get customer appointment history
  async getCustomerAppointments(customerId) {
    try {
      // First try to get from the customer data we already have
      const customers = await this.getAllCustomers();
      const customer = customers.find(c => c._id === customerId);
      
      if (customer && customer.appointments) {
        return customer.appointments;
      }
      
      // Fallback to direct API call if needed
      const response = await this.apiService.makeRequest(`/appointments/client/${customerId}`);
      
      // The API returns appointments grouped by status, flatten them
      if (response && typeof response === 'object') {
        const allAppointments = [
          ...(response.booked || []),
          ...(response.canceled || []),
          ...(response.cancelled || []), // Handle both spellings
          ...(response.completed || [])
        ];
        return allAppointments;
      }
      
      return response || [];
    } catch (error) {
      console.error('Error fetching customer appointments:', error);
      throw error;
    }
  }

  // Recent customers cache management
  async getRecentCustomers() {
    try {
      const recentCustomersJson = await AsyncStorage.getItem(RECENT_CUSTOMERS_KEY);
      return recentCustomersJson ? JSON.parse(recentCustomersJson) : [];
    } catch (error) {
      console.error('Error getting recent customers:', error);
      return [];
    }
  }

  async addToRecentCustomers(customer) {
    try {
      const recentCustomers = await this.getRecentCustomers();
      
      // Remove if already exists (to avoid duplicates)
      const filteredCustomers = recentCustomers.filter(c => c._id !== customer._id);
      
      // Add to beginning of array
      const updatedCustomers = [customer, ...filteredCustomers].slice(0, 10); // Keep only 10 recent
      
      await AsyncStorage.setItem(RECENT_CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
    } catch (error) {
      console.error('Error adding to recent customers:', error);
    }
  }

  async removeFromRecentCustomers(customerId) {
    try {
      const recentCustomers = await this.getRecentCustomers();
      const filteredCustomers = recentCustomers.filter(c => c._id !== customerId);
      await AsyncStorage.setItem(RECENT_CUSTOMERS_KEY, JSON.stringify(filteredCustomers));
    } catch (error) {
      console.error('Error removing from recent customers:', error);
    }
  }

  async clearRecentCustomers() {
    try {
      await AsyncStorage.removeItem(RECENT_CUSTOMERS_KEY);
    } catch (error) {
      console.error('Error clearing recent customers:', error);
    }
  }

  // Helper methods
  validateCustomerData(customerData) {
    const errors = {};
    
    if (!customerData.name || customerData.name.trim().length === 0) {
      errors.name = 'Name is required';
    }
    
    if (!customerData.phone || customerData.phone.trim().length === 0) {
      errors.phone = 'Phone number is required';
    } else if (customerData.phone.length < 10) {
      errors.phone = 'Phone number must be at least 10 digits';
    }
    
    if (customerData.email && customerData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email)) {
        errors.email = 'Invalid email format';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if US number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }
}

export default new CustomerService();
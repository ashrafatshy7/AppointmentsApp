// src/Auth/Utils/validators.js

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validates a phone number (basic validation)
   * @param {string} phoneNumber - The phone number to validate
   * @returns {boolean} True if phone number is valid, false otherwise
   */
  export const isValidPhoneNumber = (phoneNumber) => {
    // Remove any non-digit characters for validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    // Basic check: at least 10 digits
    return digitsOnly.length >= 10;
  };
  
  /**
   * Validates a password
   * @param {string} password - The password to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with isValid and message properties
   */
  export const validatePassword = (password, options = {}) => {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = false,
    } = options;
    
    const result = {
      isValid: true,
      message: '',
    };
    
    // Check minimum length
    if (password.length < minLength) {
      result.isValid = false;
      result.message = `Password must be at least ${minLength} characters`;
      return result;
    }
    
    // Check for uppercase letters
    if (requireUppercase && !/[A-Z]/.test(password)) {
      result.isValid = false;
      result.message = 'Password must include at least one uppercase letter';
      return result;
    }
    
    // Check for lowercase letters
    if (requireLowercase && !/[a-z]/.test(password)) {
      result.isValid = false;
      result.message = 'Password must include at least one lowercase letter';
      return result;
    }
    
    // Check for numbers
    if (requireNumbers && !/[0-9]/.test(password)) {
      result.isValid = false;
      result.message = 'Password must include at least one number';
      return result;
    }
    
    // Check for special characters
    if (requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
      result.isValid = false;
      result.message = 'Password must include at least one special character';
      return result;
    }
    
    return result;
  };
  
  /**
   * Validates name fields
   * @param {string} name - The name to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with isValid and message properties
   */
  export const validateName = (name, options = {}) => {
    const {
      required = true,
      minLength = 2,
      allowNumbers = false,
    } = options;
    
    const result = {
      isValid: true,
      message: '',
    };
    
    // Check if required
    if (required && !name.trim()) {
      result.isValid = false;
      result.message = 'Name is required';
      return result;
    }
    
    // Check minimum length
    if (name.trim().length < minLength) {
      result.isValid = false;
      result.message = `Name must be at least ${minLength} characters`;
      return result;
    }
    
    // Check for numbers if not allowed
    if (!allowNumbers && /[0-9]/.test(name)) {
      result.isValid = false;
      result.message = 'Name should not contain numbers';
      return result;
    }
    
    return result;
  };
  
  /**
   * Validates required fields
   * @param {Object} fields - An object containing field names and values
   * @returns {Object} An object with field names and error messages for invalid fields
   */
  export const validateRequiredFields = (fields) => {
    const errors = {};
    
    Object.entries(fields).forEach(([fieldName, value]) => {
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors[fieldName] = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
    });
    
    return errors;
  };
  
  /**
   * Formats a phone number for display
   * @param {string} phoneNumber - The phone number to format
   * @returns {string} Formatted phone number
   */
  export const formatPhoneNumber = (phoneNumber) => {
    // Remove any non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Format based on length (US format as example)
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    }
    
    // Return original if can't format
    return phoneNumber;
  };
  
  export default {
    isValidEmail,
    isValidPhoneNumber,
    validatePassword,
    validateName,
    validateRequiredFields,
    formatPhoneNumber,
  };

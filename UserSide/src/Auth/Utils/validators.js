// src/Auth/Utils/validators.js

/**
 * Validates a phone number
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result with isValid flag and error message
 */
export const validatePhone = (phone) => {
    // If empty
    if (!phone || phone.trim() === '') {
      return {
        isValid: false,
        error: 'Phone number is required'
      };
    }
    
    // Remove any non-numeric characters for validation
    const numericPhone = phone.replace(/\D/g, '');
    
    // Check if it's at least 9 digits (Israeli mobile numbers are typically 9 digits)
    if (numericPhone.length < 9) {
      return {
        isValid: false,
        error: 'Phone number must be at least 9 digits'
      };
    }
    
    return { isValid: true };
  };

  /**
   * Validates a phone number (BusinessSide compatible version)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid, false otherwise
   */
  export const isValidPhoneNumber = (phone) => {
    const result = validatePhone(phone);
    return result.isValid;
  };
  
  /**
   * Validates a name field
   * @param {string} name - Name to validate
   * @returns {Object} Validation result with isValid flag and error message
   */
  export const validateName = (name) => {
    // If empty
    if (!name || name.trim() === '') {
      return {
        isValid: false,
        error: 'Name is required'
      };
    }
    
    // Check for minimum length
    if (name.trim().length < 2) {
      return {
        isValid: false,
        error: 'Name must be at least 2 characters'
      };
    }
    
    // Check for maximum length
    if (name.trim().length > 50) {
      return {
        isValid: false,
        error: 'Name must be less than 50 characters'
      };
    }
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    if (!/^[A-Za-z\s\-']+$/.test(name)) {
      return {
        isValid: false,
        error: 'Name contains invalid characters'
      };
    }
    
    return { isValid: true };
  };
  
  /**
   * Validates an email address
   * @param {string} email - Email to validate
   * @returns {Object} Validation result with isValid flag and error message
   */
  export const validateEmail = (email) => {
    // If empty
    if (!email || email.trim() === '') {
      return {
        isValid: false,
        error: 'Email is required'
      };
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'Please enter a valid email address'
      };
    }
    
    return { isValid: true };
  };
  
  /**
   * Validates a password
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with isValid flag and error message
   */
  export const validatePassword = (password) => {
    // If empty
    if (!password) {
      return {
        isValid: false,
        error: 'Password is required'
      };
    }
    
    // Check for minimum length
    if (password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters'
      };
    }
    
    // Check for complexity (optional)
    // Require at least one uppercase letter, one lowercase letter, and one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!(hasUppercase && hasLowercase && hasNumber)) {
      return {
        isValid: false,
        error: 'Password must include at least one uppercase letter, one lowercase letter, and one number'
      };
    }
    
    return { isValid: true };
  };
  
  /**
   * Validates that passwords match
   * @param {string} password - Password
   * @param {string} confirmPassword - Confirmation password
   * @returns {Object} Validation result with isValid flag and error message
   */
  export const validatePasswordMatch = (password, confirmPassword) => {
    if (password !== confirmPassword) {
      return {
        isValid: false,
        error: 'Passwords do not match'
      };
    }
    
    return { isValid: true };
  };
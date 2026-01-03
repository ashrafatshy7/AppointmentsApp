// src/Auth/Services/ApiService.js
const API_BASE_URL = "http://10.0.0.6:3000/api";

export const checkUserExists = async (phone) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-user-exists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to check user existence");
    }

    return data;
  } catch (error) {
    console.error("Check user exists error:", error);
    throw error;
  }
};

export const sendOTP = async (phone) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp-business`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send OTP");
    }

    return data;
  } catch (error) {
    console.error("Send OTP error:", error);
    throw error;
  }
};

export const verifyOTP = async (phone, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp-business`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to verify OTP");
    }

    return data;
  } catch (error) {
    console.error("Verify OTP error:", error);
    throw error;
  }
};

export const getUserProfile = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get user profile");
    }

    return data;
  } catch (error) {
    console.error("Get profile error:", error);
    throw error;
  }
};

export const createBusiness = async (businessData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/create-business`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(businessData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create business");
    }

    return data;
  } catch (error) {
    console.error("Create business error:", error);
    throw error;
  }
};

// get cities
export const getCities = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/cities`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch cities");
    }

    return data;
  } catch (error) {
    console.error("Get cities error:", error);
    throw error;
  }
};

export default {
  checkUserExists,
  sendOTP,
  verifyOTP,
  getUserProfile,
  createBusiness,
  getCities,
};


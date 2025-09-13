import { API_BASE_URL } from '../Constants/Config';

class UserService {
  // User authentication
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  // User registration
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(token, profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(token, passwordData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      return await response.json();
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Get user appointments
  async getUserAppointments(token, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/users/appointments?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user appointments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      throw error;
    }
  }

  // Cancel appointment
  async cancelAppointment(token, appointmentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(token, appointmentId, newDateTime) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newDateTime),
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule appointment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  // Get user favorites
  async getUserFavorites(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user favorites');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      throw error;
    }
  }

  // Add to favorites
  async addToFavorites(token, businessId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to favorites');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Remove from favorites
  async removeFromFavorites(token, businessId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove from favorites');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Logout
  async logout(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
}

export default new UserService();

// Upload user avatar (multipart)
export const uploadUserAvatar = async (userId, imageUri) => {
  const form = new FormData();
  form.append('avatar', { uri: imageUri, type: 'image/jpeg', name: `avatar-${userId}.jpg` });
  form.append('userId', String(userId));
  const res = await fetch(`${API_BASE_URL}/image-upload/user-profile`, { method: 'POST', headers: {}, body: form });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');
  return data;
};

// src/Dashboard/Service/ApiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.0.109:3000/api'; // Update with your server URL
const SERVER_URL = 'http://10.0.0.109:3000'; // Server base URL for images

class ApiService {
  constructor() {
    this.baseURL = BASE_URL;
    this.serverURL = SERVER_URL;
  }

  // Helper function to convert relative image paths to full URLs
  getFullImageUrl(relativePath) {
    if (!relativePath) return null;
    
    // If it's already a full URL, return as is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    
    // If it's a relative path starting with /, construct full URL
    if (relativePath.startsWith('/')) {
      return `${this.serverURL}${relativePath}`;
    }
    
    // If it's just a filename or path without /, assume it's in businesses folder
    return `${this.serverURL}/businesses/${relativePath}`;
  }

  // Helper function to get business profile image URL
  getBusinessProfileImageUrl(businessId, filename = 'profile.jpg') {
    return `${this.serverURL}/businesses/${businessId}/${filename}`;
  }

  // Helper function to get service image URL
  getServiceImageUrl(businessId, serviceId, filename) {
    if (filename) {
      return `${this.serverURL}/businesses/${businessId}/services/${filename}`;
    }
    return `${this.serverURL}/businesses/${businessId}/services/service-${serviceId}.jpg`;
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('businessUserToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getBusinessData() {
    try {
      const userData = await AsyncStorage.getItem('businessUserData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting business data:', error);
      return null;
    }
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;
      
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const responseText = await response.text();
      
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || responseText;
        } catch (parseError) {
          errorMessage = responseText;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
      
      try {
        return JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Client API calls
  async getAllClients() {
    return this.makeRequest('/clients');
  }

  async searchClients(query) {
    return this.makeRequest(`/clients/search?q=${encodeURIComponent(query)}`);
  }

  async createClient(clientData) {
    return this.makeRequest('/clients/signup', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  // Service API calls
  async getBusinessServices(businessId) {
    return this.makeRequest(`/services/business/${businessId}`);
  }

  async createService(serviceData) {
    return this.makeRequest('/services/create', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(serviceId, serviceData) {
    return this.makeRequest(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(serviceId) {
    return this.makeRequest(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // Appointment API calls
  async createAppointment(appointmentData) {
    return this.makeRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async getAllAppointments(businessId) {
    return this.makeRequest(`/appointments/business/${businessId}`);
  }

  async getAppointmentById(appointmentId) {
    return this.makeRequest(`/appointments/${appointmentId}`);
  }

  async updateAppointment(appointmentId, appointmentData) {
    return this.makeRequest(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async deleteAppointment(appointmentId) {
    return this.makeRequest(`/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
  }

  async updateAppointmentStatus(appointmentId, status) {

    const result = await this.makeRequest(`/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    return result;
  }

  async rescheduleAppointment(appointmentId, dateTime) {
    return this.makeRequest(`/appointments/${appointmentId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        dateTime,
        date: new Date(dateTime).toISOString().split('T')[0],
        time: new Date(dateTime).toTimeString().slice(0, 5)
      }),
    });
  }

  async getTodayAppointments(businessId) {
    const today = new Date().toISOString().split('T')[0];
    return this.makeRequest(`/appointments/business/${businessId}?date=${today}`);
  }

  async getDashboardData(businessId) {
    return this.makeRequest(`/dashboard/${businessId}`);
  }

  // Available slots API call
  async getAvailableSlots(businessId, date, serviceId = null) {
    const endpoint = `/appointments/available-slots/${businessId}?date=${date}${serviceId ? `&serviceId=${serviceId}` : ''}`;
    return this.makeRequest(endpoint);
  }


// Working Hours Management API calls  
async getBusinessSchedule(businessId) {
  return this.makeRequest(`/working-hours/businesses/${businessId}/schedule`);
}
async updateWorkingHours(businessId, workingHours) {
  return this.makeRequest(`/working-hours/businesses/${businessId}/working-hours`, {
    method: 'PUT',
    body: JSON.stringify({ workingHours }),
  });
}

async addTemporaryClosure(businessId, closureData) {
  return this.makeRequest(`/working-hours/businesses/${businessId}/temporary-closure`, {
    method: 'POST',
    body: JSON.stringify(closureData),
  });
}

async confirmTemporaryClosure(businessId, closureId) {
  return this.makeRequest(`/working-hours/businesses/${businessId}/confirm-closure/${closureId}`, {
    method: 'POST',
  });
}

async addTemporaryBreak(businessId, breakData) {
  return this.makeRequest(`/working-hours/businesses/${businessId}/temporary-break`, {
    method: 'POST',
    body: JSON.stringify(breakData),
  });
}

async confirmTemporaryBreak(businessId, breakId) {
  return this.makeRequest(`/working-hours/businesses/${businessId}/confirm-break/${breakId}`, {
    method: 'POST',
  });
}

async getAffectedAppointments(businessId, params) {
  const queryString = new URLSearchParams(params).toString();
  return this.makeRequest(`/working-hours/businesses/${businessId}/affected-appointments?${queryString}`);
}

async deleteTemporaryClosure(businessId, closureId) {
  return this.makeRequest(`/working-hours/businesses/${businessId}/temporary-closure/${closureId}`, {
    method: 'DELETE',
  });
}

async deleteTemporaryBreak(businessId, breakId) {
  return this.makeRequest(`/working-hours/businesses/${businessId}/temporary-break/${breakId}`, {
    method: 'DELETE',
  });
}

// Business-Client API calls for notes management
async getBusinessClientData(businessId, clientId) {
  return this.makeRequest(`/business-clients/${businessId}/${clientId}`);
}

async updateClientNotes(businessId, clientId, notes) {
  return this.makeRequest(`/business-clients/${businessId}/${clientId}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
}

async addClientTag(businessId, clientId, tag) {
  return this.makeRequest(`/business-clients/${businessId}/${clientId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tag }),
  });
}

async removeClientTag(businessId, clientId, tag) {
  return this.makeRequest(`/business-clients/${businessId}/${clientId}/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE',
  });
}

async updateClientStatus(businessId, clientId, status) {
  return this.makeRequest(`/business-clients/${businessId}/${clientId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// Business Profile API calls
async uploadBusinessLogo(businessId, imageUri) {
  try {
    
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Add the image file
    formData.append('logo', {
      uri: imageUri,
      type: 'image/jpeg', // You might want to detect this based on the file extension
      name: `business-logo-${businessId}-${Date.now()}.jpg`,
    });
    
    // Add business ID
    formData.append('businessId', businessId);
    
    // Make request without JSON headers for multipart data
    const token = await this.getAuthToken();
    const url = `${this.baseURL}/image-upload/business-logo`;
    
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
    });
    
    const responseText = await response.text();
   
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || responseText;
      } catch (parseError) {
        errorMessage = responseText;
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }
    
    const result = JSON.parse(responseText);
   
    return result;
    
  } catch (error) {
    console.error('ApiService: Error uploading business logo:', error);
    throw error;
  }
  }

  // Upload business cover photo
  async uploadBusinessCoverPhoto(businessId, imageUri) {
    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Add the image file
      formData.append('cover', {
        uri: imageUri,
        type: 'image/jpeg', // You might want to detect this based on the file extension
        name: `business-cover-${businessId}-${Date.now()}.jpg`,
      });
      
      // Add business ID
      formData.append('businessId', businessId);
      
      // Make request without JSON headers for multipart data
      const token = await this.getAuthToken();
      const url = `${this.baseURL}/image-upload/business-cover`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          // Don't set Content-Type for FormData, let the browser set it with boundary
        },
        body: formData,
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || responseText;
        } catch (parseError) {
          errorMessage = responseText;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
      
      const result = JSON.parse(responseText);
      
      return result;
      
    } catch (error) {
      console.error('ApiService: Error uploading business cover photo:', error);
      throw error;
    }
  }

async updateBusinessProfile(businessId, profileData) {
  console.log('ApiService: Updating business profile', { businessId, profileData });
  const result = await this.makeRequest(`/businesses/${businessId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
  console.log('ApiService: Business profile update result', result);
  return result;
}

async getBusinessProfile(businessId) {
  const result = await this.makeRequest(`/businesses/${businessId}`);
  return result;
}

async uploadGalleryImage(businessId, imageUri) {
  try {
    console.log('ApiService: Uploading gallery image', { businessId, imageUri });
    
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Add the image file
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg', // You might want to detect this based on the file extension
      name: `gallery-${Date.now()}.jpg`,
    });
    
    // Add business ID
    formData.append('businessId', businessId);
    
    // Make request without JSON headers for multipart data
    const token = await this.getAuthToken();
    const url = `${this.baseURL}/image-upload/gallery-image`;
        
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
    });
    
    const responseText = await response.text();
    console.log('ApiService: Gallery image upload response text:', responseText);
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || responseText;
      } catch (parseError) {
        errorMessage = responseText;
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }
    
    const result = JSON.parse(responseText);
    console.log('ApiService: Gallery image upload result', result);
    return result;
    
  } catch (error) {
    console.error('ApiService: Error uploading gallery image:', error);
    throw error;
  }
}

async deleteGalleryImage(businessId, imageUrl) {
  try {
    console.log('ApiService: Deleting gallery image', { businessId, imageUrl });
    
    const result = await this.makeRequest('/image-upload/gallery-image', {
      method: 'DELETE',
      body: JSON.stringify({ businessId, imageUrl }),
    });
    
    console.log('ApiService: Gallery image deletion result', result);
    return result;
    
  } catch (error) {
    console.error('ApiService: Error deleting gallery image:', error);
    throw error;
  }
}

async reorderGalleryImages(businessId, gallery) {
  try {
    console.log('ApiService: Reordering gallery images', { businessId, gallery });
    
    const result = await this.makeRequest('/image-upload/gallery-reorder', {
      method: 'PUT',
      body: JSON.stringify({ businessId, gallery }),
    });
    
    console.log('ApiService: Gallery reorder result', result);
    return result;
    
  } catch (error) {
    console.error('ApiService: Error reordering gallery images:', error);
    throw error;
  }
}

}



export default new ApiService();
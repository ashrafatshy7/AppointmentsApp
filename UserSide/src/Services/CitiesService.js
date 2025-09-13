// src/Services/CitiesService.js
import { API_BASE_URL } from '../Constants/Config';

class CitiesService {
  // Fetch all available cities from the server
  static async getCities() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/cities`);
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      
      const data = await response.json();
      
      if (data.success && data.cities) {
        return { success: true, cities: data.cities };
      } else {
        throw new Error('Invalid cities data format');
      }
    } catch (error) {
      // Don't log network errors to console - they're expected when offline
      if (error.message !== 'Network request failed') {
        console.error('Error fetching cities:', error);
      }
      return { success: false, error: 'Failed to fetch cities' };
    }
  }

  // Get cities from API only - no fallback cities
  static async getCitiesWithFallback() {
    return await this.getCities();
  }
}

export default CitiesService;

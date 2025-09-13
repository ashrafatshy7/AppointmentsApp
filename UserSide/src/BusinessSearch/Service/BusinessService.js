import { API_BASE_URL } from '../../Constants/Config';

class BusinessService {
  // Search businesses
  async searchBusinesses(searchParams = {}) {
    try {
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await fetch(`${API_BASE_URL}/businesses/search?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to search businesses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching businesses:', error);
      throw error;
    }
  }

  // Get business details
  async getBusinessDetails(businessId) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business details:', error);
      throw error;
    }
  }

  // Get business services
  async getBusinessServices(businessId) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/services`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business services');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business services:', error);
      throw error;
    }
  }

  // Get business working hours
  async getBusinessWorkingHours(businessId) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/working-hours`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business working hours');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business working hours:', error);
      throw error;
    }
  }

  // Get business reviews
  async getBusinessReviews(businessId, page = 1, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/reviews?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business reviews');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business reviews:', error);
      throw error;
    }
  }

  // Get business categories - Now using businessApi.getCategories()
  // async getBusinessCategories() {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/businesses/categories`);
  //     
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch business categories');
  //     }

  //     return await response.json();
  //   } catch (error) {
  //     console.error('Error fetching business categories:', error);
  //     throw error;
  //   }
  // }

  // Get businesses by category
  async getBusinessesByCategory(categoryId, page = 1, limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/category/${categoryId}?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch businesses by category');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching businesses by category:', error);
      throw error;
    }
  }

  // Get nearby businesses
  async getNearbyBusinesses(latitude, longitude, radius = 10, category = null) {
    try {
      const params = { lat: latitude, lng: longitude, radius };
      if (category) params.category = category;
      
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/businesses/nearby?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch nearby businesses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby businesses:', error);
      throw error;
    }
  }

  // Get popular businesses
  async getPopularBusinesses(limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/popular?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch popular businesses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching popular businesses:', error);
      throw error;
    }
  }

  // Get recently viewed businesses
  async getRecentlyViewedBusinesses(token, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/recently-viewed?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recently viewed businesses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recently viewed businesses:', error);
      throw error;
    }
  }

  // Add business to recently viewed
  async addToRecentlyViewed(token, businessId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/recently-viewed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to recently viewed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
      throw error;
    }
  }

  // Get business availability for a specific date
  async getBusinessAvailability(businessId, date) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch business availability');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business availability:', error);
      throw error;
    }
  }

  // Get business images
  async getBusinessImages(businessId) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/images`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business images');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business images:', error);
      throw error;
    }
  }

  // Get business statistics
  async getBusinessStats(businessId) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching business statistics:', error);
      throw error;
    }
  }
}

export default new BusinessService();

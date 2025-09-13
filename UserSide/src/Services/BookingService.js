import { API_BASE_URL } from '../Constants/Config';

class BookingService {
  // Get available time slots for a business
  async getAvailableTimeSlots(businessId, date, serviceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/available-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          serviceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available time slots');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw error;
    }
  }

  // Book an appointment
  async bookAppointment(bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bookingData.token}`,
        },
        body: JSON.stringify({
          business: bookingData.businessId,
          service: bookingData.serviceId,
          user: bookingData.userId || bookingData.user || bookingData.phone,
          date: bookingData.date,
          time: bookingData.time,
          durationMinutes: bookingData.durationMinutes,
          notes: bookingData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to book appointment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error booking appointment:', error);
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

  // Search businesses
  async searchBusinesses(searchParams) {
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
}

export default new BookingService();

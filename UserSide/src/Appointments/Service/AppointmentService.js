// src/AppointmentsPage/AppointmentService.js
import { API_BASE_URL } from '../../Constants/Config';

class AppointmentService {
  // Get all appointments for a user
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
        throw new Error('Failed to fetch appointments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  // Get appointment details
  async getAppointmentDetails(token, appointmentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointment details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      throw error;
    }
  }

  // Book a new appointment
  async bookAppointment(token, bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business: bookingData.businessId || bookingData.business,
          service: bookingData.serviceId || bookingData.service,
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

  // Cancel an appointment
  async cancelAppointment(token, appointmentId, reason = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
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

  // Reschedule an appointment
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

  // Get appointment history
  async getAppointmentHistory(token, filters = {}) {
    try {
      const queryString = new URLSearchParams({ ...filters, status: 'completed' }).toString();
      const response = await fetch(`${API_BASE_URL}/users/appointments?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointment history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      throw error;
    }
  }

  // Get appointments by type (upcoming, completed, canceled)
  async getAppointments(type, phone = null, filters = {}) {
    try {
      if (!phone) {
        throw new Error('Phone number is required to fetch appointments');
      }

      // Map the type to the correct status
      let statusFilter = '';
      switch (type) {
        case 'upcoming':
          statusFilter = 'booked';
          break;
        case 'completed':
          statusFilter = 'completed';
          break;
        case 'canceled':
          statusFilter = 'canceled';
          break;
        default:
          statusFilter = 'booked';
      }

      // Use the new endpoint that works with phone numbers
      const response = await fetch(`${API_BASE_URL}/appointments/user/${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} appointments`);
      }

      const data = await response.json();
      
      // Return the appointments for the specific status
      return data[statusFilter] || [];
    } catch (error) {
      console.error(`Error fetching ${type} appointments:`, error);
      throw error;
    }
  }

  // Get upcoming appointments
  async getUpcomingAppointments(token, filters = {}) {
    try {
      const queryString = new URLSearchParams({ ...filters, status: 'confirmed' }).toString();
      const response = await fetch(`${API_BASE_URL}/users/appointments?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch upcoming appointments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  // Add notes to appointment
  async addAppointmentNotes(token, appointmentId, notes) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to add notes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding notes:', error);
      throw error;
    }
  }

  // Rate appointment
  async rateAppointment(token, appointmentId, rating, review = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, review }),
      });

      if (!response.ok) {
        throw new Error('Failed to rate appointment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error rating appointment:', error);
      throw error;
    }
  }

  // Get appointment statistics
  async getAppointmentStats(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/appointments/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointment statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointment statistics:', error);
      throw error;
    }
  }
}

export default new AppointmentService();
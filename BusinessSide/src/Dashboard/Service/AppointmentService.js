// src/Dashboard/Service/AppointmentService.js
import ApiService from './ApiService';

// Cache for appointments
let appointmentsCache = null;

/**
 * Clear appointments cache - useful for debugging or when data is manually changed
 */
export const clearAppointmentsCache = () => {
  appointmentsCache = null;
};

/**
 * Get all appointments from API
 */
export const getAllAppointments = async (businessId, forceRefresh = false) => {
  try {
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      appointmentsCache = null;
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    const appointments = await ApiService.getAllAppointments(businessId);
    
    appointmentsCache = appointments;
    return appointments;
  } catch (error) {
    console.error('Error getting all appointments:', error);
    
    // Only return cached data if it exists and this is not a force refresh
    if (!forceRefresh && appointmentsCache) {
      return appointmentsCache;
    }
    
    // Return empty array if force refresh or no cache
    return [];
  }
};

/**
 * Get dashboard data from API
 */
export const getDashboardData = async (businessId) => {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    return await ApiService.getDashboardData(businessId);
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    // Return fallback counts
    return {
      todayCount: 0,
      upcomingCount: 0,
      revenue: 0,
      otherStat: 0
    };
  }
};

/**
 * Get appointments for today
 */
export const getTodayAppointments = async (businessId) => {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    return await ApiService.getTodayAppointments(businessId);
  } catch (error) {
    console.error('Error getting today appointments:', error);
    return [];
  }
};

/**
 * Get appointments for tomorrow
 */
export const getTomorrowAppointments = async (businessId) => {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const allAppointments = await getAllAppointments(businessId);
    return allAppointments.filter(appointment => appointment.date === tomorrowStr);
  } catch (error) {
    console.error('Error getting tomorrow appointments:', error);
    return [];
  }
};

/**
 * Get appointment by ID - Now uses API endpoint instead of filtering locally
 */
export const getAppointmentById = async (id) => {
  try {
    return await ApiService.getAppointmentById(id);
  } catch (error) {
    console.error('Error getting appointment by ID:', error);
    // Fallback to local filtering if API fails
    try {
      const allAppointments = await getAllAppointments();
      return allAppointments.find(appointment => appointment.id.toString() === id.toString()) || null;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      return null;
    }
  }
};

/**
 * Create a new appointment
 */
export const createAppointment = async (appointmentData) => {
  try {
    // Get business ID from appointment data or throw error if not provided
    const businessId = appointmentData.businessId || appointmentData.business;
    if (!businessId) {
      throw new Error('Business ID is required in appointment data');
    }

    // Handle different possible field names and structures
    let clientId = appointmentData.client || 
                   appointmentData.customerId || 
                   appointmentData.clientId ||
                   (appointmentData.customer && appointmentData.customer.id);
    
    let serviceId = appointmentData.service || 
                    appointmentData.serviceId ||
                    (appointmentData.selectedService && appointmentData.selectedService.id);
    

    if (!clientId) {
      throw new Error('Client ID is required but not found in appointment data');
    }
    
    if (!serviceId) {
      throw new Error('Service ID is required but not found in appointment data');
    }

    let appointmentPayload;
    
    if (appointmentData.dateTime) {
      // Handle dateTime format
      const appointmentDate = new Date(appointmentData.dateTime);
      appointmentPayload = {
        business: businessId,
        client: clientId,
        service: serviceId,
        date: appointmentDate.toISOString().split('T')[0], // YYYY-MM-DD format
        time: appointmentDate.toTimeString().slice(0, 5), // HH:mm format
        durationMinutes: appointmentData.durationMinutes || appointmentData.duration || 60
      };
    } else if (appointmentData.date && appointmentData.time) {
      // Handle separate date and time fields
      appointmentPayload = {
        business: businessId,
        client: clientId,
        service: serviceId,
        date: appointmentData.date,
        time: appointmentData.time,
        durationMinutes: appointmentData.durationMinutes || appointmentData.duration || 60
      };
    } else {
      throw new Error('Either dateTime or both date and time must be provided');
    }


    // Validate payload before sending
    const required = ['business', 'client', 'service', 'date', 'time', 'durationMinutes'];
    const missing = required.filter(field => !appointmentPayload[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields in payload: ${missing.join(', ')}`);
    }

    const newAppointment = await ApiService.createAppointment(appointmentPayload);
    
    // Invalidate cache
    appointmentsCache = null;
    
    return newAppointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

/**
 * Update an existing appointment - Now uses dedicated API endpoint
 */
export const updateAppointment = async (id, appointmentData) => {
  try {
    const updatedAppointment = await ApiService.updateAppointment(id, appointmentData);
    
    // Invalidate cache
    appointmentsCache = null;
    
    return updatedAppointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

/**
 * Delete an appointment - Now uses dedicated API endpoint
 */
export const deleteAppointment = async (id) => {
  try {
    await ApiService.deleteAppointment(id);
    
    // Invalidate cache
    appointmentsCache = null;
    
    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return false;
  }
};

/**
 * Get appointments by status
 */
export const getAppointmentsByStatus = async (status) => {
  try {
    const allAppointments = await getAllAppointments();
    return allAppointments.filter(appointment => appointment.status === status);
  } catch (error) {
    console.error('Error getting appointments by status:', error);
    return [];
  }
};

/**
 * Update appointment status - Now uses dedicated API endpoint
 */
export const updateAppointmentStatus = async (id, status) => {
  try {
    const updatedAppointment = await ApiService.updateAppointmentStatus(id, status);
    
    // Invalidate cache
    appointmentsCache = null;
    
    return updatedAppointment;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

/**
 * Reschedule an appointment - Now uses dedicated API endpoint
 */
export const rescheduleAppointment = async (id, dateTime) => {
  try {
    const updatedAppointment = await ApiService.rescheduleAppointment(id, dateTime);
    
    // Invalidate cache
    appointmentsCache = null;
    
    return updatedAppointment;
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    throw error;
  }
};

/**
 * Get appointments by date range
 */
export const getAppointmentsByDateRange = async (businessId, startDate, endDate) => {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    const allAppointments = await getAllAppointments(businessId);
    return allAppointments.filter(appointment => {
      const appointmentDate = appointment.date;
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  } catch (error) {
    console.error('Error getting appointments by date range:', error);
    return [];
  }
};

/**
 * Get all business appointments (alias for getAllAppointments)
 */
export const getBusinessAppointments = async () => {
  return await getAllAppointments();
};

// Keep the old initializeAppointments for backward compatibility
export const initializeAppointments = async () => {
  return await getAllAppointments();
};

export default {
  getAllAppointments,
  getBusinessAppointments,
  getDashboardData,
  getTodayAppointments,
  getTomorrowAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByStatus,
  getAppointmentsByDateRange,
  updateAppointmentStatus,
  rescheduleAppointment,
  initializeAppointments,
  clearAppointmentsCache
};
// src/Services/ServiceService.js
import ApiService from '../Dashboard/Service/ApiService';

class ServiceService {
  // Cache for services
  servicesCache = null;

  async getBusinessId() {
    try {
      const businessData = await ApiService.getBusinessData();
      return businessData?.businessId || businessData?.business?.id;
    } catch (error) {
      console.error('Error getting business ID:', error);
      return null;
    }
  }

  async getBusinessServices() {
    try {
      const businessId = await this.getBusinessId();
      if (!businessId) {
        // Return empty array instead of throwing error when not authenticated
        return [];
      }

      const services = await ApiService.getBusinessServices(businessId);
      
      // Transform services to match expected format
      this.servicesCache = services.map(service => ({
        id: service._id,
        name: service.name,
        price: service.price ? `$${service.price}` : 'N/A',
        duration: service.durationMinutes,
        durationMinutes: service.durationMinutes,
        description: service.description || ''
      }));
      
      return this.servicesCache;
    } catch (error) {
      console.error('Error getting business services:', error);
      // Return empty array instead of fallback service when not authenticated
      return [];
    }
  }

  async createService(serviceData) {
    try {
      const businessId = await this.getBusinessId();
      if (!businessId) {
        throw new Error('Business ID not found');
      }

      const servicePayload = {
        business: businessId,
        ...serviceData
      };

      const newService = await ApiService.createService(servicePayload);
      // Invalidate cache
      this.servicesCache = null;
      return newService;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(serviceId, serviceData) {
    try {
      const businessId = await this.getBusinessId();
      if (!businessId) {
        throw new Error('Business ID not found');
      }

      const servicePayload = {
        business: businessId,
        ...serviceData
      };

      const updatedService = await ApiService.updateService(serviceId, servicePayload);
      // Invalidate cache
      this.servicesCache = null;
      return updatedService;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(serviceId) {
    try {
      const result = await ApiService.deleteService(serviceId);
      // Invalidate cache
      this.servicesCache = null;
      return result;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }
}

export default new ServiceService();

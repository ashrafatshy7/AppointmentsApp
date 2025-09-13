const Appointment = require('../models/appointment');

/**
 * Comprehensive booking validation utility
 * Handles time conflicts, overlaps, and service duration validation
 */
class BookingValidator {
  
  /**
   * Convert time string to minutes since start of day
   * @param {string} timeStr - Time in "HH:mm" format
   * @returns {number} Minutes since 00:00
   */
  static timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since start of day to time string
   * @param {number} minutes - Minutes since 00:00
   * @returns {string} Time in "HH:mm" format
   */
  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate appointment end time
   * @param {string} startTime - Start time in "HH:mm" format
   * @param {number} durationMinutes - Duration in minutes
   * @returns {string} End time in "HH:mm" format
   */
  static calculateEndTime(startTime, durationMinutes) {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    return this.minutesToTime(endMinutes);
  }

  /**
   * Check if two time ranges overlap
   * @param {string} start1 - First range start time
   * @param {string} end1 - First range end time  
   * @param {string} start2 - Second range start time
   * @param {string} end2 - Second range end time
   * @param {number} bufferMinutes - Buffer time between appointments
   * @returns {boolean} True if ranges overlap (including buffer)
   */
  static timeRangesOverlap(start1, end1, start2, end2, bufferMinutes = 15) {
    const start1Min = this.timeToMinutes(start1);
    const end1Min = this.timeToMinutes(end1);
    const start2Min = this.timeToMinutes(start2);
    const end2Min = this.timeToMinutes(end2);

    // Add buffer time to both ranges
    const bufferedEnd1 = end1Min + bufferMinutes;
    const bufferedEnd2 = end2Min + bufferMinutes;
    const bufferedStart1 = Math.max(0, start1Min - bufferMinutes);
    const bufferedStart2 = Math.max(0, start2Min - bufferMinutes);

    // Check for overlap: ranges overlap if one starts before the other ends
    return bufferedStart1 < bufferedEnd2 && bufferedStart2 < bufferedEnd1;
  }

  /**
   * Comprehensive validation for new appointment booking
   * @param {Object} bookingData - Booking request data
   * @param {string} bookingData.business - Business ID
   * @param {string} bookingData.date - Date in YYYY-MM-DD format
   * @param {string} bookingData.time - Start time in HH:mm format
   * @param {number} bookingData.durationMinutes - Service duration
   * @param {number} bufferMinutes - Buffer time between appointments
   * @returns {Object} Validation result with conflicts if any
   */
  static async validateBooking(bookingData, bufferMinutes = 15) {
    const { business, date, time, durationMinutes } = bookingData;
    
    try {
      // Calculate the proposed appointment's time range
      const proposedStart = time;
      const proposedEnd = this.calculateEndTime(time, durationMinutes);
      const proposedStartMin = this.timeToMinutes(proposedStart);
      const proposedEndMin = this.timeToMinutes(proposedEnd);

      console.log(`🔍 Validating booking: ${date} ${proposedStart}-${proposedEnd} (${durationMinutes}min)`);

      // Get all existing appointments for this business on this date
      const existingAppointments = await Appointment.find({
        business,
        date,
        status: { $ne: 'canceled' } // Exclude canceled appointments
      }).populate('service', 'name durationMinutes');

      console.log(`📅 Found ${existingAppointments.length} existing appointments on ${date}`);

      if (existingAppointments.length === 0) {
        return { valid: true, conflicts: [] };
      }

      // Check each existing appointment for conflicts
      const conflicts = [];
      const conflictingSlots = new Set();

      for (const appointment of existingAppointments) {
        const existingStart = appointment.time;
        const existingEnd = this.calculateEndTime(appointment.time, appointment.durationMinutes);
        
        // Check for overlap including buffer time
        const hasOverlap = this.timeRangesOverlap(
          proposedStart, proposedEnd,
          existingStart, existingEnd,
          bufferMinutes
        );

        if (hasOverlap) {
          const conflict = {
            type: 'OVERLAP',
            conflictingAppointment: appointment._id,
            existingTime: `${existingStart}-${existingEnd}`,
            proposedTime: `${proposedStart}-${proposedEnd}`,
            serviceName: appointment.service?.name || 'Unknown Service',
            message: `Conflicts with existing ${appointment.service?.name || 'appointment'} from ${existingStart} to ${existingEnd}`
          };
          conflicts.push(conflict);

          // Mark all time slots in the conflicting range as unavailable
          const existingStartMin = this.timeToMinutes(existingStart);
          const existingEndMin = this.timeToMinutes(existingEnd);
          
          // Add buffer time around existing appointment
          const blockedStart = Math.max(0, existingStartMin - bufferMinutes);
          const blockedEnd = existingEndMin + bufferMinutes;
          
          // Generate 15-minute slots that are blocked
          for (let slotMin = blockedStart; slotMin < blockedEnd; slotMin += 15) {
            conflictingSlots.add(this.minutesToTime(slotMin));
          }
        }
      }

      // If we have conflicts, also suggest alternative times
      const alternativeSlots = [];
      if (conflicts.length > 0) {
        alternativeSlots.push(...this.generateAlternativeSlots(
          existingAppointments, 
          durationMinutes, 
          bufferMinutes,
          conflictingSlots
        ));
      }

      return {
        valid: conflicts.length === 0,
        conflicts,
        conflictingSlots: Array.from(conflictingSlots),
        alternativeSlots: alternativeSlots.slice(0, 5), // Limit to 5 suggestions
        details: {
          proposedTimeRange: `${proposedStart}-${proposedEnd}`,
          durationMinutes,
          bufferMinutes,
          existingAppointmentsCount: existingAppointments.length
        }
      };

    } catch (error) {
      console.error('❌ Booking validation error:', error);
      return {
        valid: false,
        conflicts: [{
          type: 'VALIDATION_ERROR',
          message: 'Unable to validate booking availability',
          error: error.message
        }],
        alternativeSlots: []
      };
    }
  }

  /**
   * Generate alternative time slots when requested slot is unavailable
   * @param {Array} existingAppointments - Array of existing appointments
   * @param {number} durationMinutes - Required service duration
   * @param {number} bufferMinutes - Buffer time between appointments
   * @param {Set} conflictingSlots - Set of conflicting time slots
   * @returns {Array} Array of alternative time slots
   */
  static generateAlternativeSlots(existingAppointments, durationMinutes, bufferMinutes, conflictingSlots) {
    const alternatives = [];
    const businessHoursStart = 9 * 60; // 9:00 AM in minutes
    const businessHoursEnd = 18 * 60;  // 6:00 PM in minutes
    const slotIncrement = 15; // 15-minute increments

    // Create a map of occupied time ranges
    const occupiedRanges = existingAppointments.map(appointment => ({
      start: this.timeToMinutes(appointment.time),
      end: this.timeToMinutes(appointment.time) + appointment.durationMinutes + bufferMinutes
    })).sort((a, b) => a.start - b.start);

    // Find available slots
    for (let slotStart = businessHoursStart; slotStart + durationMinutes <= businessHoursEnd; slotStart += slotIncrement) {
      const slotEnd = slotStart + durationMinutes;
      const slotTimeStr = this.minutesToTime(slotStart);

      // Skip if this slot is in the conflicting slots set
      if (conflictingSlots.has(slotTimeStr)) {
        continue;
      }

      // Check if this slot conflicts with any existing appointment
      const hasConflict = occupiedRanges.some(range => 
        slotStart < range.end && slotEnd > range.start
      );

      if (!hasConflict) {
        alternatives.push({
          time: slotTimeStr,
          endTime: this.minutesToTime(slotEnd),
          available: true
        });
      }

      // Limit alternatives to prevent excessive computation
      if (alternatives.length >= 10) break;
    }

    return alternatives;
  }

  /**
   * Validate appointment reschedule
   * @param {string} appointmentId - ID of appointment being rescheduled
   * @param {Object} newBookingData - New booking data
   * @returns {Object} Validation result
   */
  static async validateReschedule(appointmentId, newBookingData) {
    try {
      // Get the current appointment
      const currentAppointment = await Appointment.findById(appointmentId);
      if (!currentAppointment) {
        return {
          valid: false,
          conflicts: [{
            type: 'NOT_FOUND',
            message: 'Appointment not found'
          }]
        };
      }

      // Validate the new time slot, excluding the current appointment
      const existingAppointments = await Appointment.find({
        business: newBookingData.business,
        date: newBookingData.date,
        status: { $ne: 'canceled' },
        _id: { $ne: appointmentId } // Exclude current appointment
      }).populate('service', 'name durationMinutes');

      // Use the same validation logic but with filtered appointments
      const mockBooking = {
        ...newBookingData,
        existingAppointments
      };

      return await this.validateBooking(mockBooking);
    } catch (error) {
      console.error('❌ Reschedule validation error:', error);
      return {
        valid: false,
        conflicts: [{
          type: 'VALIDATION_ERROR',
          message: 'Unable to validate reschedule request',
          error: error.message
        }]
      };
    }
  }

  /**
   * Get all blocked time slots for a specific business and date
   * @param {string} businessId - Business ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {number} serviceDuration - Service duration in minutes
   * @returns {Array} Array of blocked time slots
   */
  static async getBlockedTimeSlots(businessId, date, serviceDuration = 60) {
    try {
      const appointments = await Appointment.find({
        business: businessId,
        date,
        status: { $ne: 'canceled' }
      });

      const blockedSlots = new Set();
      const bufferMinutes = 15;

      appointments.forEach(appointment => {
        const startMin = this.timeToMinutes(appointment.time);
        const endMin = startMin + appointment.durationMinutes;
        
        // Block the appointment time and buffer around it
        const blockedStart = Math.max(0, startMin - bufferMinutes);
        const blockedEnd = endMin + bufferMinutes;
        
        // Generate 15-minute slots that are blocked
        for (let slotMin = blockedStart; slotMin < blockedEnd; slotMin += 15) {
          blockedSlots.add(this.minutesToTime(slotMin));
        }
      });

      return Array.from(blockedSlots).sort();
    } catch (error) {
      console.error('❌ Error getting blocked time slots:', error);
      return [];
    }
  }
}

module.exports = BookingValidator;
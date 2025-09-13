const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const BookingValidator = require('./bookingValidator');

/**
 * Booking handler for atomic database operations
 * Ensures data consistency and prevents race conditions using MongoDB unique indexes
 */
class TransactionHandler {
  
  /**
   * Execute atomic booking operation with race condition protection using unique indexes
   * @param {Object} bookingData - Complete booking data
   * @returns {Object} Result with success status and data
   */
  static async atomicBooking(bookingData) {
    try {
      console.log('🔄 Starting atomic booking operation...');
      
      // No session/transaction - rely on MongoDB unique indexes for race condition protection
      return await this.performBookingWithValidation(bookingData);
    } catch (error) {
      console.error('💥 Booking error:', error.message);
      
      if (error instanceof BookingError) {
        return {
          success: false,
          error: error.type,
          validationResult: error.validationResult,
          message: error.message
        };
      }

      // Handle MongoDB duplicate key error (E11000)
      if (error.code === 11000) {
        console.log('🔒 MongoDB unique constraint violation - race condition prevented');
        return {
          success: false,
          error: 'DUPLICATE_BOOKING',
          message: 'This time slot has already been booked by another user',
          suggestion: 'Please select a different time slot'
        };
      }

      // Handle other errors
      return {
        success: false,
        error: 'BOOKING_ERROR',
        message: 'Failed to process booking request',
        details: error.message
      };
    }
  }

  /**
   * Perform booking with validation but without transactions
   * @param {Object} bookingData - Complete booking data
   * @returns {Object} Result with success status and data
   */
  static async performBookingWithValidation(bookingData) {
    const { business, user, service, date, time, durationMinutes } = bookingData;

    // Step 1: Pre-validation
    const validationResult = await BookingValidator.validateBooking(bookingData);
    
    if (!validationResult.valid) {
      console.log('❌ Validation failed:', validationResult.conflicts);
      throw new BookingError('TIME_CONFLICT', validationResult);
    }

    console.log('✅ Pre-validation passed');

    // Step 2: Double-check for exact conflicts (without session)
    const existingConflict = await Appointment.findOne({
      business,
      date,
      time,
      status: { $ne: 'canceled' }
    });

    if (existingConflict) {
      console.log('❌ Race condition detected - slot taken during validation');
      throw new BookingError('RACE_CONDITION', {
        valid: false,
        conflicts: [{
          type: 'RACE_CONDITION',
          message: `Time slot ${time} was booked by another user during your request`,
          conflictingAppointment: existingConflict._id
        }]
      });
    }

    // Step 3: Check for service duration overlaps (without session)
    const overlappingAppointments = await this.findOverlappingAppointments(
      business, date, time, durationMinutes, null
    );

    if (overlappingAppointments.length > 0) {
      console.log('❌ Service duration overlap detected');
      throw new BookingError('DURATION_OVERLAP', {
        valid: false,
        conflicts: overlappingAppointments.map(apt => ({
          type: 'DURATION_OVERLAP',
          message: `Your ${durationMinutes}-minute service overlaps with existing appointment`,
          conflictingTime: apt.time,
          conflictingDuration: apt.durationMinutes
        }))
      });
    }

    // Step 4: Create appointment (relying on unique index for race condition protection)
    console.log('💾 Creating appointment...');
    
    const newAppointment = new Appointment({
      business,
      user,
      service,
      date,
      time,
      durationMinutes,
      status: 'booked',
      version: 0
    });

    const savedAppointment = await newAppointment.save();
    
    console.log('✅ Appointment created successfully:', savedAppointment._id);

    // Step 5: Populate the response
    const populatedAppointment = await Appointment.findById(savedAppointment._id)
      .populate('user service business');

    return {
      success: true,
      appointment: populatedAppointment,
      message: 'Appointment booked successfully'
    };
  }

  /**
   * Find appointments that would overlap with the proposed booking
   * @param {string} businessId - Business ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} startTime - Start time in HH:mm format
   * @param {number} durationMinutes - Service duration
   * @param {Object} session - MongoDB session for transaction (optional, can be null)
   * @returns {Array} Array of overlapping appointments
   */
  static async findOverlappingAppointments(businessId, date, startTime, durationMinutes, session) {
    const proposedStart = BookingValidator.timeToMinutes(startTime);
    const proposedEnd = proposedStart + durationMinutes;
    const bufferMinutes = 15;

    // Get all appointments on this date
    const query = Appointment.find({
      business: businessId,
      date,
      status: { $ne: 'canceled' }
    });
    
    // Add session if provided (for transaction support)
    if (session) {
      query.session(session);
    }
    
    const appointments = await query;

    const overlapping = [];

    for (const appointment of appointments) {
      const existingStart = BookingValidator.timeToMinutes(appointment.time);
      const existingEnd = existingStart + appointment.durationMinutes;

      // Check for overlap with buffer
      const hasOverlap = BookingValidator.timeRangesOverlap(
        startTime,
        BookingValidator.minutesToTime(proposedEnd),
        appointment.time,
        BookingValidator.minutesToTime(existingEnd),
        bufferMinutes
      );

      if (hasOverlap) {
        overlapping.push(appointment);
      }
    }

    return overlapping;
  }

  /**
   * Atomic reschedule operation (without transactions, using optimistic locking)
   * @param {string} appointmentId - Appointment ID to reschedule
   * @param {Object} newBookingData - New time/date data
   * @returns {Object} Result with success status and data
   */
  static async atomicReschedule(appointmentId, newBookingData) {
    try {
      console.log('🔄 Starting reschedule operation...');
      
      return await this.performRescheduleWithValidation(appointmentId, newBookingData);
    } catch (error) {
      console.error('💥 Reschedule error:', error.message);
      
      if (error instanceof BookingError) {
        return {
          success: false,
          error: error.type,
          validationResult: error.validationResult,
          message: error.message
        };
      }

      return {
        success: false,
        error: 'RESCHEDULE_ERROR',
        message: 'Failed to reschedule appointment',
        details: error.message
      };
    }
  }

  /**
   * Perform reschedule with validation but without transactions
   * @param {string} appointmentId - Appointment ID to reschedule
   * @param {Object} newBookingData - New time/date data
   * @returns {Object} Result with success status and data
   */
  static async performRescheduleWithValidation(appointmentId, newBookingData) {
    // Step 1: Verify appointment exists and get current version
    const currentAppointment = await Appointment.findById(appointmentId);
    
    if (!currentAppointment) {
          throw new BookingError('NOT_FOUND', {
            valid: false,
            conflicts: [{ type: 'NOT_FOUND', message: 'Appointment not found' }]
          });
        }

        // Step 2: Validate new time slot
        const validationResult = await BookingValidator.validateReschedule(appointmentId, newBookingData);
        
        if (!validationResult.valid) {
          throw new BookingError('TIME_CONFLICT', validationResult);
        }

        // Step 3: Update with optimistic locking
        const { date, time } = newBookingData;
        const updatedAppointment = await Appointment.findOneAndUpdate(
          { 
            _id: appointmentId,
            version: currentAppointment.version // Optimistic locking
          },
          { 
            date,
            time,
            lastModified: new Date(),
            $inc: { version: 1 } // Increment version
          },
          { 
            new: true
          }
        ).populate('business user service');

        if (!updatedAppointment) {
          throw new BookingError('VERSION_CONFLICT', {
            valid: false,
            conflicts: [{ 
              type: 'VERSION_CONFLICT', 
              message: 'Appointment was modified by another request' 
            }]
          });
        }

        console.log('✅ Appointment rescheduled successfully');

        return {
          success: true,
          appointment: updatedAppointment,
          message: 'Appointment rescheduled successfully'
        };
  }

  /**
   * Execute operation with retry logic for handling temporary failures
   * @param {Function} operation - Async operation to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay between retries in ms
   * @returns {Object} Operation result
   */
  static async withRetry(operation, maxRetries = 3, baseDelay = 100) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on validation errors or business logic errors
        if (error instanceof BookingError) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * Custom error class for booking-related errors
 */
class BookingError extends Error {
  constructor(type, validationResult) {
    super(validationResult.conflicts?.[0]?.message || 'Booking error occurred');
    this.type = type;
    this.validationResult = validationResult;
  }
}

module.exports = { TransactionHandler, BookingError };
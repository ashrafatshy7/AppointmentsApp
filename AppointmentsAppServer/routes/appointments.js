const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const Service = require("../models/service");
const User = require("../models/user");
const Business = require("../models/business");
const { TransactionHandler, BookingError } = require("../utils/transactionHandler");
const BookingValidator = require("../utils/bookingValidator"); 

/// Create a new appointment with FULL RACE CONDITION PROTECTION
// POST /api/appointments/book
// Uses atomic transactions and comprehensive conflict detection
router.post("/book", async (req, res) => {
  try {
    console.log('🚀 === ATOMIC APPOINTMENT CREATION REQUEST ===');
    console.log('Request body:', req.body);
    
    const { business, user, service, date, time, durationMinutes } = req.body;

    // Step 1: Validate required fields
    const validationErrors = [];
    if (!business) validationErrors.push("Business ID is required");
    if (!user) validationErrors.push("User ID is required");
    if (!service) validationErrors.push("Service ID is required");
    if (!date) validationErrors.push("Date is required");
    if (!time) validationErrors.push("Time is required");
    if (!durationMinutes) validationErrors.push("Duration is required");

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: validationErrors 
      });
    }

    // Step 2: Resolve user ID (handle phone number or ObjectId)
    let userId;
    
    if (user.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId - use directly
      userId = user;
      console.log('✅ Using provided ObjectId for user:', userId);
    } else {
      // Phone number - find user
      console.log('📞 Resolving user by phone:', user);
      
      const existingUser = await User.findOne({ phone: user });
      
      if (existingUser) {
        userId = existingUser._id;
        console.log('✅ Found existing user:', userId);
      } else {
        console.log('❌ User not found with phone:', user);
        return res.status(400).json({ 
          error: "User not found with this phone number",
          suggestion: "Please register first or check your phone number"
        });
      }
    }

    // Step 3: Validate referenced entities exist
    console.log('🔍 Validating referenced entities...');
    
    const [serviceDoc, userDoc, businessDoc] = await Promise.all([
      Service.findById(service),
      User.findById(userId),
      Business.findById(business)
    ]);

    if (!serviceDoc) {
      return res.status(400).json({ 
        error: "Invalid service ID",
        serviceId: service 
      });
    }

    if (!userDoc) {
      return res.status(400).json({ 
        error: "Invalid user ID",
        userId: userId 
      });
    }

    if (!businessDoc) {
      return res.status(400).json({ 
        error: "Invalid business ID",
        businessId: business 
      });
    }

    console.log('✅ All entities validated successfully');
    console.log(`📋 Service: ${serviceDoc.name} (${serviceDoc.durationMinutes}min)`);
    console.log(`👤 User: ${userDoc.name || userDoc.phone}`);
    console.log(`🏢 Business: ${businessDoc.name}`);

    // Check duration consistency (warning only)
    if (durationMinutes !== serviceDoc.durationMinutes) {
      console.log(`⚠️ Duration mismatch. Service: ${serviceDoc.durationMinutes}min, Requested: ${durationMinutes}min`);
    }

    // Step 4: Execute atomic booking with retry logic
    console.log('🔐 Executing atomic booking transaction...');
    
    const bookingData = {
      business,
      user: userId,
      service,
      date,
      time,
      durationMinutes
    };

    const result = await TransactionHandler.withRetry(
      () => TransactionHandler.atomicBooking(bookingData),
      3, // maxRetries
      50  // baseDelay
    );

    // Step 5: Handle result
    if (result.success) {
      console.log('✅ Appointment created successfully!');
      console.log(`📅 ${date} ${time} (${durationMinutes}min)`);
      console.log(`🆔 Appointment ID: ${result.appointment._id}`);

      return res.status(201).json({
        success: true,
        appointment: result.appointment,
        message: result.message
      });
    } else {
      // Handle specific error types with appropriate status codes and messages
      return handleBookingError(res, result);
    }

  } catch (err) {
    console.error('💥 Appointment creation error:', err);
    
    // Handle MongoDB errors
    if (err.code === 11000) {
      return res.status(409).json({ 
        error: "Time slot already booked",
        message: "This time slot was booked by another user",
        suggestion: "Please select a different time"
      });
    }

    return res.status(500).json({ 
      error: "Internal server error",
      message: "Unable to process booking request",
      requestId: Date.now() // For debugging
    });
  }
});

/**
 * Handle booking error responses with appropriate status codes and messages
 * @param {Object} res - Express response object
 * @param {Object} result - Booking result from TransactionHandler
 */
function handleBookingError(res, result) {
  const { error, validationResult, message } = result;

  switch (error) {
    case 'TIME_CONFLICT':
      return res.status(409).json({
        error: 'Time conflict',
        message: 'The requested time slot is not available',
        conflicts: validationResult.conflicts,
        alternativeSlots: validationResult.alternativeSlots || [],
        suggestion: 'Please select a different time from the suggested alternatives'
      });

    case 'RACE_CONDITION':
      return res.status(409).json({
        error: 'Booking conflict',
        message: 'This time slot was just booked by another user',
        suggestion: 'Please refresh and select a new time slot'
      });

    case 'DURATION_OVERLAP':
      return res.status(409).json({
        error: 'Service duration conflict',
        message: 'Your service duration overlaps with existing appointments',
        conflicts: validationResult.conflicts,
        suggestion: 'Please select a time with sufficient gap from other appointments'
      });

    case 'DUPLICATE_BOOKING':
      return res.status(409).json({
        error: 'Duplicate booking',
        message: 'This exact time slot is already booked',
        suggestion: 'Please select a different time'
      });

    case 'VALIDATION_ERROR':
      return res.status(400).json({
        error: 'Validation error',
        message: message || 'Unable to validate booking request',
        details: validationResult?.conflicts || []
      });

    case 'TRANSACTION_ERROR':
    default:
      return res.status(500).json({
        error: 'Booking failed',
        message: message || 'Unable to complete booking request',
        suggestion: 'Please try again or contact support'
      });
  }
}

// Get all appointments in the system
// GET /api/appointments
// Returns all appointments with populated business, user, and service data
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().populate(
      "business user service"
    ).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get appointments for a specific business
// GET /api/appointments/business/:businessId?date=YYYY-MM-DD
// Optional date query parameter to filter by date
router.get("/business/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date } = req.query;

    console.log('=== BUSINESS APPOINTMENTS REQUEST ===');
    console.log('Business ID:', businessId);
    console.log('Date filter:', date);

    const filter = { business: businessId };
    if (date) filter.date = date;

    console.log('MongoDB filter:', JSON.stringify(filter));

    const appointments = await Appointment.find(filter).populate(
      "user service"
    ).sort({ date: 1, time: 1 });
    
    console.log('Found appointments:', appointments.length);
    console.log('Appointment IDs:', appointments.map(apt => apt._id));
    
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching business appointments:', err);
    res.status(500).json({ error: err.message });
  }
});

// Removed conflicting route - using phone-based endpoint instead

// Get a single appointment by ID
// GET /api/appointments/:id
// Returns appointment with populated references
router.get("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "business user service"
    );
    if (!appointment) return res.status(404).json({ error: "Not found" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update appointment status
// PATCH /api/appointments/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;
    
    // Validate status
    const validStatuses = ['booked', 'completed', 'canceled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }
    
    // Get current appointment to check current status
    const currentAppointment = await Appointment.findById(appointmentId);
    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    const currentStatus = currentAppointment.status;
    console.log(`Status transition request: ${currentStatus} -> ${status} for appointment ${appointmentId}`);
    
    // Validate status transitions (business rules)
    const isValidTransition = validateStatusTransition(currentStatus, status);
    if (!isValidTransition.valid) {
      return res.status(400).json({ 
        error: isValidTransition.message 
      });
    }
    
    // Update appointment with new status and timestamp
    const updateData = {
      status,
      statusUpdatedAt: new Date(),
      lastModified: new Date()
    };
    
    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    ).populate('business user service');
    
    // Log the status change for audit trail
    console.log(`✅ Appointment ${appointmentId} status successfully updated:`);
    console.log(`   Previous: ${currentStatus}`);
    console.log(`   New: ${status}`);
    console.log(`   Updated at: ${updateData.statusUpdatedAt}`);
    console.log(`   User: ${updated.user?.name || updated.user?.phone || 'Unknown'}`);
    console.log(`   Service: ${updated.service?.name || 'Unknown'}`);
    console.log(`   Date/Time: ${updated.date} ${updated.time}`);
    
    res.json(updated);
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to validate status transitions
function validateStatusTransition(currentStatus, newStatus) {
  // If status is not changing, it's always valid
  if (currentStatus === newStatus) {
    return { valid: true };
  }
  
  // Define allowed transitions
  const allowedTransitions = {
    'booked': ['completed', 'canceled'],
    'completed': ['booked'], // Allow return to booked
    'canceled': ['booked']   // Allow return to booked
  };
  
  const allowedFromCurrent = allowedTransitions[currentStatus] || [];
  
  if (allowedFromCurrent.includes(newStatus)) {
    return { valid: true };
  }
  
  return {
    valid: false,
    message: `Invalid status transition: Cannot change from '${currentStatus}' to '${newStatus}'. Allowed transitions from '${currentStatus}': ${allowedFromCurrent.join(', ')}`
  };
}

// Get appointment status history/details
// GET /api/appointments/:id/status-info
router.get("/:id/status-info", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('business client service');
    
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    // Return detailed status information
    const statusInfo = {
      appointmentId: appointment._id,
      currentStatus: appointment.status,
      statusUpdatedAt: appointment.statusUpdatedAt,
      lastModified: appointment.lastModified,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      client: {
        name: appointment.client?.name,
        phone: appointment.client?.phone
      },
      service: {
        name: appointment.service?.name,
        duration: appointment.service?.durationMinutes
      },
      appointment: {
        date: appointment.date,
        time: appointment.time,
        durationMinutes: appointment.durationMinutes
      }
    };
    
    console.log(`Status info requested for appointment ${req.params.id}:`, statusInfo.currentStatus);
    res.json(statusInfo);
  } catch (err) {
    console.error('Error getting appointment status info:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reschedule an appointment with ATOMIC PROTECTION
// PATCH /api/appointments/:id/reschedule
router.patch("/:id/reschedule", async (req, res) => {
  try {
    console.log('🔄 === ATOMIC APPOINTMENT RESCHEDULE REQUEST ===');
    console.log(`Appointment ID: ${req.params.id}`);
    console.log('Request body:', req.body);
    
    const { dateTime, date, time, businessId } = req.body;
    
    // Validate required fields
    if (!dateTime && (!date || !time)) {
      return res.status(400).json({ 
        error: "Either dateTime or both date and time are required" 
      });
    }
    
    let appointmentDate, appointmentTime;
    
    if (dateTime) {
      const dt = new Date(dateTime);
      appointmentDate = dt.toISOString().split('T')[0];
      appointmentTime = dt.toTimeString().slice(0, 5);
    } else {
      appointmentDate = date;
      appointmentTime = time;
    }

    console.log(`📅 New time: ${appointmentDate} ${appointmentTime}`);

    // Get current appointment to determine business and service
    const currentAppointment = await Appointment.findById(req.params.id).populate('service');
    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Prepare new booking data for validation
    const newBookingData = {
      business: businessId || currentAppointment.business,
      date: appointmentDate,
      time: appointmentTime,
      durationMinutes: currentAppointment.durationMinutes
    };

    console.log('🔐 Executing atomic reschedule...');

    // Execute atomic reschedule with retry logic
    const result = await TransactionHandler.withRetry(
      () => TransactionHandler.atomicReschedule(req.params.id, newBookingData),
      3, // maxRetries
      50  // baseDelay
    );

    // Handle result
    if (result.success) {
      console.log('✅ Appointment rescheduled successfully!');
      console.log(`📅 New time: ${appointmentDate} ${appointmentTime}`);
      console.log(`🆔 Appointment ID: ${result.appointment._id}`);

      return res.status(200).json({
        success: true,
        appointment: result.appointment,
        message: result.message
      });
    } else {
      // Handle specific error types
      return handleBookingError(res, result);
    }

  } catch (err) {
    console.error('💥 Reschedule error:', err);
    
    // Handle MongoDB errors
    if (err.code === 11000) {
      return res.status(409).json({ 
        error: "Time slot already booked",
        message: "The new time slot was booked by another user",
        suggestion: "Please select a different time"
      });
    }

    return res.status(500).json({ 
      error: "Internal server error",
      message: "Unable to reschedule appointment"
    });
  }
});

// Update an existing appointment
// PUT /api/appointments/:id
// Updates appointment details
router.put("/:id", async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an appointment
// DELETE /api/appointments/:id
// Removes appointment from database
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/appointments/available-slots/:businessId?date=YYYY-MM-DD&serviceId=...
router.get("/available-slots/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date, serviceId } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    // Get business working hours
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Get service duration if serviceId provided
    let serviceDuration = 60; // default 60 minutes
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service) {
        serviceDuration = service.durationMinutes || 60;
      }
    }

    // Get day of week for working hours
    const dayOfWeek = new Date(date).toLocaleDateString('en', { weekday: 'short' }).toLowerCase();
    const workingHours = business.workingHours[dayOfWeek];
    
    if (!workingHours) {
      return res.json({ slots: [], message: "Business closed on this day" });
    }

    // Generate time slots based on working hours AND breaks
    const slots = generateTimeSlotsWithBreaks(
      workingHours.open, 
      workingHours.close, 
      workingHours.breaks || [], // Handle breaks
      serviceDuration
    );
    
    // Get existing appointments for this date
    const existingAppointments = await Appointment.find({ 
      business: businessId, 
      date: date 
    });

    // Filter out booked slots
    const availableSlots = slots.filter(slot => {
      return !existingAppointments.some(appointment => 
        appointment.time === slot.time
      );
    });

    res.json({ 
      date,
      slots: availableSlots,
      businessHours: workingHours,
      breaks: workingHours.breaks || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Updated helper function to handle breaks
function generateTimeSlotsWithBreaks(openTime, closeTime, breaks, durationMinutes) {
  const slots = [];
  const open = timeStringToMinutes(openTime);
  const close = timeStringToMinutes(closeTime);
  
  // Convert breaks to minutes
  const breakPeriods = breaks.map(breakTime => ({
    start: timeStringToMinutes(breakTime.start),
    end: timeStringToMinutes(breakTime.end)
  }));
  
  for (let time = open; time + durationMinutes <= close; time += durationMinutes) {
    // Check if this slot conflicts with any break
    const slotEnd = time + durationMinutes;
    const conflictsWithBreak = breakPeriods.some(breakPeriod => {
      // Check if slot overlaps with break period
      return (time < breakPeriod.end && slotEnd > breakPeriod.start);
    });
    
    if (!conflictsWithBreak) {
      slots.push({
        time: minutesToTimeString(time),
        duration: durationMinutes,
        available: true
      });
    }
  }
  
  return slots;
}

function timeStringToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeString(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Get customers for a specific business with business-specific data
// GET /api/appointments/business/:businessId/customers
router.get("/business/:businessId/customers", async (req, res) => {
  try {
    const { businessId } = req.params;

    // Get all appointments for this business and populate user data (handle both old 'client' and new 'user' fields)
    const appointments = await Appointment.find({ business: businessId })
      .populate([
        { path: 'user', select: 'name phone email' },
        { path: 'client', select: 'name phone email' } // Handle old appointments
      ])
      .sort({ date: -1, time: -1 });

    if (!appointments || appointments.length === 0) {
      return res.json([]);
    }

    // Group appointments by user and create customer summaries
    const customerMap = new Map();
    
    appointments.forEach(appointment => {
      // Handle both old 'client' and new 'user' fields
      const userData = appointment.user || appointment.client;
      if (!userData) return; // Skip if neither user nor client exists
      
      const userId = userData._id.toString();
      
      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          _id: userData._id,
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          appointments: [],
          appointmentCount: 0,
          lastAppointmentDate: null,
          firstAppointmentDate: null,
          completedCount: 0,
          canceledCount: 0,
          bookedCount: 0,
          businessSpecificData: {
            notes: "",
            tags: [],
            status: "active"
          }
        });
      }
      
      const customer = customerMap.get(userId);
      customer.appointments.push({
        _id: appointment._id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        service: appointment.service
      });
      
      customer.appointmentCount++;
      
      // Update status counts
      if (appointment.status === 'completed') customer.completedCount++;
      else if (appointment.status === 'canceled') customer.canceledCount++;
      else if (appointment.status === 'booked') customer.bookedCount++;
      
      // Update date tracking
      const appointmentDate = new Date(appointment.date + 'T' + appointment.time);
      if (!customer.lastAppointmentDate || appointmentDate > new Date(customer.lastAppointmentDate)) {
        customer.lastAppointmentDate = appointment.date;
      }
      if (!customer.firstAppointmentDate || appointmentDate < new Date(customer.firstAppointmentDate)) {
        customer.firstAppointmentDate = appointment.date;
      }
    });

    // Note: Business-specific data removed since clients are being removed
    // All customers now use default business-specific data

    // Convert Map to Array and sort by last appointment date (most recent first)
    const customers = Array.from(customerMap.values()).sort((a, b) => {
      if (!a.lastAppointmentDate) return 1;
      if (!b.lastAppointmentDate) return -1;
      return new Date(b.lastAppointmentDate) - new Date(a.lastAppointmentDate);
    });

    res.json(customers);
  } catch (err) {
    console.error('Error fetching business customers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get appointments for a user by phone number
// GET /api/appointments/user/:phone
// Returns appointments organized by status (booked, completed, canceled)
router.get("/user/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    console.log('=== USER APPOINTMENTS REQUEST ===');
    console.log('Phone:', phone);
    
    // Find the user by phone number
    const user = await User.findOne({ phone });
    console.log('User found:', user ? user._id : 'Not found');
    if (!user) {
      console.log('No user found, returning empty data');
      return res.json({ booked: [], completed: [], canceled: [] });
    }

    // Get all appointments for this user (handle both old 'client' and new 'user' fields)
    console.log('Searching for appointments with user ID:', user._id);
    
    // First, let's test if we can find any appointments at all
    const allAppointments = await Appointment.find({});
    console.log('Total appointments in database:', allAppointments.length);
    
    // Check the structure of existing appointments
    if (allAppointments.length > 0) {
      const firstAppointment = allAppointments[0];
      console.log('First appointment structure:', {
        hasUser: !!firstAppointment.user,
        hasClient: !!firstAppointment.client,
        userType: firstAppointment.user ? typeof firstAppointment.user : 'undefined',
        clientType: firstAppointment.client ? typeof firstAppointment.client : 'undefined'
      });
    }
    
    const query = {
      $or: [
        { user: user._id },
        { client: user._id } // Handle old appointments that still use 'client'
      ]
    };
    console.log('Query:', JSON.stringify(query));
    
    const appointments = await Appointment.find(query)
      .populate("business service")
      .sort({ date: 1, time: 1 });
    
    console.log('Found appointments:', appointments.length);

    // Group appointments by status and format for client
    const grouped = { booked: [], completed: [], canceled: [] };
    for (const appointment of appointments) {
      if (grouped[appointment.status]) {
        // Format appointment data for client consumption
        const formattedAppointment = {
          _id: appointment._id,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          businessImage: appointment.business?.profileImage || null,
          businessName: appointment.business?.name || 'Unknown Business',
          serviceName: appointment.service?.name || 'Unknown Service',
          price: appointment.service?.price || 0,
          durationMinutes: appointment.durationMinutes || 0
        };
        grouped[appointment.status].push(formattedAppointment);
      }
    }

    res.json(grouped);
  } catch (err) {
    console.error('Error fetching user appointments:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// src/BusinessDetailsPage/TimeUtils.js

import AppointmentEventEmitter from '../../Utils/AppointmentEventEmitter';

// Cache for day of week calculations to avoid repeated date operations
const dayOfWeekCache = new Map();

// Cache for time slot calculations
const timeSlotCache = new Map();

/**
 * Generate available time slots for booking for a specific business
 * @param {string} dateStr - Selected date (YYYY-MM-DD)
 * @param {object} openHours - Business opening hours
 * @param {array} bookedTimes - Array of already booked time slots
 * @param {string} businessId - The ID of the business
 * @param {number} duration - Service duration in minutes (default: 60)
 * @param {number} bufferTime - Buffer time between appointments in minutes (default: 15)
 * @returns {array} Array of available time slots
 */
export const generateTimeSlots = (
  dateStr,
  openHours,
  bookedTimes = [],
  businessId = null,
  duration = 60,
  bufferTime = 15
) => {
  
  if (!dateStr || !openHours) {
    return [];
  }
  
  // Create a cache key based on the input parameters
  const cacheKey = `${dateStr}-${businessId}-${duration}-${bufferTime}-${JSON.stringify(bookedTimes)}`;
  
  // Check if we have cached results for these parameters
  if (timeSlotCache.has(cacheKey)) {
    return timeSlotCache.get(cacheKey);
  }
  
  // Get day of week with caching
  const dayOfWeek = getDayOfWeek(dateStr);
  
  // Map to the open hours format (convert full day name to abbreviated)
  const dayKey = dayOfWeek.substring(0, 3); // 'sunday' -> 'sun'
  const dayHours = openHours?.[dayKey];
  
  
  // If business is closed on this day or no hours data
  if (!dayHours || !dayHours.open || !dayHours.close) {
    timeSlotCache.set(cacheKey, []);
    return [];
  }
  
  // Parse opening and closing hours
  let [startHour, startMinute] = dayHours.open.split(':').map(Number);
  let [endHour, endMinute] = dayHours.close.split(':').map(Number);
  
  // Create Date objects for start and end times
  const today = new Date();
  const selectedDate = new Date(dateStr);
  
  // Set opening hours on the selected date
  const openTime = new Date(selectedDate);
  openTime.setHours(startHour, startMinute, 0, 0);
  
  // Set closing hours on the selected date
  const closeTime = new Date(selectedDate);
  closeTime.setHours(endHour, endMinute, 0, 0);
  
  // Check if selected date is today
  const isToday = selectedDate.toDateString() === today.toDateString();
  
  // If selected date is today, adjust start time to current time (rounded up to next slot)
  if (isToday) {
    const currentTime = new Date();
    // Round up to nearest bufferTime interval
    const minutesToAdd = bufferTime - (currentTime.getMinutes() % bufferTime);
    
    const adjustedCurrentTime = new Date(currentTime);
    adjustedCurrentTime.setMinutes(currentTime.getMinutes() + minutesToAdd);
    adjustedCurrentTime.setSeconds(0);
    adjustedCurrentTime.setMilliseconds(0);
    
    // Add 1 more buffer to ensure we don't book too close to current time
    const minimumBookingTime = new Date(adjustedCurrentTime);
    minimumBookingTime.setMinutes(adjustedCurrentTime.getMinutes() + bufferTime);
    
    // If minimum booking time is after opening time, use it instead
    if (minimumBookingTime > openTime) {
      openTime.setHours(
        minimumBookingTime.getHours(),
        minimumBookingTime.getMinutes(),
        0,
        0
      );
    }
  }
  
  // Convert bookedTimes from strings to objects for easier processing
  const bookedDateTimes = processBookedTimes(bookedTimes, selectedDate, duration);
  
  // Process breaks from working hours
  const breakTimes = processBreakTimes(dayHours.breaks || [], selectedDate);
  
  // Combine booked times and break times
  const allBlockedTimes = [...bookedDateTimes, ...breakTimes];
  
  // Generate time slots
  const timeSlots = generateAvailableTimeSlots(
    openTime,
    closeTime,
    allBlockedTimes,
    duration,
    bufferTime
  );
  
  
  // Cache the result
  timeSlotCache.set(cacheKey, timeSlots);
  
  return timeSlots;
};

/**
 * Process break times from working hours into standardized format
 * @param {array} breaks - Array of break times from working hours
 * @param {Date} selectedDate - Selected date
 * @returns {array} Processed break time slots
 */
const processBreakTimes = (breaks, selectedDate) => {
  if (!breaks || breaks.length === 0) {
    return [];
  }
  
  return breaks.map(breakTime => {
    // Parse start time
    const [startHour, startMinute] = breakTime.start.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    // Parse end time
    const [endHour, endMinute] = breakTime.end.split(':').map(Number);
    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    return {
      start: startTime,
      end: endTime,
      duration: (endTime - startTime) / 60000 // Duration in minutes
    };
  });
};

/**
 * Process booked times into a standardized format
 * @param {array} bookedTimes - Array of booked time slots
 * @param {Date} selectedDate - Selected date
 * @param {number} defaultDuration - Default duration for simple bookings
 * @returns {array} Processed booked time slots
 */
const processBookedTimes = (bookedTimes, selectedDate, defaultDuration) => {
  return bookedTimes.map(timeStr => {
    // If timeStr is an object with start, duration, we use those values
    if (typeof timeStr === 'object' && timeStr.time && timeStr.duration) {
      // Handle both 12-hour and 24-hour formats during transition
      const timePart = timeStr.time.includes(' ') ? timeStr.time.split(' ')[0] : timeStr.time;
      const [hourStr, minuteStr] = timePart.split(':');
      let hours = parseInt(hourStr, 10);
      const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;
      
      // If the original string had AM/PM, handle the conversion (for backward compatibility)
      if (timeStr.time.includes(' ')) {
        const period = timeStr.time.split(' ')[1];
        if (period === 'PM' && hours < 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
      }
      
      const bookedTime = new Date(selectedDate);
      bookedTime.setHours(hours, minutes, 0, 0);
      
      // Use the specific duration from the booking
      return {
        start: bookedTime,
        end: new Date(bookedTime.getTime() + timeStr.duration * 60000),
        duration: timeStr.duration
      };
    } else {
      // Handle string format - both 12-hour and 24-hour formats during transition
      const timePart = timeStr.includes(' ') ? timeStr.split(' ')[0] : timeStr;
      const [hourStr, minuteStr] = timePart.split(':');
      let hours = parseInt(hourStr, 10);
      const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;
      
      // If the original string had AM/PM, handle the conversion (for backward compatibility)
      if (timeStr.includes(' ')) {
        const period = timeStr.split(' ')[1];
        if (period === 'PM' && hours < 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
      }
      
      const bookedTime = new Date(selectedDate);
      bookedTime.setHours(hours, minutes, 0, 0);
      return {
        start: bookedTime,
        end: new Date(bookedTime.getTime() + defaultDuration * 60000),
        duration: defaultDuration
      };
    }
  });
};

/**
 * Generate available time slots based on business hours and booked times
 * @param {Date} openTime - Business opening time
 * @param {Date} closeTime - Business closing time
 * @param {array} bookedDateTimes - Array of booked time slots
 * @param {number} duration - Service duration
 * @param {number} bufferTime - Buffer time between appointments
 * @returns {array} Available time slots
 */
const generateAvailableTimeSlots = (openTime, closeTime, bookedDateTimes, duration, bufferTime) => {
  const timeSlots = [];
  
  
  // Generate slots until closing time
  let currentSlotStart = new Date(openTime);
  let slotCount = 0;
  
  while (currentSlotStart < closeTime && slotCount < 100) { // Add safety limit
    slotCount++;
    
    // Calculate end time for this slot
    const currentSlotEnd = new Date(currentSlotStart.getTime() + duration * 60000);
    
    
    // Check if this slot would extend past closing time
    if (currentSlotEnd > closeTime) {
      break;
    }
    
    // Check if this slot conflicts with any booked times
    const isConflicting = checkForConflicts(
      currentSlotStart, 
      currentSlotEnd, 
      bookedDateTimes, 
      bufferTime
    );
    
    
    // If no conflict, add this slot to available times
    if (!isConflicting) {
      const formattedTime = formatTimeString(currentSlotStart);
      timeSlots.push(formattedTime);
    }
    
    // Move to next potential slot
    currentSlotStart = new Date(currentSlotStart.getTime() + bufferTime * 60000);
  }
  
  return timeSlots;
};

/**
 * Check if a time slot conflicts with any booked times
 * @param {Date} slotStart - Start time of the slot
 * @param {Date} slotEnd - End time of the slot
 * @param {array} bookedSlots - Array of booked time slots
 * @param {number} bufferTime - Buffer time in minutes
 * @returns {boolean} True if there is a conflict
 */
const checkForConflicts = (slotStart, slotEnd, bookedSlots, bufferTime) => {
  return bookedSlots.some(bookedSlot => {
    // Standard overlap check
    const hasOverlap = slotEnd > bookedSlot.start && slotStart < bookedSlot.end;
    
    // Also check if current slot is too close to booked slot (buffer time)
    const startTooClose = Math.abs(slotStart - bookedSlot.end) < bufferTime * 60000;
    const endTooClose = Math.abs(slotEnd - bookedSlot.start) < bufferTime * 60000;
    
    return hasOverlap || startTooClose || endTooClose;
  });
};

/**
 * Format Date object to time string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted time string (e.g. "10:30")
 */
const formatTimeString = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Format time as "HH:mm" (24-hour format)
  const displayHours = hours.toString().padStart(2, '0');
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes}`;
};

/**
 * Get the day of week from a date string with caching
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {string} Day of week (lowercase)
 */
export const getDayOfWeek = (dateString) => {
  // Check cache first
  if (dayOfWeekCache.has(dateString)) {
    return dayOfWeekCache.get(dateString);
  }
  
  try {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Cache the result
    dayOfWeekCache.set(dateString, dayOfWeek);
    
    return dayOfWeek;
  } catch (error) {
    console.error('Error getting day of week:', error);
    return 'monday'; // default to Monday as fallback
  }
};

/**
 * Group time slots by morning, afternoon, and evening for better UX
 * @param {array} timeSlots - Array of time slots in 24-hour format
 * @returns {object} Grouped time slots
 */
export const groupTimeSlotsByPeriod = (timeSlots) => {
  const grouped = {
    morning: [],   // Before 12:00
    afternoon: [], // 12:00 to 17:00
    evening: []    // After 17:00
  };
  
  timeSlots.forEach(timeSlot => {
    // Handle both formats during transition: "10:30" or "10:30 AM"
    const timePart = timeSlot.includes(' ') ? timeSlot.split(' ')[0] : timeSlot;
    const [hourStr] = timePart.split(':');
    let hour = parseInt(hourStr, 10);
    
    // If the original string had AM/PM, handle the conversion (for backward compatibility)
    if (timeSlot.includes(' ')) {
      const period = timeSlot.split(' ')[1];
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
    }
    
    if (hour < 12) {
      grouped.morning.push(timeSlot);
    } else if (hour < 17) {
      grouped.afternoon.push(timeSlot);
    } else {
      grouped.evening.push(timeSlot);
    }
  });
  
  return grouped;
};

/**
 * Get a human-readable representation of availability
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {object} openHours - Business opening hours
 * @returns {string} Human-readable availability (e.g., "11:00 - 19:00")
 */
export const getReadableAvailability = (dateStr, openHours) => {
  const dayOfWeek = getDayOfWeek(dateStr);
  const dayKey = dayOfWeek.substring(0, 3); // 'sunday' -> 'sun'
  const dayHours = openHours?.[dayKey];
  
  if (!dayHours || !dayHours.open || !dayHours.close) {
    return 'Closed';
  }
  
  // Parse times and format them nicely
  const startTime = formatTimeString24Hour(dayHours.open);
  const endTime = formatTimeString24Hour(dayHours.close);
  
  return `${startTime} - ${endTime}`;
};

/**
 * Format time string to ensure consistent 24-hour format
 * @param {string} timeStr - Time string in 24-hour format (HH:MM)
 * @returns {string} Formatted time string in 24-hour format
 */
const formatTimeString24Hour = (timeStr) => {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  const displayHours = hours.toString().padStart(2, '0');
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes}`;
};

/**
 * Parse time string and return minutes since start of day
 * @param {string} timeStr - Time string (e.g. "10:30" in 24-hour format)
 * @returns {number} Minutes since start of day
 */
export const parseTimeToMinutes = (timeStr) => {
  // Handle both formats during transition: "10:30" or "10:30 AM"
  const timePart = timeStr.includes(' ') ? timeStr.split(' ')[0] : timeStr;
  const [hourStr, minuteStr] = timePart.split(':');
  
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  
  // If the original string had AM/PM, handle the conversion (for backward compatibility)
  if (timeStr.includes(' ')) {
    const period = timeStr.split(' ')[1];
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
  }
  
  return hours * 60 + minutes;
};

/**
 * Add a booked time slot for a specific business
 * @param {string} businessId - The ID of the business
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:mm in 24-hour format)
 * @param {number} serviceDuration - Duration of the service in minutes
 * @param {object} businessBookedTimes - Object containing all booked times
 * @returns {object} Updated businessBookedTimes object
 */
export const addBookedTimeSlot = (businessId, dateStr, timeStr, serviceDuration = 60, businessBookedTimes) => {
  if (!businessBookedTimes[businessId]) {
    businessBookedTimes[businessId] = {};
  }
  
  if (!businessBookedTimes[businessId][dateStr]) {
    businessBookedTimes[businessId][dateStr] = [];
  }
  
  // Check if the time slot already exists or it's already an object
  const existingIndex = businessBookedTimes[businessId][dateStr].findIndex(
    item => {
      if (typeof item === 'string') {
        return item === timeStr;
      } else if (typeof item === 'object') {
        return item.time === timeStr;
      }
      return false;
    }
  );
  
  if (existingIndex === -1) {
    // Add as object with time and duration
    businessBookedTimes[businessId][dateStr].push({
      time: timeStr,
      duration: serviceDuration
    });
  } else {
    // If it exists as a string, convert to an object
    if (typeof businessBookedTimes[businessId][dateStr][existingIndex] === 'string') {
      businessBookedTimes[businessId][dateStr][existingIndex] = {
        time: timeStr,
        duration: serviceDuration
      };
    } else {
      // Update the duration if it already exists as an object
      businessBookedTimes[businessId][dateStr][existingIndex].duration = serviceDuration;
    }
  }
  
  // Invalidate cache for this businessId and dateStr
  invalidateTimeSlotCache(businessId, dateStr);
  
  return businessBookedTimes;
};

/**
 * Remove a booked time slot for a specific business
 * @param {string} businessId - The ID of the business
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:mm in 24-hour format)
 * @param {object} businessBookedTimes - Object containing all booked times
 * @returns {object} Updated businessBookedTimes object
 */
export const removeBookedTimeSlot = (businessId, dateStr, timeStr, businessBookedTimes) => {
  if (
    businessBookedTimes[businessId] && 
    businessBookedTimes[businessId][dateStr]
  ) {
    // Handle both string format and object format
    const index = businessBookedTimes[businessId][dateStr].findIndex(
      item => {
        if (typeof item === 'string') {
          return item === timeStr;
        } else if (typeof item === 'object') {
          return item.time === timeStr;
        }
        return false;
      }
    );
    
    if (index !== -1) {
      businessBookedTimes[businessId][dateStr].splice(index, 1);
      
      // IMPORTANT: If there are no more booked times for this date,
      // remove the date entry completely to prevent it from being marked as disabled
      if (businessBookedTimes[businessId][dateStr].length === 0) {
        delete businessBookedTimes[businessId][dateStr];
      }
      
      // Invalidate cache for this businessId and dateStr
      invalidateTimeSlotCache(businessId, dateStr);
      
      // Emit an event to notify that a time slot has been freed
      if (typeof AppointmentEventEmitter !== 'undefined') {
        AppointmentEventEmitter.emit('timeSlotFreed', {
          businessId: businessId,
          date: dateStr,
          time: timeStr
        });
      }
    }
  }
  
  return businessBookedTimes;
};

/**
 * Invalidate cache entries related to a specific business and date
 * @param {string} businessId - The ID of the business
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 */
const invalidateTimeSlotCache = (businessId, dateStr) => {
  const cacheKeysToDelete = [];
  
  // Find all cache keys that match the businessId and dateStr
  for (const key of timeSlotCache.keys()) {
    if (key.startsWith(`${dateStr}-${businessId}`)) {
      cacheKeysToDelete.push(key);
    }
  }
  
  // Delete the matching cache entries
  for (const key of cacheKeysToDelete) {
    timeSlotCache.delete(key);
  }
};

/**
 * Clear all caches - useful when resetting or for testing
 */
export const clearCaches = () => {
  dayOfWeekCache.clear();
  timeSlotCache.clear();
};
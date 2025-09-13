// src/Utils/AppointmentEventEmitter.js

/**
 * A simple event emitter to handle appointment-related events
 * across different components
 */
class AppointmentEventEmitter {
  constructor() {
    this.listeners = {
      appointmentAdded: [],
      appointmentCanceled: [],
      appointmentCompleted: [],
      appointmentRescheduled: [],
      appointmentsUpdated: [],
      timeSlotBooked: [],
      timeSlotFreed: [],
    };
  }

  /**
   * Add a listener for a specific event
   * @param {string} event - Event name
   * @param {function} callback - Function to call when event is emitted
   * @returns {function} Function to remove the listener
   */
  addListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    // Return a function to remove this listener
    // This is important for React's useEffect cleanup
    return () => this.removeListener(event, callback);
  }

  /**
   * Remove a listener for a specific event
   * @param {string} event - Event name
   * @param {function} callback - Function to remove
   */
  removeListener(event, callback) {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event].indexOf(callback);
    if (index !== -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * Emit an event with data
   * @param {string} event - Event name
   * @param {any} data - Data to pass to listeners
   */
  emit(event, data = null) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    });
  }

  /**
   * Remove all listeners for all events or a specific event
   * @param {string} event - Optional event name
   */
  removeAllListeners(event) {
    if (event) {
      if (this.listeners[event]) {
        this.listeners[event] = [];
      }
    } else {
      Object.keys(this.listeners).forEach(eventName => {
        this.listeners[eventName] = [];
      });
    }
  }

  /**
   * For compatibility with React Native's EventEmitter
   * which uses remove() instead of returning a cleanup function
   */
  remove() {
    // This function exists purely for API compatibility
    console.warn('AppointmentEventEmitter.remove() called directly - this is deprecated');
  }
}

// Export a singleton instance
export default new AppointmentEventEmitter();
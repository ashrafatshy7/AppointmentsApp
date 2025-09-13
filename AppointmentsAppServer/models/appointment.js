const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  date: { type: String, required: true }, // format: "YYYY-MM-DD"
  time: { type: String, required: true }, // format: "HH:mm"
  durationMinutes: { type: Number, required: true },
  status: {
    type: String,
    enum: ["booked", "canceled", "completed"],
    default: "booked",
  },
  // Timestamp fields for tracking changes
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  // Optional fields for additional tracking
  notes: {
    type: String,
    default: ""
  },
  // Version field for optimistic locking
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Critical: Compound unique index to prevent race conditions
// This ensures only ONE appointment can exist for a specific business/date/time combination
appointmentSchema.index(
  { business: 1, date: 1, time: 1 }, 
  { 
    unique: true,
    name: 'unique_business_datetime',
    // Only apply to non-canceled appointments
    partialFilterExpression: { status: { $ne: 'canceled' } }
  }
);

// Additional indexes for performance
appointmentSchema.index({ business: 1, date: 1 }); // For fetching business appointments by date
appointmentSchema.index({ user: 1, status: 1 }); // For fetching user appointments by status
appointmentSchema.index({ date: 1, time: 1 }); // For general date/time queries

module.exports = mongoose.model("Appointment", appointmentSchema);

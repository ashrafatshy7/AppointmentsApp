// models/business.js - Replace the existing file with this updated version
const mongoose = require("mongoose");

const timeRangeSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // "HH:mm"
    end: { type: String, required: true },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    open: { type: String, required: true },
    close: { type: String, required: true },
    breaks: { type: [timeRangeSchema], default: [] },
  },
  { _id: false }
);

const temporaryClosureSchema = new mongoose.Schema({
  startDate: { type: String, required: true }, // "YYYY-MM-DD"
  endDate: { type: String, required: true }, // "YYYY-MM-DD"
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const temporaryBreakSchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  startTime: { type: String, required: true }, // "HH:mm"
  endTime: { type: String, required: true }, // "HH:mm"
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerPhone: { type: String, required: true },
  businessPhone: { type: String },
  category: { type: String, required: true },

  address: {
    city: { type: String, required: true },
    street: { type: String, required: true },
    buildingNumber: { type: String, required: true },
    fullAddress: { type: String },
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: [Number],
  },

  profileImage: { type: String },
  coverImage: { type: String },
  gallery: [{ 
    path: { type: String, required: true },
    order: { type: Number, required: true }
  }], // Array of image objects with path and order
  socialMedia: {
    instagram: { type: String },
    facebook: { type: String },
    tiktok: { type: String },
    website: { type: String },
  },
  about: { type: String },
  workingHours: {
    sun: { type: dayScheduleSchema, default: null },
    mon: { type: dayScheduleSchema, default: null },
    tue: { type: dayScheduleSchema, default: null },
    wed: { type: dayScheduleSchema, default: null },
    thu: { type: dayScheduleSchema, default: null },
    fri: { type: dayScheduleSchema, default: null },
    sat: { type: dayScheduleSchema, default: null },
  },
  temporaryClosures: [temporaryClosureSchema],
  temporaryBreaks: [temporaryBreakSchema],
});

businessSchema.index({ location: "2dsphere" }, { sparse: true });
businessSchema.index({ ownerPhone: 1 }, { unique: true });

businessSchema.pre("save", function (next) {
  if (
    this.address &&
    this.address.street &&
    this.address.buildingNumber &&
    this.address.city
  ) {
    this.address.fullAddress = `${this.address.street} ${this.address.buildingNumber}, ${this.address.city}`;
  }
  next();
});

module.exports = mongoose.model("Business", businessSchema);
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["admin", "business_owner", "client"],
    default: "client",
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
  },
  name: {
    type: String,
    trim: true,
  },
  profileImage: {
    type: String,
    default: null,
    trim: true,
  },
});

module.exports = mongoose.model("User", userSchema);

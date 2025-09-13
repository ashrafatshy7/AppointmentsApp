const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  name: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  price: { type: Number },
  description: { type: String },
  image: { type: String },
});

module.exports = mongoose.model("Service", serviceSchema);

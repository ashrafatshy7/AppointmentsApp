const mongoose = require("mongoose");
const Appointment = require("../models/appointment");
const dayjs = require("dayjs");

// Self-executing async function to run the update script
(async () => {
  // Connect to MongoDB database
  await mongoose.connect("mongodb://localhost:27017/appointmentsapp");

  // Get current date and time using dayjs
  const now = dayjs();
  // Format current date as YYYY-MM-DD (e.g., "2024-01-15")
  const today = now.format("YYYY-MM-DD");
  // Format current time as HH:mm (e.g., "14:30")
  const time = now.format("HH:mm");

  // Update all appointments that should be marked as completed
  // This finds appointments with status "booked" that are in the past
  const updated = await Appointment.updateMany(
    {
      // Only update appointments currently marked as "booked"
      status: "booked",
      // Match appointments that are either:
      $or: [
        // 1. On a date before today
        { date: { $lt: today } },
        // 2. Today but at an earlier time
        { date: today, time: { $lt: time } },
      ],
    },
    // Set their status to "completed"
    { $set: { status: "completed" } }
  );

  // Log how many appointments were updated
  console.log(`Marked ${updated.modifiedCount} appointments as completed.`);

  // Close the database connection
  mongoose.disconnect();
})();

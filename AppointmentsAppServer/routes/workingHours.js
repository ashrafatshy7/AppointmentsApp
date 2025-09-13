// routes/workingHours.js
const express = require("express");
const router = express.Router();
const Business = require("../models/business");
const Appointment = require("../models/appointment");

// Update business working hours
router.put("/businesses/:businessId/working-hours", async (req, res) => {
  try {
    const { businessId } = req.params;
    const { workingHours } = req.body;

    const business = await Business.findByIdAndUpdate(
      businessId,
      { workingHours },
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json({
      success: true,
      message: "Working hours updated successfully",
      workingHours: business.workingHours
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add temporary closure
router.post("/businesses/:businessId/temporary-closure", async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ 
        error: "Start date, end date, and reason are required" 
      });
    }

    // Find affected appointments
    const affectedAppointments = await Appointment.find({
      business: businessId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['booked', 'confirmed'] }
    }).populate('client service');

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Add temporary closure
    business.temporaryClosures.push({
      startDate,
      endDate,
      reason,
      createdAt: new Date()
    });

    await business.save();

    res.json({
      success: true,
      message: "Temporary closure added successfully",
      affectedAppointments,
      closure: business.temporaryClosures[business.temporaryClosures.length - 1]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm temporary closure and cancel appointments
router.post("/businesses/:businessId/confirm-closure/:closureId", async (req, res) => {
  try {
    const { businessId, closureId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const closure = business.temporaryClosures.id(closureId);
    if (!closure) {
      return res.status(404).json({ error: "Closure not found" });
    }

    // Cancel all affected appointments
    const cancelledAppointments = await Appointment.updateMany(
      {
        business: businessId,
        date: { $gte: closure.startDate, $lte: closure.endDate },
        status: { $in: ['booked', 'confirmed'] }
      },
      {
        status: 'cancelled',
        cancellationReason: `Business temporarily closed: ${closure.reason}`
      }
    );

    res.json({
      success: true,
      message: "Temporary closure confirmed and appointments cancelled",
      cancelledCount: cancelledAppointments.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add temporary break
router.post("/businesses/:businessId/temporary-break", async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date, startTime, endTime, reason } = req.body;


    if (!date || !startTime || !endTime || !reason) {
      return res.status(400).json({ 
        error: "Date, start time, end time, and reason are required" 
      });
    }

    const appointmentQuery = {
      business: businessId,
      date: date,
      time: { $gte: startTime, $lt: endTime },
      status: { $in: ['booked', 'confirmed'] }
    };

    // Find affected appointments
    const affectedAppointments = await Appointment.find(appointmentQuery).populate('client service');

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Add temporary break
    business.temporaryBreaks.push({
      date,
      startTime,
      endTime,
      reason,
      createdAt: new Date()
    });

    await business.save();


    res.json({
      success: true,
      message: "Temporary break added successfully",
      affectedAppointments,
      break: business.temporaryBreaks[business.temporaryBreaks.length - 1]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm temporary break and cancel appointments
router.post("/businesses/:businessId/confirm-break/:breakId", async (req, res) => {
  try {
    const { businessId, breakId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const tempBreak = business.temporaryBreaks.id(breakId);
    if (!tempBreak) {
      return res.status(404).json({ error: "Break not found" });
    }

    // Cancel all affected appointments
    const cancelledAppointments = await Appointment.updateMany(
      {
        business: businessId,
        date: tempBreak.date,
        time: { $gte: tempBreak.startTime, $lt: tempBreak.endTime },
        status: { $in: ['booked', 'confirmed'] }
      },
      {
        status: 'cancelled',
        cancellationReason: `Business temporarily closed: ${tempBreak.reason}`
      }
    );

    res.json({
      success: true,
      message: "Temporary break confirmed and appointments cancelled",
      cancelledCount: cancelledAppointments.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get affected appointments for preview
router.get("/businesses/:businessId/affected-appointments", async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate, date, startTime, endTime } = req.query;


    let query = {
      business: businessId,
      status: { $in: ['booked', 'confirmed'] }
    };

    if (startDate && endDate) {
      // For closures
      query.date = { $gte: startDate, $lte: endDate };
    } else if (date && startTime && endTime) {
      // For breaks
      query.date = date;
      query.time = { $gte: startTime, $lt: endTime };
    } else {
      return res.status(400).json({ 
        error: "Either date range or specific date with time range required" 
      });
    }


    const appointments = await Appointment.find(query)
      .populate('client service')
      .sort({ date: 1, time: 1 });


    res.json({
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete temporary closure
router.delete("/businesses/:businessId/temporary-closure/:closureId", async (req, res) => {
  try {
    const { businessId, closureId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    business.temporaryClosures.id(closureId).deleteOne();
    await business.save();

    res.json({
      success: true,
      message: "Temporary closure removed successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete temporary break
router.delete("/businesses/:businessId/temporary-break/:breakId", async (req, res) => {
  try {
    const { businessId, breakId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    business.temporaryBreaks.id(breakId).deleteOne();
    await business.save();

    res.json({
      success: true,
      message: "Temporary break removed successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get business working hours and temporary schedules
router.get("/businesses/:businessId/schedule", async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json({
      success: true,
      workingHours: business.workingHours,
      temporaryClosures: business.temporaryClosures,
      temporaryBreaks: business.temporaryBreaks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
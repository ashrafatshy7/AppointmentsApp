// routes/workingHours.js
const express = require("express");
const router = express.Router();
const Business = require("../models/business");
const Appointment = require("../models/appointment");

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/working-hours:
 *   put:
 *     summary: Update business working hours
 *     description: Updates the regular working hours for a business.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workingHours:
 *                 type: object
 *                 description: The working hours object for the business.
 *     responses:
 *       200:
 *         description: Working hours updated successfully.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/temporary-closure:
 *   post:
 *     summary: Add a temporary closure
 *     description: Adds a temporary closure for a business and shows affected appointments.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Temporary closure added successfully.
 *       400:
 *         description: Missing required fields.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/confirm-closure/{closureId}:
 *   post:
 *     summary: Confirm temporary closure and cancel appointments
 *     description: Confirms a temporary closure and cancels all appointments within that period.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: closureId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Closure confirmed and appointments cancelled.
 *       404:
 *         description: Business or closure not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/temporary-break:
 *   post:
 *     summary: Add a temporary break
 *     description: Adds a temporary break for a business on a specific date and time.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Temporary break added successfully.
 *       400:
 *         description: Missing required fields.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/confirm-break/{breakId}:
 *   post:
 *     summary: Confirm temporary break and cancel appointments
 *     description: Confirms a temporary break and cancels all appointments within that period.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: breakId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Break confirmed and appointments cancelled.
 *       404:
 *         description: Business or break not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/affected-appointments:
 *   get:
 *     summary: Get affected appointments for a closure or break
 *     description: Previews which appointments will be affected by a potential temporary closure or break.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of affected appointments.
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/temporary-closure/{closureId}:
 *   delete:
 *     summary: Delete a temporary closure
 *     description: Removes a temporary closure from a business's schedule.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: closureId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Temporary closure removed successfully.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/temporary-break/{breakId}:
 *   delete:
 *     summary: Delete a temporary break
 *     description: Removes a temporary break from a business's schedule.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: breakId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Temporary break removed successfully.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /api/working-hours/businesses/{businessId}/schedule:
 *   get:
 *     summary: Get business working hours and temporary schedules
 *     description: Retrieves a business's regular working hours, temporary closures, and breaks.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business.
 *     responses:
 *       200:
 *         description: Schedule data retrieved successfully.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
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
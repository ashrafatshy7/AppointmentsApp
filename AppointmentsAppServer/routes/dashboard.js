// routes/dashboard.js 
const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const dayjs = require("dayjs");

// Get business dashboard counts only
router.get("/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Get current date info
    const now = dayjs();
    const today = now.format("YYYY-MM-DD");
    const startOfMonth = now.startOf('month').format("YYYY-MM-DD");
    const endOfMonth = now.endOf('month').format("YYYY-MM-DD");
    
    // Count today's upcoming appointments (booked appointments for today)
    const todayUpcomingCount = await Appointment.countDocuments({ 
      business: businessId, 
      date: today,
      status: 'booked'
    });
    
    // Count today's completed appointments
    const todayCompletedCount = await Appointment.countDocuments({ 
      business: businessId, 
      date: today,
      status: 'completed'
    });
    
    // Count remaining appointments this month (from today to end of month)
    const remainingThisMonthCount = await Appointment.countDocuments({ 
      business: businessId,
      date: { $gte: today, $lte: endOfMonth },
      status: 'booked'
    });
    
    // Count completed appointments this month
    const completedThisMonthCount = await Appointment.countDocuments({ 
      business: businessId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'completed'
    });
    
    // Count all booked and completed appointments this month (excluding canceled)
    const totalBookedAndCompletedThisMonth = await Appointment.countDocuments({ 
      business: businessId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $in: ['booked', 'completed'] }
    });
    
    const dashboardData = {
      todayUpcomingCount,
      todayCompletedCount,
      remainingThisMonthCount,
      totalThisMonthCount: totalBookedAndCompletedThisMonth,
      completedThisMonthCount
    };
    
    console.log('Dashboard counts:', dashboardData);
    res.json(dashboardData);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
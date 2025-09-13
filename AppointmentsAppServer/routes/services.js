const express = require("express");
const router = express.Router();
const Service = require("../models/service");
const User = require("../models/user");

// Authentication middleware to extract business ID from token
const authenticateAndGetBusiness = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Extract user ID from token (following existing auth pattern)
    const tokenParts = authorization.replace("Bearer ", "").split("_");
    if (tokenParts.length < 2) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = tokenParts[1];
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.businessId) {
      return res.status(403).json({ error: "User not associated with any business" });
    }

    // Store business ID in request for use in routes
    req.businessId = user.businessId;
    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Create a new service
// POST /api/services/create
// Creates a new service for a business
router.post("/create", async (req, res) => {
  try {
    const service = new Service(req.body);
    const saved = await service.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all services for a specific business
// GET /api/services/business/:businessId
// Returns all services offered by a business
router.get("/business/:businessId", async (req, res) => {
  try {
    const services = await Service.find({ business: req.params.businessId });
    
    // Transform services to include full image URLs if images exist
    const transformedServices = services.map(service => {
      const transformedService = service.toObject();
      
      // Construct full image URL if image exists
      if (transformedService.image) {
        transformedService.image = `http://10.0.0.109:3000${transformedService.image}`;
      }
      
      return transformedService;
    });
    
    res.json(transformedServices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single service by ID
// GET /api/services/:id
// Returns service details
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a service
// PUT /api/services/:id
// Updates service information (with authorization check)
router.put("/:id", authenticateAndGetBusiness, async (req, res) => {
  try {
    // First check if service exists and get its business ID
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Check if the requesting business owns this service
    if (service.business.toString() !== req.businessId.toString()) {
      return res.status(403).json({ 
        error: "Unauthorized", 
        message: "You can only modify services belonging to your business" 
      });
    }

    // Proceed with update
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    
    console.log(`✅ Service updated: ${updated.name} by business ${req.businessId}`);
    res.json(updated);
  } catch (err) {
    console.error('❌ Service update error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Delete a service
// DELETE /api/services/:id
// Removes service from database (with authorization check)
router.delete("/:id", authenticateAndGetBusiness, async (req, res) => {
  try {
    // First check if service exists and get its business ID
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Check if the requesting business owns this service
    if (service.business.toString() !== req.businessId.toString()) {
      return res.status(403).json({ 
        error: "Unauthorized", 
        message: "You can only delete services belonging to your business" 
      });
    }

    // Proceed with deletion
    const deleted = await Service.findByIdAndDelete(req.params.id);
    
    console.log(`🗑️ Service deleted: ${deleted.name} by business ${req.businessId}`);
    res.json({ 
      message: "Service deleted successfully",
      deletedService: {
        id: deleted._id,
        name: deleted.name
      }
    });
  } catch (err) {
    console.error('❌ Service delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

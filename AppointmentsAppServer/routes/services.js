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

/**
 * @openapi
 * /api/services/create:
 *   post:
 *     summary: Create a new service
 *     description: Creates a new service for a business.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       201:
 *         description: Service created successfully.
 *       400:
 *         description: Invalid request body.
 */
router.post("/create", async (req, res) => {
  try {
    const service = new Service(req.body);
    const saved = await service.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/services/business/{businessId}:
 *   get:
 *     summary: Get all services for a specific business
 *     description: Retrieves all services offered by a specific business.
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business.
 *     responses:
 *       200:
 *         description: A list of services.
 *       500:
 *         description: Internal server error.
 */
router.get("/business/:businessId", async (req, res) => {
  try {
    const services = await Service.find({ business: req.params.businessId });
    
    // Transform services to include full image URLs if images exist
    const transformedServices = services.map(service => {
      const transformedService = service.toObject();
      
      // Construct full image URL if image exists
      if (transformedService.image) {
        transformedService.image = `http://10.0.0.6:3000${transformedService.image}`;
      }
      
      return transformedService;
    });
    
    res.json(transformedServices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/services/{id}:
 *   get:
 *     summary: Get a single service by ID
 *     description: Retrieves the details of a single service by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service.
 *     responses:
 *       200:
 *         description: The requested service.
 *       404:
 *         description: Service not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/services/{id}:
 *   put:
 *     summary: Update a service
 *     description: Updates the details of a specific service. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: The updated service.
 *       400:
 *         description: Invalid request body.
 *       401:
 *         description: Unauthorized, token is invalid or missing.
 *       403:
 *         description: Forbidden, user cannot modify this service.
 *       404:
 *         description: Service not found.
 */
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

/**
 * @openapi
 * /api/services/{id}:
 *   delete:
 *     summary: Delete a service
 *     description: Deletes a specific service. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service to delete.
 *     responses:
 *       200:
 *         description: Service deleted successfully.
 *       401:
 *         description: Unauthorized, token is invalid or missing.
 *       403:
 *         description: Forbidden, user cannot delete this service.
 *       404:
 *         description: Service not found.
 *       500:
 *         description: Internal server error.
 */
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

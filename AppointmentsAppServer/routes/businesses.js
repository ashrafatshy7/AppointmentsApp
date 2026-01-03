const express = require("express");
const router = express.Router();
const Business = require("../models/business");

/**
 * @openapi
 * /api/businesses/signup:
 *   post:
 *     summary: Create a new business
 *     description: Creates a new business profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Business'
 *     responses:
 *       201:
 *         description: Business created successfully.
 *       400:
 *         description: Invalid request body.
 */
router.post("/signup", async (req, res) => {
  try {
    const business = new Business(req.body);
    await business.save();
    res.status(201).json(business);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/businesses/{id}/addBusiness:
 *   post:
 *     summary: Add services to an existing business
 *     description: Updates business details and adds new services to an existing business.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               services:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: Business updated successfully.
 *       400:
 *         description: Invalid request body.
 *       404:
 *         description: Business not found.
 */
router.post("/:id/addBusiness", async (req, res) => {
  try {
    const { id } = req.params; // Get business ID from URL
    const { services, ...updateData } = req.body;

    // Find and update existing business
    const business = await Business.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Add services to existing business
    if (services && services.length > 0) {
      const Service = require("../models/service");

      const servicePromises = services.map((service) => {
        const newService = new Service({
          ...service,
          business: business._id, // Use existing business ID
        });
        return newService.save();
      });

      const savedServices = await Promise.all(servicePromises);
      business.services = [
        ...(business.services || []),
        ...savedServices.map((s) => s._id),
      ];
      await business.save();
    }

    res.json(business);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/businesses:
 *   get:
 *     summary: Get all businesses
 *     description: Retrieves a list of all businesses.
 *     responses:
 *       200:
 *         description: A list of businesses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 *       500:
 *         description: Internal server error.
 */
router.get("/", async (req, res) => {
  try {
    const businesses = await Business.find();
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/businesses/category/{category}:
 *   get:
 *     summary: Get businesses by category with pagination
 *     description: Retrieves a paginated list of businesses within a specific category.
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: The category to filter by.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *     responses:
 *       200:
 *         description: A paginated list of businesses.
 *       500:
 *         description: Internal server error.
 */
router.get("/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = 10;
    const skip = (page - 1) * limit;

    const businesses = await Business.find({ category })
      .skip(skip)
      .limit(limit);

    res.json(businesses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/businesses/city/{city}:
 *   get:
 *     summary: Get businesses by city
 *     description: Retrieves businesses located in a specific city, returning minimal data and working hours for the current day.
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: The city to search for businesses in.
 *     responses:
 *       200:
 *         description: A list of businesses in the specified city.
 *       400:
 *         description: City parameter is required.
 *       500:
 *         description: Internal server error.
 */
router.get("/city/:city", async (req, res) => {
      try {
      const { city } = req.params;
      if (!city) {
      return res.status(400).json({ error: "City parameter is required" });
    }

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const currentDay = new Date().getDay();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayName = dayNames[currentDay];

    // Find businesses in the specified city
    const businesses = await Business.find({ 
      'address.city': { $regex: new RegExp(city, 'i') } // Case-insensitive search on address.city
    }).select('name profileImage category address workingHours');

    // Transform the data to include only required fields and current day working hours
    const transformedBusinesses = businesses.map(business => {
      const workingHours = business.workingHours || {};
      const todayHours = workingHours[currentDayName] || {};
      
      return {
        id: business._id,
        name: business.name,
        profileImage: business.profileImage ? `http://10.0.0.6:3000${business.profileImage}` : null,
        category: business.category,
        city: business.address?.city,
        workingHours: todayHours && todayHours.open && todayHours.close ? {
          open: todayHours.open,
          close: todayHours.close
        } : null
      };
    });

    res.json({
      success: true,
      businesses: transformedBusinesses,
      count: transformedBusinesses.length
    });

  } catch (err) {
    console.error('Error fetching businesses by city:', err);
    res.status(500).json({ 
      error: "Failed to fetch businesses",
      details: err.message 
    });
  }
});

/**
 * @openapi
 * /api/businesses/details/{id}:
 *   get:
 *     summary: Get business details by ID (excluding working hours)
 *     description: Retrieves detailed information for a specific business, excluding the full working hours schedule.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business.
 *     responses:
 *       200:
 *         description: Detailed business information.
 *       400:
 *         description: Business ID parameter is required.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Business ID parameter is required" });
    }

    // Find business by ID, excluding workingHours field
    const business = await Business.findById(id).select('-workingHours');

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Transform the data to include full URLs for images
    const transformedBusiness = {
      id: business._id,
      name: business.name,
      profileImage: business.profileImage ? `http://10.0.0.6:3000${business.profileImage}` : null,
      coverImage: business.coverImage ? `http://10.0.0.6:3000${business.coverImage}` : null,
      category: business.category,
      ownerName: business.ownerName,
      ownerPhone: business.ownerPhone,
      businessPhone: business.businessPhone,
      address: business.address,
      location: business.location,
      bio: business.about || `Welcome to ${business.name}! We provide excellent ${business.category} services.`,
      gallery: business.gallery ? business.gallery.map(item => {
        // Handle both string and object gallery items
        if (typeof item === 'string') {
          return {
            path: item,
            order: 0
          };
        } else if (item && typeof item === 'object' && item.path) {
          return {
            path: item.path,
            order: item.order || 0,
            _id: item._id
          };
        }
        return null;
      }).filter(Boolean) : [],
      services: business.services,
      temporaryClosures: business.temporaryClosures,
      temporaryBreaks: business.temporaryBreaks
    };

    res.json({
      success: true,
      business: transformedBusiness
    });

  } catch (err) {
    console.error('Error fetching business details:', err);
    res.status(500).json({ 
      error: "Failed to fetch business details",
      details: err.message 
    });
  }
});

/**
 * @openapi
 * /api/businesses/hours/{id}:
 *   get:
 *     summary: Get business working hours by ID
 *     description: Retrieves the working hours schedule for a specific business.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business.
 *     responses:
 *       200:
 *         description: The working hours of the business.
 *       400:
 *         description: Business ID parameter is required.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/hours/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Business ID parameter is required" });
    }

    // Find business by ID, only select workingHours
    const business = await Business.findById(id).select('workingHours');

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json({
      success: true,
      workingHours: business.workingHours || {}
    });

  } catch (err) {
    console.error('Error fetching business working hours:', err);
    res.status(500).json({ 
      error: "Failed to fetch business working hours",
      details: err.message 
    });
  }
});

/**
 * @openapi
 * /api/businesses/nearby:
 *   get:
 *     summary: Get nearby businesses
 *     description: Finds nearby businesses based on geographical coordinates or filters by town if coordinates are not provided.
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for the search.
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for the search.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category to filter by.
 *       - in: query
 *         name: town
 *         schema:
 *           type: string
 *         description: Town to filter by if location is not available.
 *     responses:
 *       200:
 *         description: A list of nearby businesses.
 *       500:
 *         description: Internal server error.
 */
router.get("/nearby", async (req, res) => {
  const { lat, lng, category, town } = req.query;
  const hasLocation = lat && lng;

  try {
    let businesses;

    if (hasLocation) {
      businesses = await Business.find({
        category,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: 10000, // 10 km
          },
        },
      }).limit(10);
    } else {
      businesses = await Business.aggregate([
        { $match: { category, "location.town": town } },
        { $sample: { size: 10 } },
      ]);
    }

    res.json(businesses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/businesses/{id}:
 *   get:
 *     summary: Get a single business by ID
 *     description: Retrieves a single business by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business.
 *     responses:
 *       200:
 *         description: The requested business.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:id", async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: "Business not found" });
    res.json(business);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/businesses/{id}:
 *   put:
 *     summary: Update a business
 *     description: Updates the information for a specific business.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Business'
 *     responses:
 *       200:
 *         description: The updated business.
 *       400:
 *         description: Invalid request body.
 *       404:
 *         description: Business not found.
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Business.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Business not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/businesses/{id}:
 *   delete:
 *     summary: Delete a business
 *     description: Permanently removes a business from the database.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business to delete.
 *     responses:
 *       200:
 *         description: Business deleted successfully.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Internal server error.
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Business.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Business not found" });
    res.json({ message: "Business deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/businesses/link-user:
 *   post:
 *     summary: Link a user to a business
 *     description: Associates a user account with a business by adding the business ID to the user's profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user.
 *               businessId:
 *                 type: string
 *                 description: The ID of the business.
 *     responses:
 *       200:
 *         description: User linked successfully.
 *       400:
 *         description: Invalid request body.
 *       404:
 *         description: User not found.
 */
router.post("/link-user", async (req, res) => {
  try {
    const { userId, businessId } = req.body;

    // Update user with business ID
    const user = await User.findByIdAndUpdate(
      userId,
      { businessId },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

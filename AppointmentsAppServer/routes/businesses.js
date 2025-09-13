const express = require("express");
const router = express.Router();
const Business = require("../models/business");

// Create a new business
// POST /api/businesses/signup
// Creates a new business profile
router.post("/signup", async (req, res) => {
  try {
    const business = new Business(req.body);
    await business.save();
    res.status(201).json(business);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add services to an existing business
// POST /api/businesses/:id/addBusiness
// Updates business details and adds new services
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

// Get all businesses
// GET /api/businesses
// Returns all businesses
router.get("/", async (req, res) => {
  try {
    const businesses = await Business.find();
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get businesses by category with pagination
// GET /api/businesses/category/:category?page=1
// Returns paginated list of businesses in a category (10 per page)
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

// Get businesses by city
// GET /api/businesses/city/:city
// Returns businesses in a specific city with minimal data
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
        profileImage: business.profileImage ? `http://10.0.0.109:3000${business.profileImage}` : null,
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

// Get business details by ID (excluding working hours)
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
      profileImage: business.profileImage ? `http://10.0.0.109:3000${business.profileImage}` : null,
      coverImage: business.coverImage ? `http://10.0.0.109:3000${business.coverImage}` : null,
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

// Get business working hours by ID
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

// Get nearby businesses based on location or town
// GET /api/businesses/nearby?lat=X&lng=Y&category=Z&town=T
// Uses geospatial query if coordinates provided, otherwise filters by town
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

// Get a single business by ID
// GET /api/businesses/:id
// Returns business details
router.get("/:id", async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: "Business not found" });
    res.json(business);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a business
// PUT /api/businesses/:id
// Updates business information
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

// Delete a business
// DELETE /api/businesses/:id
// Removes business from database
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Business.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Business not found" });
    res.json({ message: "Business deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// link businesses with users
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

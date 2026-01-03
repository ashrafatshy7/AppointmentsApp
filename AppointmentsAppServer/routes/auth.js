const express = require("express");
const router = express.Router();
const OTP = require("../models/OTP");
const User = require("../models/user");
const Business = require("../models/business");

/**
 * @openapi
 * /api/auth/check-user-exists:
 *   post:
 *     summary: Check if a user exists
 *     description: Checks if a user account (either client or business) exists for a given phone number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: The user's phone number.
 *     responses:
 *       200:
 *         description: Returns whether the user exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 userExists:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Phone number is required.
 *       500:
 *         description: Internal server error.
 */
router.post("/check-user-exists", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Check if user exists in users collection (client users)
    const user = await User.findOne({ phone });
    
    // Also check if user has a business account (search by owner phone)
    const business = await Business.findOne({ ownerPhone: phone });

    if (user || business) {
      // User exists (either client or business owner) - proceed with login
      res.json({
        success: true,
        userExists: true,
        message: user ? "Client account found, proceeding to OTP verification" : "Business account found, proceeding to OTP verification"
      });
    } else {
      // User doesn't exist in either collection
      res.json({
        success: false,
        userExists: false,
        error: "No account found with this phone number. Please register first."
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/send-otp-client:
 *   post:
 *     summary: Send OTP for client authentication
 *     description: Sends a one-time password (OTP) to a client's phone number for verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: The client's phone number.
 *     responses:
 *       200:
 *         description: OTP sent successfully.
 *       400:
 *         description: Phone number is required.
 *       500:
 *         description: Internal server error.
 */
router.post("/send-otp-client", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Delete any existing OTP for this phone number
    await OTP.deleteMany({ phone });

    // Create new OTP entry with dummy code "111111"
    const otpEntry = new OTP({
      phone,
      otp: "111111", // Dummy OTP for development
    });

    await otpEntry.save();

    // In production, you would send the OTP via SMS here

    res.json({
      success: true,
      message: "OTP sent successfully",
      // Don't send OTP in response
      developmentOTP: "111111",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/verify-otp-client:
 *   post:
 *     summary: Verify OTP for client authentication
 *     description: Verifies the OTP sent to a client's phone number. If successful, it logs in an existing user or signals that a new user needs to register.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 description: The client's phone number.
 *               otp:
 *                 type: string
 *                 description: The one-time password.
 *     responses:
 *       200:
 *         description: OTP verification result.
 *       400:
 *         description: Invalid or expired OTP, or missing parameters.
 *       500:
 *         description: Internal server error.
 */
router.post("/verify-otp-client", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    // Find the OTP entry
    const otpEntry = await OTP.findOne({ phone, otp });
    if (!otpEntry) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpEntry._id });

    // Check if user exists
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      // User exists - proceed with login
      const token = `token_${existingUser._id}_${Date.now()}`;

      res.json({
        success: true,
        isNewUser: false,
        token,
        user: {
          id: existingUser._id,
          phone: existingUser.phone,
          name: existingUser.name,
          role: existingUser.role,
          verified: existingUser.verified,
          email: existingUser.email,
        },
      });
    } else {
      // User doesn't exist - needs to register
      res.json({
        success: true,
        isNewUser: true,
        phone: phone,
        message: "Please complete your registration",
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/register-client:
 *   post:
 *     summary: Register a new client user
 *     description: Creates a new client user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - name
 *             properties:
 *               phone:
 *                 type: string
 *                 description: The new user's phone number.
 *               name:
 *                 type: string
 *                 description: The new user's name.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The new user's email address (optional).
 *     responses:
 *       200:
 *         description: User registered successfully.
 *       400:
 *         description: Missing parameters or user already exists.
 *       500:
 *         description: Internal server error.
 */
router.post("/register-client", async (req, res) => {
  try {
    const { phone, name, email } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: "Phone and name are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "User with this phone number already exists" });
    }

    // Create new client user
    const newUser = new User({
      phone,
      name,
      email: email || undefined,
      role: "client",
      verified: true,
    });

    await newUser.save();

    // Generate token
    const token = `token_${newUser._id}_${Date.now()}`;

    res.json({
      success: true,
      token,
      user: {
        id: newUser._id,
        phone: newUser.phone,
        name: newUser.name,
        role: newUser.role,
        verified: newUser.verified,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Register client error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/send-otp-business:
 *   post:
 *     summary: Send OTP for business authentication
 *     description: Sends an OTP to a business owner's phone number for verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: The business owner's phone number.
 *     responses:
 *       200:
 *         description: OTP sent successfully.
 *       400:
 *         description: Phone number is required or no account found.
 *       500:
 *         description: Internal server error.
 */
router.post("/send-otp-business", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Check if user has a business account (search by owner phone)
    const business = await Business.findOne({ ownerPhone: phone });

    if (!business) {
      return res.status(400).json({ 
        error: "No account found with this phone number. Please register first." 
      });
    }

    // Delete any existing OTP for this phone number
    await OTP.deleteMany({ phone });

    // Create new OTP entry with dummy code "111111"
    const otpEntry = new OTP({
      phone,
      otp: "111111", // Dummy OTP for development
    });

    await otpEntry.save();

    // In production, you would send the OTP via SMS here
    console.log(`OTP for ${phone}: 111111`);

    res.json({
      success: true,
      message: "OTP sent successfully",
      // Don't send OTP in production response
      developmentOTP: "111111",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/verify-otp-business:
 *   post:
 *     summary: Verify OTP for business authentication
 *     description: Verifies the OTP for a business owner. If successful, logs the user in and returns their profile and business data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 description: The business owner's phone number.
 *               otp:
 *                 type: string
 *                 description: The one-time password.
 *     responses:
 *       200:
 *         description: OTP verification successful.
 *       400:
 *         description: Invalid or expired OTP, or missing parameters.
 *       500:
 *         description: Internal server error.
 */
router.post("/verify-otp-business", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    // Find the OTP entry
    const otpEntry = await OTP.findOne({ phone, otp });
    if (!otpEntry) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpEntry._id });

    // Check if user has a business account (search by owner phone)
    const business = await Business.findOne({ ownerPhone: phone });

    if (business) {
      // User has a business account - proceed with login

      // Find or create user
      let user = await User.findOne({ phone });
      if (!user) {
        user = new User({
          phone,
          role: "business_owner",
          verified: true,
          businessId: business._id,
        });
        await user.save();
      } else {
        // Update verification status and link to business
        user.verified = true;
        user.businessId = business._id;
        await user.save();
      }

      // Generate a simple token (in production, use JWT)
      const token = `token_${user._id}_${Date.now()}`;

      res.json({
        success: true,
        hasBusinessAccount: true,
        token,
        user: {
          id: user._id,
          phone: user.phone,
          role: user.role,
          verified: user.verified,
          businessId: user.businessId,
          business: {
            id: business._id,
            name: business.name,
            ownerName: business.ownerName,
            ownerPhone: business.ownerPhone,
            businessPhone: business.businessPhone,
            address: business.address,
            category: business.category,
            profileImage: business.profileImage,
            coverImage: business.coverImage,
            about: business.about,
            workingHours: business.workingHours,
            location: business.location,
            socialMedia: business.socialMedia,
          },
        },
      });
    } else {
      // User doesn't have a business account - needs to create one
      res.json({
        success: true,
        hasBusinessAccount: false,
        phone: phone,
        message: "Please create your business account to continue",
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieves the profile of the currently authenticated user, including their associated business data.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's profile data.
 *       401:
 *         description: Unauthorized, no token provided or invalid token.
 *       404:
 *         description: User or business not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/profile", async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Extract user ID from token (simple implementation)
    const tokenParts = authorization.replace("Bearer ", "").split("_");
    if (tokenParts.length < 2) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = tokenParts[1];
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const business = await Business.findById(user.businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json({
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        businessId: user.businessId,
        business: {
          id: business._id,
          name: business.name,
          ownerName: business.ownerName,
          ownerPhone: business.ownerPhone,
          businessPhone: business.businessPhone,
          address: business.address,
          category: business.category,
          profileImage: business.profileImage,
          coverImage: business.coverImage,
          about: business.about,
          workingHours: business.workingHours,
          location: business.location,
          socialMedia: business.socialMedia,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/cities:
 *   get:
 *     summary: Get Israeli cities
 *     description: Retrieves a list of Israeli cities, currently using a fallback list to avoid external API rate limiting.
 *     responses:
 *       200:
 *         description: A list of Israeli cities.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       english:
 *                         type: string
 *                       hebrew:
 *                         type: string
 *                 source:
 *                   type: string
 */
router.get("/cities", async (req, res) => {
  try {
    // Temporarily disabled external API calls to avoid rate limiting
    // const response = await fetch('https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=IL&limit=100&sort=-population', {
    //   headers: {
    //     'X-RapidAPI-Key': 'demo',
    //     'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
    //   }
    // });
    
    // For now, just return fallback cities to avoid rate limiting issues
    console.log("Using fallback cities to avoid rate limiting");
    
    const fallbackCities = [
      { english: 'Isfiya', hebrew: 'עספיא'},
      { english: 'Tel Aviv', hebrew: 'תל אביב'},
      { english: 'Jerusalem', hebrew: 'ירושלים'},
      { english: 'Haifa', hebrew: 'חיפה'},
      { english: 'Rishon LeZion', hebrew: 'ראשון לציון' },
      { english: 'Petah Tikva', hebrew: 'פתח תקווה'},
      { english: 'Ashdod', hebrew: 'אשדוד' },
      { english: 'Netanya', hebrew: 'נתניה' },
      { english: 'Beer Sheva', hebrew: 'באר שבע' },
      { english: 'Holon', hebrew: 'חולון' },
      { english: 'Bnei Brak', hebrew: 'בני ברק' },
      { english: 'Ramat Gan', hebrew: 'רמת גן' },
      { english: 'Bat Yam', hebrew: 'בת ים' },
      { english: 'Ashkelon', hebrew: 'אשקלון'},
      { english: 'Kfar Saba', hebrew: 'כפר סבא'},
      { english: 'Herzliya', hebrew: 'הרצליה'}
    ];
    
    return res.json({
      success: true,
      cities: fallbackCities,
      source: 'fallback_direct'
    });
    
    if (!response.ok) {
      // Handle rate limiting and other API errors gracefully
      if (response.status === 429) {
        console.log("Rate limit exceeded for external cities API, using fallback cities");
        // Return fallback cities instead of error
        const fallbackCities = [
          { english: 'Tel Aviv', hebrew: 'תל אביב', latitude: 32.0853, longitude: 34.7818, population: 460613 },
          { english: 'Jerusalem', hebrew: 'ירושלים', latitude: 31.7683, longitude: 35.2137, population: 936047 },
          { english: 'Haifa', hebrew: 'חיפה', latitude: 32.7940, longitude: 34.9896, population: 285316 },
          { english: 'Rishon LeZion', hebrew: 'ראשון לציון', latitude: 31.9700, longitude: 34.8000, population: 254384 },
          { english: 'Petah Tikva', hebrew: 'פתח תקווה', latitude: 32.0870, longitude: 34.8870, population: 248005 },
          { english: 'Ashdod', hebrew: 'אשדוד', latitude: 31.8000, longitude: 34.6500, population: 225939 },
          { english: 'Netanya', hebrew: 'נתניה', latitude: 32.3320, longitude: 34.8600, population: 217244 },
          { english: 'Beer Sheva', hebrew: 'באר שבע', latitude: 31.2518, longitude: 34.7913, population: 209687 },
          { english: 'Holon', hebrew: 'חולון', latitude: 32.0167, longitude: 34.7667, population: 194273 },
          { english: 'Bnei Brak', hebrew: 'בני ברק', latitude: 32.0833, longitude: 34.8333, population: 193774 },
          { english: 'Ramat Gan', hebrew: 'רמת גן', latitude: 32.0700, longitude: 34.8200, population: 169053 },
          { english: 'Bat Yam', hebrew: 'בת ים', latitude: 32.0230, longitude: 34.7500, population: 128979 },
          { english: 'Ashkelon', hebrew: 'אשקלון', latitude: 31.6700, longitude: 34.5700, population: 144073 },
          { english: 'Kfar Saba', hebrew: 'כפר סבא', latitude: 32.1750, longitude: 34.9070, population: 100042 },
          { english: 'Herzliya', hebrew: 'הרצליה', latitude: 32.1667, longitude: 34.8333, population: 94834 }
        ];
        
        return res.json({
          success: true,
          cities: fallbackCities,
          source: 'fallback'
        });
      }
      
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid API response format');
    }
    
    // Transform the API response to match our expected format
    const cities = data.data.map(city => ({
      english: city.name,
      hebrew: city.name, // External API doesn't provide Hebrew names
      latitude: city.latitude,
      longitude: city.longitude,
      population: city.population || 0,
      geonameId: city.id
    })).sort((a, b) => a.english.localeCompare(b.english));

    console.log(`Fetched ${cities.length} Israeli cities from external API`);

    res.json({
      success: true,
      cities: cities,
      source: 'external_api'
    });
  } catch (error) {
    console.error("Error fetching cities dynamically:", error);
    
    // Provide fallback cities instead of error
    const fallbackCities = [
      { english: 'Tel Aviv', hebrew: 'תל אביב', latitude: 32.0853, longitude: 34.7818, population: 460613 },
      { english: 'Jerusalem', hebrew: 'ירושלים', latitude: 31.7683, longitude: 35.2137, population: 936047 },
      { english: 'Haifa', hebrew: 'חיפה', latitude: 32.7940, longitude: 34.9896, population: 285316 },
      { english: 'Rishon LeZion', hebrew: 'ראשון לציון', latitude: 32.1750, longitude: 34.8000, population: 254384 },
      { english: 'Petah Tikva', hebrew: 'פתח תקווה', latitude: 32.0870, longitude: 34.8870, population: 248005 },
      { english: 'Ashdod', hebrew: 'אשדוד', latitude: 32.8000, longitude: 34.6500, population: 225939 },
      { english: 'Netanya', hebrew: 'נתניה', latitude: 32.3320, longitude: 34.8600, population: 217244 },
      { english: 'Beer Sheva', hebrew: 'באר שבע', latitude: 31.2518, longitude: 34.7913, population: 209687 },
      { english: 'Holon', hebrew: 'חולון', latitude: 32.0167, longitude: 34.7667, population: 194273 },
      { english: 'Bnei Brak', hebrew: 'בני ברק', latitude: 32.0833, longitude: 34.8333, population: 193774 },
      { english: 'Ramat Gan', hebrew: 'רמת גן', latitude: 32.0700, longitude: 34.8200, population: 169053 },
      { english: 'Bat Yam', hebrew: 'בת ים', latitude: 32.0230, longitude: 34.7500, population: 128979 },
      { english: 'Ashkelon', hebrew: 'אשקלון', latitude: 31.6700, longitude: 34.5700, population: 144073 },
      { english: 'Kfar Saba', hebrew: 'כפר סבא', latitude: 32.1750, longitude: 34.9070, population: 100042 },
      { english: 'Herzliya', hebrew: 'הרצליה', latitude: 32.1667, longitude: 34.8333, population: 94834 }
    ];
    
    res.json({
      success: true,
      cities: fallbackCities,
      source: 'fallback_error'
    });
  }
});

/**
 * @openapi
 * /api/auth/create-business:
 *   post:
 *     summary: Create a business account
 *     description: Creates a new business account and a corresponding business owner user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - ownerName
 *               - ownerPhone
 *               - businessPhone
 *               - city
 *               - street
 *               - buildingNumber
 *               - category
 *             properties:
 *               businessName:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               ownerPhone:
 *                 type: string
 *               businessPhone:
 *                 type: string
 *               city:
 *                 type: string
 *               street:
 *                 type: string
 *               buildingNumber:
 *                 type: string
 *               category:
 *                 type: string
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Business account created successfully.
 *       400:
 *         description: Missing required fields or business already exists.
 *       500:
 *         description: Internal server error.
 */
router.post("/create-business", async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      ownerPhone, // Owner's phone (used for login)
      businessPhone, // Business contact phone
      city,
      street,
      buildingNumber,
      category,
      coordinates, // Optional: [longitude, latitude]
    } = req.body;

    // Validate required fields
    if (
      !businessName ||
      !ownerName ||
      !ownerPhone ||
      !businessPhone ||
      !city ||
      !street ||
      !buildingNumber ||
      !category
    ) {
      return res.status(400).json({
        error:
          "Business name, owner name, owner phone, business phone, city, street, building number, and category are required",
      });
    }

    // Check if business with this owner phone already exists
    const existingBusiness = await Business.findOne({ ownerPhone });
    if (existingBusiness) {
      return res.status(400).json({
        error: "A business with this owner phone number already exists",
      });
    }

    // Create business object
    const businessData = {
      name: businessName,
      ownerName: ownerName,
      ownerPhone,
      businessPhone,
      category,
      address: {
        city,
        street,
        buildingNumber,
      },
    };

    // Add coordinates only if provided and valid
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      businessData.location = {
        type: "Point",
        coordinates: coordinates,
      };
    }

    console.log("About to create business with data:", JSON.stringify(businessData, null, 2));
    const business = new Business(businessData);
    console.log("Business model created, about to save...");
    const savedBusiness = await business.save();
    console.log("Business saved successfully with ID:", savedBusiness._id);

    // Create or update user (linked by owner phone)
    let user = await User.findOne({ phone: ownerPhone });
    if (!user) {
      user = new User({
        phone: ownerPhone,
        role: "business_owner",
        verified: true,
        businessId: business._id,
        name: ownerName,
      });
      await user.save();
    } else {
      // Update existing user
      user.role = "business_owner";
      user.verified = true;
      user.businessId = business._id;
      user.name = ownerName;
      await user.save();
    }

    // Generate token
    const token = `token_${user._id}_${Date.now()}`;

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        verified: user.verified,
        businessId: user.businessId,
        business: {
          id: business._id,
          name: business.name,
          ownerName: business.ownerName,
          ownerPhone: business.ownerPhone,
          businessPhone: business.businessPhone,
          address: business.address,
          category: business.category,
          location: business.location,
        },
      },
    });
  } catch (err) {
    console.error("Create business error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

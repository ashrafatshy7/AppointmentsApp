const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Business = require("../models/business");
const User = require("../models/user");

// Ensure businesses directory exists
const businessesDir = path.join(__dirname, "../public/businesses");
if (!fs.existsSync(businessesDir)) {
  fs.mkdirSync(businessesDir, { recursive: true });
}

// Ensure users directory exists
const usersDir = path.join(__dirname, "../public/users");
if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir, { recursive: true });
}

// Helper function to ensure business folder structure exists
const ensureBusinessFolderStructure = (businessId) => {
  const businessDir = path.join(__dirname, "../public/businesses", businessId);
  const galleryDir = path.join(businessDir, "gallery");
  
  if (!fs.existsSync(businessDir)) {
    fs.mkdirSync(businessDir, { recursive: true });
  }
  
  if (!fs.existsSync(galleryDir)) {
    fs.mkdirSync(galleryDir, { recursive: true });
  }
  
  return { businessDir, galleryDir };
};

// Helper for user folder
const ensureUserFolder = (userId) => {
  const userDir = path.join(__dirname, "../public/users", userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return { userDir };
};

// Use memory storage to avoid timing issues with req.body
const businessLogoUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @openapi
 * /api/image-upload/business-logo:
 *   post:
 *     summary: Upload a business logo
 *     description: Uploads a profile logo for a business. Expects multipart/form-data.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: The logo file to upload.
 *               businessId:
 *                 type: string
 *                 description: The ID of the business.
 *     responses:
 *       201:
 *         description: Logo uploaded successfully.
 *       400:
 *         description: No file uploaded or business ID is missing.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Failed to upload logo.
 */
router.post("/business-logo", businessLogoUpload.single("logo"), async (req, res) => {
  console.log("🚀🚀🚀 BUSINESS LOGO UPLOAD ROUTE HIT - UPDATED VERSION 🚀🚀🚀");
  console.log("aaaaaaaaaaa");
  
  try {
    console.log("Request details:", {
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      bodyKeys: Object.keys(req.body),
      businessId: req.body.businessId,
      allBody: req.body
    });

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No logo file uploaded" });
    }

    const { businessId } = req.body;
    console.log("businessId", businessId);
    if (!businessId) {
      console.log("❌ No businessId provided");
      return res.status(400).json({ error: "Business ID is required" });
    }

    console.log("✅ File and businessId validated, proceeding...");

    // Create the proper directory structure
    const { businessDir } = ensureBusinessFolderStructure(businessId);
    
    // Get file extension and create filename
    const ext = path.extname(req.file.originalname);
    const filename = `profile${ext}`;
    const filePath = path.join(businessDir, filename);
    
    console.log('Saving file to:', filePath);
    
    // Write the file from memory buffer to disk
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Construct the logo URL (relative path from /businesses/)
    const logoUrl = `/businesses/${businessId}/${filename}`;
    console.log('logoUrl constructed:', logoUrl);
    
    // Update the business profile with the new logo URL
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { 
        profileImage: logoUrl,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedBusiness) {
      return res.status(404).json({ error: "Business not found" });
    }

    console.log(`✅ Business logo updated for business ${businessId}: ${logoUrl}`);

    res.status(201).json({ 
      success: true,
      message: "Business logo uploaded and profile updated successfully",
      logoUrl: logoUrl,
      business: {
        id: updatedBusiness._id,
        name: updatedBusiness.name,
        profileImage: updatedBusiness.profileImage
      }
    });

  } catch (error) {
    console.error("❌ Error uploading business logo:", error);
    res.status(500).json({ error: "Failed to upload business logo" });
  }
});

/**
 * @openapi
 * /api/image-upload/business-cover:
 *   post:
 *     summary: Upload a business cover photo
 *     description: Uploads a cover photo for a business. Expects multipart/form-data.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: The cover photo file to upload.
 *               businessId:
 *                 type: string
 *                 description: The ID of the business.
 *     responses:
 *       201:
 *         description: Cover photo uploaded successfully.
 *       400:
 *         description: No file uploaded or business ID is missing.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Failed to upload cover photo.
 */
router.post("/business-cover", businessLogoUpload.single("cover"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No cover photo file uploaded" });
    }

    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "Business ID is required" });
    }

    // Create the proper directory structure
    const { businessDir } = ensureBusinessFolderStructure(businessId);
    
    // Get file extension and create filename
    const ext = path.extname(req.file.originalname);
    const filename = `cover${ext}`;
    const filePath = path.join(businessDir, filename);
    
    // Write the file from memory buffer to disk
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Construct the cover photo URL (relative path from /businesses/)
    const coverUrl = `/businesses/${businessId}/${filename}`;
    
    // Update the business profile with the new cover photo URL
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { 
        coverImage: coverUrl,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedBusiness) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.status(201).json({ 
      success: true,
      message: "Business cover photo uploaded and profile updated successfully",
      coverUrl: coverUrl,
      business: {
        id: updatedBusiness._id,
        name: updatedBusiness.name,
        coverImage: updatedBusiness.coverImage
      }
    });

  } catch (error) {
    console.error("Error uploading business cover photo:", error);
    res.status(500).json({ error: "Failed to upload business cover photo" });
  }
});

/**
 * @openapi
 * /api/image-upload/user-profile:
 *   post:
 *     summary: Upload a user profile avatar
 *     description: Uploads a profile avatar for a user. Expects multipart/form-data.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: The avatar file to upload.
 *               userId:
 *                 type: string
 *                 description: The ID of the user.
 *     responses:
 *       201:
 *         description: Avatar uploaded successfully.
 *       400:
 *         description: No file uploaded or user ID is missing.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Failed to upload avatar.
 */
router.post("/user-profile", businessLogoUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No avatar file uploaded" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { userDir } = ensureUserFolder(userId);
    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = `profile${ext}`;
    const filePath = path.join(userDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const profileUrl = `/users/${userId}/${filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: profileUrl, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(201).json({
      success: true,
      message: "User profile image uploaded successfully",
      profileUrl,
      user: { id: updatedUser._id, profileImage: updatedUser.profileImage }
    });
  } catch (error) {
    console.error("Error uploading user profile:", error);
    res.status(500).json({ error: "Failed to upload user profile" });
  }
});

/**
 * @openapi
 * /api/image-upload/gallery-image:
 *   post:
 *     summary: Upload a gallery image for a business
 *     description: Uploads an image to a business's gallery. Expects multipart/form-data.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The gallery image file to upload.
 *               businessId:
 *                 type: string
 *                 description: The ID of the business.
 *     responses:
 *       201:
 *         description: Gallery image uploaded successfully.
 *       400:
 *         description: No file uploaded or business ID is missing.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Failed to upload gallery image.
 */
router.post("/gallery-image", businessLogoUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No gallery image file uploaded" });
    }

    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "Business ID is required" });
    }

    // Create the proper directory structure
    const { businessDir, galleryDir } = ensureBusinessFolderStructure(businessId);
    
    // Get file extension and create unique filename
    const ext = path.extname(req.file.originalname);
    const timestamp = Date.now();
    const filename = `gallery-${timestamp}${ext}`;
    const filePath = path.join(galleryDir, filename);
    
    // Write the file from memory buffer to disk
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Construct the gallery image URL (relative path from /businesses/)
    const imageUrl = `/businesses/${businessId}/gallery/${filename}`;
    
    // Get the current gallery to determine the new order
    const business = await Business.findById(businessId);
    const currentMaxOrder = business.gallery && business.gallery.length > 0 
      ? Math.max(...business.gallery.map(img => img.order || 0))
      : 0;
    
    // Add the new image to the business gallery array with order
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { 
        $push: { gallery: { path: imageUrl, order: currentMaxOrder + 1 } },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedBusiness) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.status(201).json({ 
      success: true,
      message: "Gallery image uploaded successfully",
      imageUrl: imageUrl,
      business: {
        id: updatedBusiness._id,
        name: updatedBusiness.name,
        gallery: updatedBusiness.gallery
      }
    });

  } catch (error) {
    console.error("Error uploading gallery image:", error);
    res.status(500).json({ error: "Failed to upload gallery image" });
  }
});

/**
 * @openapi
 * /api/image-upload/gallery-image:
 *   delete:
 *     summary: Delete a gallery image
 *     description: Deletes an image from a business's gallery.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *               - imageUrl
 *             properties:
 *               businessId:
 *                 type: string
 *                 description: The ID of the business.
 *               imageUrl:
 *                 type: string
 *                 description: The URL of the image to delete.
 *     responses:
 *       200:
 *         description: Gallery image deleted successfully.
 *       400:
 *         description: Missing business ID or image URL.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Failed to delete gallery image.
 */
router.delete("/gallery-image", async (req, res) => {
  try {
    const { businessId, imageUrl } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "Business ID is required" });
    }
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Remove the image from the business gallery array
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { 
        $pull: { gallery: { path: imageUrl } },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedBusiness) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Delete the physical file
    const imagePath = path.join(__dirname, "../public", imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.status(200).json({ 
      success: true,
      message: "Gallery image deleted successfully",
      business: {
        id: updatedBusiness._id,
        name: updatedBusiness.name,
        gallery: updatedBusiness.gallery
      }
    });

  } catch (error) {
    console.error("Error deleting gallery image:", error);
    res.status(500).json({ error: "Failed to delete gallery image" });
  }
});

/**
 * @openapi
 * /api/image-upload/gallery-reorder:
 *   put:
 *     summary: Reorder gallery images
 *     description: Updates the order of images in a business's gallery.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *               - gallery
 *             properties:
 *               businessId:
 *                 type: string
 *                 description: The ID of the business.
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     path:
 *                       type: string
 *                     order:
 *                       type: number
 *     responses:
 *       200:
 *         description: Gallery order updated successfully.
 *       400:
 *         description: Missing business ID or gallery array.
 *       404:
 *         description: Business not found.
 *       500:
 *         description: Failed to reorder gallery.
 */
router.put("/gallery-reorder", async (req, res) => {
  try {
    const { businessId, gallery } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "Business ID is required" });
    }
    if (!gallery || !Array.isArray(gallery)) {
      return res.status(400).json({ error: "Gallery array is required" });
    }

    // Update the business gallery with new order
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { 
        gallery: gallery,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedBusiness) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.status(200).json({ 
      success: true,
      message: "Gallery order updated successfully",
      business: {
        id: updatedBusiness._id,
        name: updatedBusiness.name,
        gallery: updatedBusiness.gallery
      }
    });

  } catch (error) {
    console.error("Error reordering gallery:", error);
    res.status(500).json({ error: "Failed to reorder gallery" });
  }
});

module.exports = router;

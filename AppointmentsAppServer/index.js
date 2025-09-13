require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
const helmet = require("helmet");
// const rateLimit = require("express-rate-limit"); // Disabled for development
const fs = require("fs");

const app = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

// Create upload directory if it doesn't exist
const uploadDir = "public/images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Connect to MongoDB with error handling
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan("dev"));

// Rate limiting disabled for development
// TODO: Re-enable rate limiting before production deployment

// CORS
app.use(cors());

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files - serve businesses folder
app.use("/businesses", express.static("public/businesses"));
app.use("/users", express.static("public/users"));

// Routes
const businessRoutes = require("./routes/businesses");
const imageUploadRoutes = require("./routes/imageUpload");
const appointmentRoutes = require("./routes/appointments");
const serviceRoutes = require("./routes/services");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const workingHoursRoutes = require("./routes/workingHours");
const categoryRoutes = require("./routes/categories");


app.use("/api/businesses", businessRoutes);
app.use("/api/image-upload", imageUploadRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/working-hours", workingHoursRoutes);
app.use("/api/categories", categoryRoutes);


// Root endpoint
app.get("/", (req, res) => {
  res.send("Server started");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://10.0.0.109:${PORT}`);
});

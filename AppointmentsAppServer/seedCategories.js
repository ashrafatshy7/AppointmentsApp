const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import Category model
const Category = require('./models/category');

// Initial categories with optimized icons
const initialCategories = [
  {
    name: "Beauty & Spa",
    icon: "spa",
    description: "Salon, spa, and beauty services",
    order: 1
  },
  {
    name: "Health & Medical",
    icon: "heartbeat",
    description: "Healthcare and medical services",
    order: 2
  },
  {
    name: "Automotive",
    icon: "car",
    description: "Car repair, maintenance, and services",
    order: 3
  },
  {
    name: "Home Services",
    icon: "home",
    description: "Home maintenance and repair services",
    order: 4
  },
  {
    name: "Technology Services",
    icon: "laptop",
    description: "IT, computer, and technology services",
    order: 5
  },
  {
    name: "Education & Training",
    icon: "graduation-cap",
    description: "Educational and training services",
    order: 6
  },
  {
    name: "Food & Beverage",
    icon: "utensils",
    description: "Restaurants, cafes, and food services",
    order: 7
  },
  {
    name: "Professional Services",
    icon: "briefcase",
    description: "Legal, accounting, and consulting services",
    order: 8
  },
  {
    name: "Entertainment",
    icon: "music",
    description: "Entertainment and recreation services",
    order: 9
  },
  {
    name: "Fitness & Sports",
    icon: "dumbbell",
    description: "Gym, sports, and fitness services",
    order: 10
  },
  {
    name: "Pet Care",
    icon: "paw",
    description: "Pet grooming, veterinary, and pet services",
    order: 11
  },
  {
    name: "Other",
    icon: "ellipsis-h",
    description: "Other business categories",
    order: 12
  }
];

// Seed function
async function seedCategories() {
  try {
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Insert new categories
    const result = await Category.insertMany(initialCategories);
    console.log(`Successfully seeded ${result.length} categories`);
    
    // Display seeded categories
    result.forEach(cat => {
      console.log(`- ${cat.name} (${cat.icon})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCategories();

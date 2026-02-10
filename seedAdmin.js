const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Ensure path is correct
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    const adminEmail = "admin@company.com";
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin already exists. Skipping...");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    c// Inside seedAdmin.js
const admin = new User({
  name: 'Admin',
  email: 'admin@company.com',
  password: 'admin123', // Send plain text if your Model has a .pre('save') hook
  role: 'admin'
});

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@company.com | Password: admin123");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedAdmin();
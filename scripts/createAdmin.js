const mongoose = require('mongoose');
const User = require('../src/models/User');
const config = require('../src/config/env');

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongo.uri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@bidzen.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('Admin credentials:');
      console.log('Email: admin@bidzen.com');
      console.log('Password: admin123456');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const admin = await User.create({
      name: 'BidZen Admin',
      email: 'admin@bidzen.com',
      password: 'admin123456',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('Email: admin@bidzen.com');
    console.log('Password: admin123456');
    console.log('Role: admin');
    console.log('Status: Active');
    console.log('\n🔐 Use these credentials to login and access admin panel.');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the function
createAdmin();

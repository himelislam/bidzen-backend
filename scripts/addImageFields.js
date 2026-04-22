const mongoose = require('mongoose');
const Auction = require('../src/models/Auction');
require('dotenv').config();

const addImageFields = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Add new fields to existing auctions
    const result = await Auction.updateMany(
      {},
      {
        $set: {
          images: [],
          primaryImageIndex: -1
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} auctions`);
    console.log('Image fields added successfully');
  } catch (error) {
    console.error('Error adding image fields:', error);
  } finally {
    await mongoose.disconnect();
  }
};

addImageFields();

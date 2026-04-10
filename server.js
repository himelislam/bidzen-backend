const express = require('express');
const mongoose = require('mongoose');
const config = require('./src/config/env');
const authRoutes = require('./src/routes/auth.routes');
const auctionRoutes = require('./src/routes/auction.routes');
const bidRoutes = require('./src/routes/bid.routes');
const feedbackRoutes = require('./src/routes/feedback.routes');
const errorHandler = require('./src/utils/errorHandler');
const { startAuctionTimer } = require('./src/jobs/auctionTimer');

const app = express();

// Body parser
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to BidZen API v1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/auctions', bidRoutes);      // Bid routes are nested under auctions
app.use('/api/auctions', feedbackRoutes); // Feedback routes are nested under auctions

// Global error handler (must be last middleware)
app.use(errorHandler);

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Check if MONGO_URI is defined
    if (!config.mongo.uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const conn = await mongoose.connect(config.mongo.uri, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();

  // Start auction timer job after DB connection
  startAuctionTimer();

  try {
    app.listen(config.app.port, () => {
      console.log(`Server running on port ${config.app.port}`);
    });
  } catch (error) {
    console.error('Server error:', error.message);
    process.exit(1);
  }
};

startServer();

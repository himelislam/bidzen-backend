const mongoose = require('mongoose');

const AuctionSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [0, 'Starting price must be positive']
  },
  currentHighestBid: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'closed'],
    default: 'scheduled'
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  flaggedForReview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
AuctionSchema.index({ seller: 1 });
AuctionSchema.index({ status: 1, endTime: 1 });

module.exports = mongoose.model('Auction', AuctionSchema);

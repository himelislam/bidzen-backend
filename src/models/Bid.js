const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, 'Auction is required']
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bidder is required']
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [1, 'Bid amount must be at least 1']
  }
}, {
  timestamps: true
});

// Indexes for performance and atomic operations
BidSchema.index({ auction: 1, amount: -1 }); // For finding highest bid per auction
BidSchema.index({ auction: 1, createdAt: -1 }); // For bid history
BidSchema.index({ bidder: 1 }); // For user bid history

module.exports = mongoose.model('Bid', BidSchema);

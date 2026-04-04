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
    min: [0, 'Bid amount must be positive']
  }
}, {
  timestamps: true
});

// Indexes
BidSchema.index({ auction: 1, amount: -1 });
BidSchema.index({ auction: 1, createdAt: -1 });

module.exports = mongoose.model('Bid', BidSchema);

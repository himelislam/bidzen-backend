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
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [1, 'Starting price must be at least 1']
  },
  currentHighestBid: {
    type: Number,
    default: 0,
    min: [0, 'Current highest bid cannot be negative']
  },
  category: {
    type: String,
    enum: ['electronics', 'fashion', 'luxury', 'gaming', 'professional', 'collectibles', 'automotive', 'home', 'other'],
    default: 'other'
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
    required: [true, 'Start time is required'],
    validate: {
      validator: function (value) {
        return value > new Date();
      },
      message: 'Start time must be in the future'
    }
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
    validate: {
      validator: function (value) {
        return value > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  flaggedForReview: {
    type: Boolean,
    default: false
  },
  bidCount: {
    type: Number,
    default: 0,
    min: [0, 'Bid count cannot be negative']
  },
  images: [{
    publicId: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    secureUrl: {
      type: String,
      required: true
    },
    format: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    resourceType: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  primaryImageIndex: {
    type: Number,
    default: -1,
    min: -1
  }
}, {
  timestamps: true
});

// Indexes for performance and queries
AuctionSchema.index({ seller: 1 });
AuctionSchema.index({ status: 1, endTime: 1 });
AuctionSchema.index({ category: 1 });
AuctionSchema.index({ flaggedForReview: 1 });

module.exports = mongoose.model('Auction', AuctionSchema);

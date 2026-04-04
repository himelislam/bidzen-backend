const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, 'Auction is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5']
  },
  reviewText: {
    type: String,
    required: [true, 'Review text is required'],
    minlength: [10, 'Review text must be at least 10 characters'],
    maxlength: [500, 'Review text must be at most 500 characters']
  }
}, {
  timestamps: true
});

// Indexes
FeedbackSchema.index({ auction: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);

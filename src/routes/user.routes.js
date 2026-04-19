const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyBids,
  getMyProfile,
  getMyStats,
  getMyAuctions,
  updateMyProfile,
  getMyReceivedFeedback,
  getMyGivenFeedback
} = require('../controllers/user.controller');

// All user routes require authentication
router.use(protect);

// User profile and stats
router.get('/me/profile', getMyProfile);                    // Get current user profile
router.get('/me/stats', getMyStats);                        // Get user dashboard statistics
router.put('/me/profile', updateMyProfile);                  // Update user profile

// User bids and auctions
router.get('/me/bids', getMyBids);                          // Get current user's bids
router.get('/me/auctions', getMyAuctions);                  // Get current user's auctions (for sellers)

// User feedback
router.get('/me/feedback/received', getMyReceivedFeedback);  // Get feedback received by user
router.get('/me/feedback/given', getMyGivenFeedback);      // Get feedback given by user

module.exports = router;

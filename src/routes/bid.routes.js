const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { validateBid } = require('../validators/bid.validator');
const {
    placeBid,
    getBidHistory,
    getMyBidHistory
} = require('../controllers/bid.controller');

// Public routes
router.get('/:id/bids', getBidHistory);                 // Get bid history for specific auction

// Protected routes (buyer only)
router.post('/:id/bids', protect, restrictTo('buyer'), validateBid, placeBid);  // Place a bid
router.get('/my-bids', protect, restrictTo('buyer'), getMyBidHistory);           // Get user's bid history

module.exports = router;

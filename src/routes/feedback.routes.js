const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateFeedback } = require('../validators/feedback.validator');
const {
    submitFeedback,
    getAuctionFeedback,
    getMyReceivedFeedback,
    getMyGivenFeedback
} = require('../controllers/feedback.controller');

// Public routes
router.get('/:id/feedback', getAuctionFeedback);                    // Get feedback for specific auction

// Protected routes (buyer or seller who participated in the auction)
router.post('/:id/feedback', protect, validateFeedback, submitFeedback);  // Submit feedback

// Protected routes (personal feedback history)
router.get('/my/received', protect, getMyReceivedFeedback);           // Get feedback received by current user
router.get('/my/given', protect, getMyGivenFeedback);                 // Get feedback given by current user

module.exports = router;

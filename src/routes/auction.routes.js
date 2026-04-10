const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { validateCreateAuction, validateUpdateAuction } = require('../validators/auction.validator');
const {
    createAuction,
    getAllAuctions,
    getAuctionById,
    updateAuction,
    deleteAuction
} = require('../controllers/auction.controller');

// Public routes
router.get('/', getAllAuctions);                    // Get all active auctions
router.get('/:id', getAuctionById);                 // Get single auction by ID

// Protected routes (seller only)
router.post('/', protect, restrictTo('seller'), validateCreateAuction, createAuction);           // Create auction
router.patch('/:id', protect, restrictTo('seller'), validateUpdateAuction, updateAuction);        // Update auction
router.delete('/:id', protect, restrictTo('seller'), deleteAuction);                             // Delete auction

module.exports = router;

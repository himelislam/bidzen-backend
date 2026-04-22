const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { validateCreateAuction, validateUpdateAuction } = require('../validators/auction.validator');
const { uploadMultipleImages, handleImageUploadErrors } = require('../middleware/imageUpload');
const {
    createAuction,
    getAllAuctions,
    getAuctionById,
    updateAuction,
    deleteAuction,
    updateAuctionImages,
    deleteAuctionImage
} = require('../controllers/auction.controller');

// Public routes
router.get('/', getAllAuctions);                    // Get all active auctions
router.get('/:id', getAuctionById);                 // Get single auction by ID

// Protected routes (seller only)
router.post('/', protect, restrictTo('seller'), uploadMultipleImages, handleImageUploadErrors, validateCreateAuction, createAuction);           // Create auction with images
router.patch('/:id', protect, restrictTo('seller'), validateUpdateAuction, updateAuction);        // Update auction
router.delete('/:id', protect, restrictTo('seller'), deleteAuction);                             // Delete auction

// Image management routes
router.patch('/:id/images', protect, restrictTo('seller'), uploadMultipleImages, handleImageUploadErrors, updateAuctionImages);  // Add more images
router.delete('/:id/images/:imageIndex', protect, restrictTo('seller'), deleteAuctionImage);    // Delete specific image

module.exports = router;

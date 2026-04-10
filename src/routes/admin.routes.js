const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
    getFlaggedAuctions,
    resolveFlaggedAuction,
    getAllUsers,
    deactivateUser,
    activateUser,
    getDashboardStats
} = require('../controllers/admin.controller');

// All admin routes require admin role
router.use(protect, restrictTo('admin'));

// Flagged auction management
router.get('/auctions', getFlaggedAuctions);                    // Get flagged auctions
router.patch('/auctions/:id/resolve', resolveFlaggedAuction);    // Resolve flagged auction

// User management
router.get('/users', getAllUsers);                              // Get all users
router.patch('/users/:id/deactivate', deactivateUser);         // Deactivate user
router.patch('/users/:id/activate', activateUser);             // Activate user

// Admin dashboard
router.get('/dashboard/stats', getDashboardStats);              // Get dashboard statistics

module.exports = router;

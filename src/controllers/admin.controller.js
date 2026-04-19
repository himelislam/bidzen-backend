const Auction = require('../models/Auction');
const User = require('../models/User');
const Bid = require('../models/Bid');
const ApiError = require('../utils/ApiError');

// Get all flagged auctions for admin review
exports.getFlaggedAuctions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const { flagged = true } = req.query;

        // Build filter
        const filter = flagged === 'true' ? { flaggedForReview: true } : {};

        const auctions = await Auction.find(filter)
            .populate('seller', 'name email')
            .populate('winner', 'name email')
            .sort({ updatedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Auction.countDocuments(filter);

        // For each flagged auction, get bid statistics
        const auctionsWithStats = await Promise.all(
            auctions.map(async (auction) => {
                const bidStats = await Bid.aggregate([
                    { $match: { auction: auction._id } },
                    {
                        $group: {
                            _id: null,
                            totalBids: { $sum: 1 },
                            highestBid: { $max: '$amount' },
                            lowestBid: { $min: '$amount' },
                            avgBid: { $avg: '$amount' }
                        }
                    }
                ]);

                const stats = bidStats[0] || {
                    totalBids: 0,
                    highestBid: 0,
                    lowestBid: 0,
                    avgBid: 0
                };

                return {
                    ...auction,
                    bidStats: stats,
                    priceRatio: auction.startingPrice > 0 ? (stats.highestBid / auction.startingPrice) : 0
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                auctions: auctionsWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Resolve flagged auction (clear flag after admin review)
exports.resolveFlaggedAuction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { flaggedForReview, adminNote } = req.body;

        // Find the auction
        const auction = await Auction.findById(id)
            .populate('seller winner', 'name email')
            .lean();

        if (!auction) {
            return next(new ApiError('Auction not found', 404));
        }

        if (!auction.flaggedForReview) {
            return next(new ApiError('This auction is not flagged for review', 400));
        }

        // Update auction based on admin action
        const updateData = { flaggedForReview: flaggedForReview !== undefined ? flaggedForReview : false };

        // Add admin note if provided
        if (adminNote) {
            updateData.adminNote = adminNote;
        }

        // Add admin action tracking
        updateData.adminAction = {
            action,
            adminId: req.user._id,
            timestamp: new Date(),
            notes: notes || ''
        };

        const updatedAuction = await Auction.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('flaggedForReview adminNote updatedAt');

        res.status(200).json({
            success: true,
            data: updatedAuction,
            message: 'Flag resolved successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, status } = req.query;

        // Build filter
        const filter = {};
        if (role && ['buyer', 'seller', 'admin'].includes(role)) {
            filter.role = role;
        }
        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await User.countDocuments(filter);

        // Get user statistics for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const stats = {};

                if (user.role === 'seller') {
                    // Seller stats
                    const auctionStats = await Auction.aggregate([
                        { $match: { seller: user._id } },
                        {
                            $group: {
                                _id: null,
                                totalAuctions: { $sum: 1 },
                                completedAuctions: {
                                    $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
                                },
                                flaggedAuctions: {
                                    $sum: { $cond: ['$flaggedForReview', 1, 0] }
                                }
                            }
                        }
                    ]);
                    stats.sellerStats = auctionStats[0] || {
                        totalAuctions: 0,
                        completedAuctions: 0,
                        flaggedAuctions: 0
                    };
                }

                if (user.role === 'buyer') {
                    // Buyer stats
                    const bidStats = await Bid.aggregate([
                        { $match: { bidder: user._id } },
                        {
                            $group: {
                                _id: null,
                                totalBids: { $sum: 1 },
                                wonAuctions: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    '$auction',
                                                    {
                                                        $arrayElemAt: [
                                                            {
                                                                $map: {
                                                                    input: {
                                                                        $filter: {
                                                                            input: await Auction.find({ winner: user._id }),
                                                                            as: 'auction',
                                                                            cond: { $eq: ['$$auction._id', '$auction'] }
                                                                        }
                                                                    },
                                                                    as: 'auction',
                                                                    in: '$$auction._id'
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ]);
                    stats.buyerStats = bidStats[0] || {
                        totalBids: 0,
                        wonAuctions: 0
                    };
                }

                return {
                    ...user,
                    stats
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                users: usersWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Deactivate user account (admin only)
exports.deactivateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Find the user
        const user = await User.findById(id);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Prevent deactivating yourself
        if (user._id.toString() === req.user._id.toString()) {
            return next(new ApiError('You cannot deactivate your own account', 400));
        }

        // Prevent deactivating other admins (optional business rule)
        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            return next(new ApiError('You cannot deactivate another admin account', 403));
        }

        // Deactivate user
        const deactivatedUser = await User.findByIdAndUpdate(
            id,
            {
                isActive: false,
                deactivatedBy: req.user._id,
                deactivatedAt: new Date(),
                deactivationReason: reason || 'Administrative action'
            },
            { new: true }
        ).select('-password');

        // Log the admin action
        console.log(`Admin ${req.user.email} deactivated user ${user.email} (${user.role})`);

        res.status(200).json({
            success: true,
            data: { user: deactivatedUser },
            message: 'User account deactivated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Activate user account (admin only)
exports.activateUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the user
        const user = await User.findById(id);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        if (user.isActive) {
            return next(new ApiError('User account is already active', 400));
        }

        // Activate user
        const activatedUser = await User.findByIdAndUpdate(
            id,
            {
                isActive: true,
                activatedBy: req.user._id,
                activatedAt: new Date(),
                $unset: {
                    deactivatedBy: 1,
                    deactivatedAt: 1,
                    deactivationReason: 1
                }
            },
            { new: true }
        ).select('-password');

        // Log the admin action
        console.log(`Admin ${req.user.email} activated user ${user.email} (${user.role})`);

        res.status(200).json({
            success: true,
            data: { user: activatedUser },
            message: 'User account activated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
    try {
        // Get various statistics for admin dashboard
        const [
            totalUsers,
            totalAuctions,
            activeAuctions,
            flaggedAuctions,
            totalBids,
            completedAuctions
        ] = await Promise.all([
            User.countDocuments(),
            Auction.countDocuments(),
            Auction.countDocuments({ status: 'active' }),
            Auction.countDocuments({ flaggedForReview: true }),
            Bid.countDocuments(),
            Auction.countDocuments({ status: 'closed' })
        ]);

        // Get user breakdown by role
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get auction breakdown by status
        const auctionStats = await Auction.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent flagged auctions
        const recentFlagged = await Auction.find({ flaggedForReview: true })
            .populate('seller', 'name email')
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean();

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalAuctions,
                    activeAuctions,
                    flaggedAuctions,
                    totalBids,
                    completedAuctions
                },
                userStats: userStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                auctionStats: auctionStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                recentFlagged
            }
        });
    } catch (error) {
        next(error);
    }
};

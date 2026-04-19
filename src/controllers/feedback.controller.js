const Auction = require('../models/Auction');
const Feedback = require('../models/Feedback');
const ApiError = require('../utils/ApiError');

// Submit feedback for a completed auction (buyer or seller only)
exports.submitFeedback = async (req, res, next) => {
    try {
        const { rating, reviewText } = req.body;
        const auctionId = req.params.id;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Check if auction exists and is closed
        const auction = await Auction.findById(auctionId)
            .populate('seller winner', 'name email')
            .lean();

        if (!auction) {
            return next(new ApiError('Auction not found', 404));
        }

        if (auction.status !== 'closed') {
            return next(new ApiError('Feedback can only be submitted for completed auctions', 400));
        }

        // Check if there's a winner (no feedback if no bids were placed)
        if (!auction.winner) {
            return next(new ApiError('Feedback cannot be submitted for auctions with no winner', 400));
        }

        // Ownership validation: only winner (buyer) or seller can submit feedback
        const isWinner = userId.toString() === auction.winner._id.toString();
        const isSeller = userId.toString() === auction.seller._id.toString();

        if (!isWinner && !isSeller) {
            return next(new ApiError('Only the winning buyer and the seller can submit feedback', 403));
        }

        // Determine recipient (buyer gives feedback to seller, seller gives feedback to buyer)
        let recipientId;
        if (isWinner) {
            // Winner (buyer) gives feedback to seller
            recipientId = auction.seller._id;
        } else {
            // Seller gives feedback to winner (buyer)
            recipientId = auction.winner._id;
        }

        // Check if user has already submitted feedback for this auction
        const existingFeedback = await Feedback.findOne({
            auction: auctionId,
            author: userId
        });

        if (existingFeedback) {
            return next(new ApiError('You have already submitted feedback for this auction', 400));
        }

        // Create feedback
        const feedback = await Feedback.create({
            auction: auctionId,
            author: userId,
            recipient: recipientId,
            rating,
            reviewText
        });

        // Populate author and recipient information
        await feedback.populate([
            { path: 'author', select: 'name email role' },
            { path: 'recipient', select: 'name email role' }
        ]);

        res.status(201).json({
            success: true,
            data: { feedback },
            message: 'Feedback submitted successfully'
        });
    } catch (error) {
        // Handle duplicate key error (compound unique index violation)
        if (error.code === 11000) {
            return next(new ApiError('You have already submitted feedback for this auction', 400));
        }
        next(error);
    }
};

// Get feedback for a specific auction (public)
exports.getAuctionFeedback = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const auctionId = req.params.id;

        // Check if auction exists and is closed
        const auction = await Auction.findById(auctionId).lean();
        if (!auction) {
            return next(new ApiError('Auction not found', 404));
        }

        // Get all feedback for this auction
        const feedbacks = await Feedback.find({ auction: auctionId })
            .populate('author', 'name email role')
            .populate('recipient', 'name email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Feedback.countDocuments({ auction: auctionId });

        // Calculate average rating
        const avgRatingResult = await Feedback.aggregate([
            { $match: { auction: auctionId } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, totalFeedbacks: { $sum: 1 } } }
        ]);

        const stats = avgRatingResult[0] || { avgRating: 0, totalFeedbacks: 0 };

        res.status(200).json({
            success: true,
            data: {
                feedbacks,
                auction: {
                    _id: auction._id,
                    title: auction.title,
                    status: auction.status
                },
                stats: {
                    averageRating: Math.round(stats.avgRating * 10) / 10, // Round to 1 decimal place
                    totalFeedbacks: stats.totalFeedbacks
                },
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

// Get feedback received by current user (buyer or seller)
exports.getMyReceivedFeedback = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user._id;

        const feedbacks = await Feedback.find({ recipient: userId })
            .populate('author', 'name email role')
            .populate('auction', 'title endTime startingPrice')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Feedback.countDocuments({ recipient: userId });

        // Calculate average rating for received feedback
        const avgRatingResult = await Feedback.aggregate([
            { $match: { recipient: userId } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, totalFeedbacks: { $sum: 1 } } }
        ]);

        const stats = avgRatingResult[0] || { avgRating: 0, totalFeedbacks: 0 };

        res.status(200).json({
            success: true,
            data: {
                feedbacks,
                stats: {
                    averageRating: Math.round(stats.avgRating * 10) / 10,
                    totalFeedbacks: stats.totalFeedbacks
                },
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

// Get feedback given by current user (buyer or seller)
exports.getMyGivenFeedback = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user._id;

        const feedbacks = await Feedback.find({ author: userId })
            .populate('recipient', 'name email role')
            .populate('auction', 'title endTime startingPrice')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Feedback.countDocuments({ author: userId });

        res.status(200).json({
            success: true,
            data: {
                feedbacks,
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

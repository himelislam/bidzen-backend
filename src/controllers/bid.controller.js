const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const ApiError = require('../utils/ApiError');

// Place a bid on an auction (buyer only) - ATOMIC OPERATION
exports.placeBid = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const auctionId = req.params.id;
        const now = new Date();

        // Pre-validation checks
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return next(new ApiError('Auction not found', 404));
        }

        if (auction.status !== 'active') {
            return next(new ApiError('Auction is not active for bidding', 400));
        }

        if (now < auction.startTime) {
            return next(new ApiError('Auction has not started yet', 400));
        }

        if (now > auction.endTime) {
            return next(new ApiError('Auction has ended', 400));
        }

        if (amount <= auction.currentHighestBid) {
            return next(new ApiError('Bid must be higher than current highest bid', 400));
        }

        if (req.user._id.toString() === auction.seller.toString()) {
            return next(new ApiError('Sellers cannot bid on their own auctions', 400));
        }

        // ATOMIC UPDATE - Race condition protection
        // This is the most critical part - MongoDB document-level locking prevents race conditions
        const updatedAuction = await Auction.findOneAndUpdate(
            {
                _id: auctionId,
                status: 'active',
                startTime: { $lte: now },
                endTime: { $gte: now },
                currentHighestBid: { $lt: amount }   // Conditional filter is the race guard
            },
            { $set: { currentHighestBid: amount } },
            { new: true }
        );

        if (!updatedAuction) {
            // Either auction not found, not active, time expired, or bid not high enough
            return next(new ApiError('Bid was not successful. Auction may have ended or a higher bid was placed', 400));
        }

        // Only create Bid document after successful atomic update
        const bid = await Bid.create({
            auction: auctionId,
            bidder: req.user._id,
            amount
        });

        // Populate bidder info for response
        await bid.populate('bidder', 'name email');

        res.status(201).json({
            success: true,
            data: {
                bid,
                currentHighestBid: updatedAuction.currentHighestBid,
                message: 'Bid placed successfully'
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get bid history for an auction (public)
exports.getBidHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const auctionId = req.params.id;

        // Check if auction exists
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return next(new ApiError('Auction not found', 404));
        }

        // Get bids sorted by amount (highest first), then by time (newest first)
        const bids = await Bid.find({ auction: auctionId })
            .populate('bidder', 'name email')
            .sort({ amount: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Bid.countDocuments({ auction: auctionId });

        res.status(200).json({
            success: true,
            data: {
                bids,
                auction: {
                    _id: auction._id,
                    title: auction.title,
                    currentHighestBid: auction.currentHighestBid,
                    status: auction.status,
                    endTime: auction.endTime
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

// Get user's bid history (buyer only)
exports.getMyBidHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const bids = await Bid.find({ bidder: req.user._id })
            .populate({
                path: 'auction',
                select: 'title endTime status currentHighestBid startingPrice seller',
                populate: {
                    path: 'seller',
                    select: 'name email'
                }
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Bid.countDocuments({ bidder: req.user._id });

        res.status(200).json({
            success: true,
            data: {
                bids,
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

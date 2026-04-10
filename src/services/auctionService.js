const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const ApiError = require('../utils/ApiError');

// Create new auction with business logic
exports.createAuction = async (auctionData, sellerId) => {
    try {
        // Set default values and business rules
        const auction = await Auction.create({
            ...auctionData,
            seller: sellerId,
            status: 'scheduled',
            currentHighestBid: 0,
            flaggedForReview: false
        });

        // Populate seller information
        await auction.populate('seller', 'name email');

        return auction;
    } catch (error) {
        throw error;
    }
};

// Update auction with ownership and status validation
exports.updateAuction = async (auctionId, updateData, sellerId) => {
    try {
        // Find auction
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            throw new ApiError('Auction not found', 404);
        }

        // Ownership validation
        if (auction.seller.toString() !== sellerId.toString()) {
            throw new ApiError('You do not own this listing', 403);
        }

        // Status validation (can only edit scheduled auctions)
        if (auction.status !== 'scheduled') {
            throw new ApiError('Cannot modify an auction that has already started or closed', 400);
        }

        // Update auction with new data
        const updatedAuction = await Auction.findByIdAndUpdate(
            auctionId,
            updateData,
            { new: true, runValidators: true }
        ).populate('seller', 'name email');

        return updatedAuction;
    } catch (error) {
        throw error;
    }
};

// Delete auction with ownership and status validation
exports.deleteAuction = async (auctionId, sellerId) => {
    try {
        // Find auction
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            throw new ApiError('Auction not found', 404);
        }

        // Ownership validation
        if (auction.seller.toString() !== sellerId.toString()) {
            throw new ApiError('You do not own this listing', 403);
        }

        // Status validation (can only delete scheduled auctions)
        if (auction.status !== 'scheduled') {
            throw new ApiError('Cannot delete an auction that has already started or closed', 400);
        }

        // Delete associated bids first (cascade delete)
        await Bid.deleteMany({ auction: auctionId });

        // Delete auction
        await Auction.findByIdAndDelete(auctionId);

        return { message: 'Auction deleted successfully' };
    } catch (error) {
        throw error;
    }
};

// Get all active auctions with pagination
exports.getActiveAuctions = async (page = 1, limit = 20) => {
    try {
        const auctions = await Auction.find({ status: 'active' })
            .populate('seller', 'name email')
            .sort({ endTime: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Auction.countDocuments({ status: 'active' });

        return {
            auctions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw error;
    }
};

// Get single auction by ID with populated seller
exports.getAuctionById = async (auctionId) => {
    try {
        const auction = await Auction.findById(auctionId)
            .populate('seller', 'name email')
            .lean();

        if (!auction) {
            throw new ApiError('Auction not found', 404);
        }

        return auction;
    } catch (error) {
        throw error;
    }
};

// Check if user owns the auction
exports.verifyAuctionOwnership = async (auctionId, userId) => {
    try {
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            throw new ApiError('Auction not found', 404);
        }

        return auction.seller.toString() === userId.toString();
    } catch (error) {
        throw error;
    }
};

// Validate auction status for modifications
exports.validateAuctionStatus = async (auctionId, allowedStatus = 'scheduled') => {
    try {
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            throw new ApiError('Auction not found', 404);
        }

        if (auction.status !== allowedStatus) {
            throw new ApiError(`Cannot perform this operation on auction with status: ${auction.status}`, 400);
        }

        return auction;
    } catch (error) {
        throw error;
    }
};

// WINNER DETERMINATION - Close auction and determine winner
exports.closeAuction = async (auctionId, startingPrice) => {
    try {
        // Find the highest bid for this auction
        const winningBid = await Bid.findOne({ auction: auctionId })
            .sort({ amount: -1 })
            .populate('bidder', 'name email')
            .lean();

        const updateData = { status: 'closed' };

        if (winningBid) {
            updateData.winner = winningBid.bidder._id;

            // Flag if winning bid is below 50% of starting price
            if (winningBid.amount < startingPrice * 0.5) {
                updateData.flaggedForReview = true;
                console.log(`Auction ${auctionId} flagged for review: winning bid (${winningBid.amount}) is below 50% of starting price (${startingPrice})`);
            }

            console.log(`Auction ${auctionId} closed. Winner: ${winningBid.bidder.name} (${winningBid.bidder.email}) with bid: ${winningBid.amount}`);
        } else {
            console.log(`Auction ${auctionId} closed with no bids`);
        }

        // Update auction with winner and status
        const closedAuction = await Auction.findByIdAndUpdate(
            auctionId,
            updateData,
            { new: true }
        ).populate('winner', 'name email');

        return closedAuction;
    } catch (error) {
        console.error(`Error closing auction ${auctionId}:`, error);
        throw error;
    }
};

// Get auctions that need to be closed (for cron job)
exports.getAuctionsToClose = async () => {
    try {
        const now = new Date();
        const auctions = await Auction.find({
            status: 'active',
            endTime: { $lte: now }
        }, '_id startingPrice seller').lean();

        return auctions;
    } catch (error) {
        throw error;
    }
};

// Get auctions that need to be activated (for cron job)
exports.getAuctionsToActivate = async () => {
    try {
        const now = new Date();
        const auctions = await Auction.find({
            status: 'scheduled',
            startTime: { $lte: now }
        }, '_id').lean();

        return auctions;
    } catch (error) {
        throw error;
    }
};

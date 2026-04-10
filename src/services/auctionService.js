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

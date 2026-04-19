const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const ApiError = require('../utils/ApiError');

// Create new auction (seller only)
exports.createAuction = async (req, res, next) => {
    try {
        const { title, description, startingPrice, startTime, endTime, category } = req.body;

        // Create auction with seller from authenticated user
        const auction = await Auction.create({
            title,
            description,
            startingPrice,
            startTime,
            endTime,
            category: category || 'other',
            seller: req.user._id,
            status: 'scheduled',
            currentHighestBid: 0
        });

        // Populate seller information
        await auction.populate('seller', 'name email');

        res.status(201).json({
            success: true,
            message: 'Auction created successfully',
            data: {
                _id: auction._id,
                title: auction.title,
                description: auction.description,
                startingPrice: auction.startingPrice,
                currentHighestBid: auction.currentHighestBid,
                status: auction.status,
                endTime: auction.endTime,
                category: auction.category,
                seller: {
                    _id: auction.seller._id,
                    name: auction.seller.name,
                    email: auction.seller.email
                },
                createdAt: auction.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get all active auctions (public)
exports.getAllAuctions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, category, search } = req.query;

        // Build filter - show both scheduled and active auctions
        const filter = { status: { $in: ['scheduled', 'active'] } };
        if (category && category !== 'all') {
            filter.category = category;
        }
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        const auctions = await Auction.find(filter)
            .populate('seller', 'name email')
            .sort({ endTime: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Auction.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                auctions,
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

// Get single auction by ID (public)
exports.getAuctionById = async (req, res, next) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate('seller', 'name email')
            .lean();

        if (!auction) {
            return next(new ApiError('Auction not found', 404));
        }

        // Add bidCount to response
        const bidCount = await Bid.countDocuments({ auction: auction._id });

        res.status(200).json({
            success: true,
            data: {
                ...auction,
                bidCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update auction (seller only, own listing, scheduled only)
exports.updateAuction = async (req, res, next) => {
    try {
        const { title, description, startingPrice, startTime, endTime, category } = req.body;

        // Find auction and check ownership
        const auction = await Auction.findById(req.params.id);
        if (!auction) {
            return next(new ApiError('Auction not found', 404));
        }

        // Check ownership
        if (auction.seller.toString() !== req.user._id.toString()) {
            return next(new ApiError('You do not own this listing', 403));
        }

        // Check if auction is still scheduled (can only edit scheduled auctions)
        if (auction.status !== 'scheduled') {
            return next(new ApiError('Cannot modify an auction that has already started or closed', 400));
        }

        // Manual date validation to avoid Mongoose schema validation issues
        const newStartTime = startTime ? new Date(startTime) : auction.startTime;
        const newEndTime = endTime ? new Date(endTime) : auction.endTime;

        // Validate start time is in future
        if (newStartTime <= new Date()) {
            return next(new ApiError('Start time must be in the future', 400));
        }

        // Validate end time is after start time
        if (newEndTime <= newStartTime) {
            return next(new ApiError('End time must be after start time', 400));
        }

        // Update auction
        const updatedAuction = await Auction.findByIdAndUpdate(
            req.params.id,
            {
                title: title || auction.title,
                description: description || auction.description,
                startingPrice: startingPrice || auction.startingPrice,
                startTime: newStartTime,
                endTime: newEndTime,
                category: category || auction.category
            },
            { new: true, runValidators: false }  // Disable runValidators to avoid schema validation conflicts
        ).populate('seller', 'name email');

        res.status(200).json({
            success: true,
            data: { auction: updatedAuction },
            message: "Auction updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Delete auction (seller only, own listing)
exports.deleteAuction = async (req, res, next) => {
    try {
        // Find auction and check ownership
        const auction = await Auction.findById(req.params.id);
        if (!auction) {
            return next(new ApiError('Auction not found', 404));
        }

        // Check ownership
        if (auction.seller.toString() !== req.user._id.toString()) {
            return next(new ApiError('You do not own this listing', 403));
        }

        // Check if auction is still scheduled (can only delete scheduled auctions)
        if (auction.status !== 'scheduled') {
            return next(new ApiError('Cannot delete an auction that has already started or closed', 400));
        }

        // Delete associated bids first
        await Bid.deleteMany({ auction: req.params.id });

        // Delete auction
        await Auction.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Auction deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

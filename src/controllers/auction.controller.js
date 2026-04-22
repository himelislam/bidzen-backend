const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const ApiError = require('../utils/ApiError');
const { cloudinary, uploadToCloudinary } = require('../config/cloudinary');

// Create new auction (seller only)
exports.createAuction = async (req, res, next) => {
    try {
        const { title, description, startingPrice, startTime, endTime, category } = req.body;

        // Process uploaded images - manual Cloudinary upload
        let images = [];
        if (req.files && req.files.length > 0) {
            console.log('Processing uploaded files:', req.files.length);

            // Upload each file to Cloudinary manually
            const uploadPromises = req.files.map(async (file) => {
                console.log('Uploading file:', file.originalname);
                console.log('File size:', file.size);
                console.log('File mimetype:', file.mimetype);

                try {
                    const result = await uploadToCloudinary(file.buffer, file.originalname);

                    return {
                        publicId: result.public_id,
                        url: result.url,
                        secureUrl: result.secure_url,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                        size: result.bytes,
                        resourceType: result.resource_type,
                        createdAt: new Date()
                    };
                } catch (error) {
                    console.error('Failed to upload file:', file.originalname, error);
                    throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
                }
            });

            // Wait for all uploads to complete
            images = await Promise.all(uploadPromises);
            console.log('All images uploaded successfully:', images.length);
        }

        // Create auction with images
        const auction = await Auction.create({
            title,
            description,
            startingPrice,
            startTime,
            endTime,
            category: category || 'other',
            seller: req.user._id,
            status: 'scheduled',
            currentHighestBid: 0,
            images,
            primaryImageIndex: images.length > 0 ? 0 : -1
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
                images: auction.images,
                primaryImageIndex: auction.primaryImageIndex,
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

// Add new function to update auction images
exports.updateAuctionImages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { primaryImageIndex } = req.body;

        const auction = await Auction.findById(id);
        if (!auction) {
            return next(new ApiError(404, 'Auction not found'));
        }

        // Check ownership
        if (auction.seller.toString() !== req.user._id.toString()) {
            return next(new ApiError(403, 'Not authorized to update this auction'));
        }

        // Process new images - manual Cloudinary upload
        let newImages = [];
        if (req.files && req.files.length > 0) {
            console.log('Processing additional images:', req.files.length);

            // Upload each file to Cloudinary manually
            const uploadPromises = req.files.map(async (file) => {
                console.log('Uploading additional file:', file.originalname);

                try {
                    const result = await uploadToCloudinary(file.buffer, file.originalname);

                    return {
                        publicId: result.public_id,
                        url: result.url,
                        secureUrl: result.secure_url,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                        size: result.bytes,
                        resourceType: result.resource_type,
                        createdAt: new Date()
                    };
                } catch (error) {
                    console.error('Failed to upload additional file:', file.originalname, error);
                    throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
                }
            });

            // Wait for all uploads to complete
            newImages = await Promise.all(uploadPromises);
            console.log('All additional images uploaded successfully:', newImages.length);
        }

        // Add new images to existing ones
        auction.images.push(...newImages);

        // Update primary image index if specified
        if (primaryImageIndex !== undefined && primaryImageIndex >= 0 && primaryImageIndex < auction.images.length) {
            auction.primaryImageIndex = primaryImageIndex;
        }

        await auction.save();

        res.status(200).json({
            success: true,
            message: 'Images updated successfully',
            data: {
                images: auction.images,
                primaryImageIndex: auction.primaryImageIndex
            }
        });
    } catch (error) {
        next(error);
    }
};

// Add function to delete auction image
exports.deleteAuctionImage = async (req, res, next) => {
    try {
        const { id, imageIndex } = req.params;

        const auction = await Auction.findById(id);
        if (!auction) {
            return next(new ApiError(404, 'Auction not found'));
        }

        // Check ownership
        if (auction.seller.toString() !== req.user._id.toString()) {
            return next(new ApiError(403, 'Not authorized to update this auction'));
        }

        const imageIndexNum = parseInt(imageIndex);
        if (imageIndexNum < 0 || imageIndexNum >= auction.images.length) {
            return next(new ApiError(400, 'Invalid image index'));
        }

        // Delete from Cloudinary
        const imageToDelete = auction.images[imageIndexNum];
        await cloudinary.uploader.destroy(imageToDelete.publicId);

        // Remove from array
        auction.images.splice(imageIndexNum, 1);

        // Adjust primary image index if necessary
        if (auction.primaryImageIndex >= auction.images.length) {
            auction.primaryImageIndex = auction.images.length - 1;
        } else if (auction.primaryImageIndex > imageIndexNum) {
            auction.primaryImageIndex--;
        }

        await auction.save();

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully',
            data: {
                images: auction.images,
                primaryImageIndex: auction.primaryImageIndex
            }
        });
    } catch (error) {
        next(error);
    }
};

const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Feedback = require('../models/Feedback');
const ApiError = require('../utils/ApiError');

// Get current user's bids
exports.getMyBids = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Find all bids by current user with populated auction info
    const bids = await Bid.find({ bidder: userId })
      .populate({
        path: 'auction',
        select: 'title status endTime currentHighestBid seller category winner',
        populate: {
          path: 'seller',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add bid count for each auction
    const bidsWithCount = await Promise.all(bids.map(async (bid) => {
      if (bid.auction) {
        const bidCount = await Bid.countDocuments({ auction: bid.auction._id });
        return {
          ...bid.toObject(),
          auction: {
            ...bid.auction.toObject(),
            bidCount
          }
        };
      }
      return bid;
    }));

    const total = await Bid.countDocuments({ bidder: userId });

    res.status(200).json({
      success: true,
      data: bidsWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's dashboard statistics
exports.getMyStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'buyer') {
      // Buyer statistics
      const totalBids = await Bid.countDocuments({ bidder: userId });

      // Count active auctions where user has bid
      const activeBids = await Bid.aggregate([
        { $match: { bidder: userId } },
        {
          $lookup: {
            from: 'auctions',
            localField: 'auction',
            foreignField: '_id',
            as: 'auction'
          }
        },
        { $unwind: '$auction' },
        { $match: { 'auction.status': 'active' } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);

      // Count won auctions
      const wonAuctions = await Auction.countDocuments({
        winner: userId,
        status: 'closed'
      });

      // Calculate total spent on won auctions
      const totalSpent = await Bid.aggregate([
        { $match: { bidder: userId } },
        {
          $lookup: {
            from: 'auctions',
            localField: 'auction',
            foreignField: '_id',
            as: 'auction'
          }
        },
        { $unwind: '$auction' },
        {
          $match: {
            'auction.winner': userId,
            'auction.status': 'closed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      stats = {
        totalBids,
        activeAuctions: activeBids.length > 0 ? activeBids[0].count : 0,
        wonAuctions,
        totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
      };
    } else if (userRole === 'seller') {
      // Seller statistics
      const totalAuctions = await Auction.countDocuments({ seller: userId });
      const activeAuctions = await Auction.countDocuments({
        seller: userId,
        status: 'active'
      });
      const closedAuctions = await Auction.countDocuments({
        seller: userId,
        status: 'closed'
      });

      // Calculate total revenue from sold auctions
      const totalRevenue = await Bid.aggregate([
        {
          $lookup: {
            from: 'auctions',
            localField: 'auction',
            foreignField: '_id',
            as: 'auction'
          }
        },
        { $unwind: '$auction' },
        {
          $match: {
            'auction.seller': userId,
            'auction.winner': { $exists: true },
            'auction.status': 'closed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Calculate average sale price
      const avgSalePrice = await Bid.aggregate([
        {
          $lookup: {
            from: 'auctions',
            localField: 'auction',
            foreignField: '_id',
            as: 'auction'
          }
        },
        { $unwind: '$auction' },
        {
          $match: {
            'auction.seller': userId,
            'auction.winner': { $exists: true },
            'auction.status': 'closed'
          }
        },
        {
          $group: {
            _id: null,
            avgPrice: { $avg: '$auction.startingPrice' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Calculate success rate (auctions that sold vs total)
      const successRate = totalAuctions > 0 ? (closedAuctions / totalAuctions) * 100 : 0;

      stats = {
        totalAuctions,
        activeAuctions,
        closedAuctions,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        averageSalePrice: avgSalePrice.length > 0 ? Math.round(avgSalePrice[0].avgPrice * 100) / 100 : 0,
        successRate: Math.round(successRate * 100) / 100
      };
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's auctions (for sellers)
exports.getMyAuctions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { seller: userId };
    if (status) {
      filter.status = status;
    }

    // Find auctions by current user
    const auctions = await Auction.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add bidCount to each auction
    const auctionsWithBidCount = await Promise.all(
      auctions.map(async (auction) => {
        const bidCount = await Bid.countDocuments({ auction: auction._id });
        return {
          ...auction.toObject(),
          bidCount
        };
      })
    );

    const total = await Auction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: auctionsWithBidCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update current user's profile
exports.updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, phone, address, avatar } = req.body;

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData['profile.phone'] = phone;
    if (address !== undefined) updateData['profile.address'] = address;
    if (avatar !== undefined) updateData['profile.avatar'] = avatar;

    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's feedback received
exports.getMyReceivedFeedback = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Find feedback received by current user
    const feedbacks = await Feedback.find({ recipient: userId })
      .populate('author', 'name email role')
      .populate('auction', 'title endTime startingPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ recipient: userId });

    // Calculate average rating
    const ratingStats = await Feedback.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 }
        }
      }
    ]);

    const stats = ratingStats.length > 0 ? {
      averageRating: Math.round(ratingStats[0].averageRating * 10) / 10,
      totalFeedbacks: ratingStats[0].totalFeedbacks
    } : {
      averageRating: 0,
      totalFeedbacks: 0
    };

    res.status(200).json({
      success: true,
      data: feedbacks,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's feedback given
exports.getMyGivenFeedback = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Find feedback given by current user
    const feedbacks = await Feedback.find({ author: userId })
      .populate('recipient', 'name email role')
      .populate('auction', 'title endTime startingPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ author: userId });

    res.status(200).json({
      success: true,
      data: feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

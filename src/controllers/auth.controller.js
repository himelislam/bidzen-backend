const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

// Generate JWT token
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

// Register new user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ApiError('Email already registered', 409));
        }

        // Create new user (password will be hashed by pre-save hook)
        const user = await User.create({
            name,
            email,
            password,
            role
        });

        // Generate token
        const token = generateToken(user._id, user.role);

        // Return user data without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            data: {
                user: userResponse,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// Login user
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return next(new ApiError('Invalid email or password', 401));
        }

        // Check if user is active
        if (!user.isActive) {
            return next(new ApiError('Account has been deactivated', 403));
        }

        // Compare password
        const isPasswordValid = await require('bcryptjs').compare(password, user.password);
        if (!isPasswordValid) {
            return next(new ApiError('Invalid email or password', 401));
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        // Return user data without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            data: {
                user: userResponse,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

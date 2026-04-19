const Joi = require('joi');

// Create auction validation schema
const createAuctionSchema = Joi.object({
    title: Joi.string()
        .required()
        .min(3)
        .max(100)
        .trim()
        .messages({
            'string.empty': 'Title is required',
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 100 characters'
        }),

    description: Joi.string()
        .required()
        .min(10)
        .max(1000)
        .messages({
            'string.empty': 'Description is required',
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description cannot exceed 1000 characters'
        }),

    startingPrice: Joi.number()
        .required()
        .min(1)
        .messages({
            'number.base': 'Starting price must be a number',
            'number.min': 'Starting price must be at least 1',
            'any.required': 'Starting price is required'
        }),

    category: Joi.string()
        .valid('electronics', 'fashion', 'luxury', 'gaming', 'professional', 'collectibles', 'automotive', 'home', 'other')
        .default('other')
        .messages({
            'any.only': 'Category must be one of: electronics, fashion, luxury, gaming, professional, collectibles, automotive, home, other'
        }),

    startTime: Joi.date()
        .required()
        .min('now')
        .messages({
            'date.base': 'Start time must be a valid date',
            'date.min': 'Start time must be in the future',
            'any.required': 'Start time is required'
        }),

    endTime: Joi.date()
        .required()
        .greater(Joi.ref('startTime'))
        .messages({
            'date.base': 'End time must be a valid date',
            'date.greater': 'End time must be after start time',
            'any.required': 'End time is required'
        })
});

// Update auction validation schema (all fields optional)
const updateAuctionSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(100)
        .trim()
        .messages({
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 100 characters'
        }),

    description: Joi.string()
        .min(10)
        .max(1000)
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description cannot exceed 1000 characters'
        }),

    startingPrice: Joi.number()
        .min(1)
        .messages({
            'number.base': 'Starting price must be a number',
            'number.min': 'Starting price must be at least 1'
        }),

    category: Joi.string()
        .valid('electronics', 'fashion', 'luxury', 'gaming', 'professional', 'collectibles', 'automotive', 'home', 'other')
        .messages({
            'any.only': 'Category must be one of: electronics, fashion, luxury, gaming, professional, collectibles, automotive, home, other'
        }),

    startTime: Joi.date()
        .min('now')
        .messages({
            'date.base': 'Start time must be a valid date',
            'date.min': 'Start time must be in the future'
        }),

    endTime: Joi.date()
        .greater(Joi.ref('startTime'))
        .messages({
            'date.base': 'End time must be a valid date',
            'date.greater': 'End time must be after start time'
        })
}).min(1);

// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        next();
    };
};

module.exports = {
    createAuctionSchema,
    updateAuctionSchema,
    validateCreateAuction: validate(createAuctionSchema),
    validateUpdateAuction: validate(updateAuctionSchema)
};

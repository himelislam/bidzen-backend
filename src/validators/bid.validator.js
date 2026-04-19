const Joi = require('joi');

// Bid placement validation schema
const bidSchema = Joi.object({
    amount: Joi.number()
        .required()
        .min(1)
        .messages({
            'number.base': 'Bid amount must be a number',
            'number.min': 'Bid amount must be at least 1',
            'any.required': 'Bid amount is required'
        })
});

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
    bidSchema,
    validateBid: validate(bidSchema)
};

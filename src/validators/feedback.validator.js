const Joi = require('joi');

// Feedback submission validation schema
const feedbackSchema = Joi.object({
    rating: Joi.number()
        .required()
        .integer()
        .min(1)
        .max(5)
        .messages({
            'number.base': 'Rating must be a number',
            'number.integer': 'Rating must be an integer',
            'number.min': 'Rating must be at least 1',
            'number.max': 'Rating cannot exceed 5',
            'any.required': 'Rating is required'
        }),

    reviewText: Joi.string()
        .required()
        .min(10)
        .max(500)
        .trim()
        .messages({
            'string.empty': 'Review text is required',
            'string.min': 'Review text must be at least 10 characters long',
            'string.max': 'Review text cannot exceed 500 characters'
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
    feedbackSchema,
    validateFeedback: validate(feedbackSchema)
};

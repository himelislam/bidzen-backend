const Joi = require('joi');

// Registration validation schema
const registerSchema = Joi.object({
  name: Joi.string()
    .required()
    .min(2)
    .max(50)
    .trim()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),

  email: Joi.string()
    .required()
    .email()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .min(6)
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long'
    }),

  role: Joi.string()
    .required()
    .valid('buyer', 'seller', 'admin')
    .messages({
      'any.only': 'Role must be either buyer, seller, or admin',
      'string.empty': 'Role is required'
    })
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .email()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
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
  registerSchema,
  loginSchema,
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema)
};

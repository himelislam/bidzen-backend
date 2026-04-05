const Joi = require('joi');
require('dotenv').config();

// Configuration validation schema for auction platform
const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),
    MONGO_URI: Joi.string().required(),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    app: {
        port: envVars.PORT,
        environment: envVars.NODE_ENV,
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: envVars.JWT_EXPIRES_IN,
    },
    mongo: {
        uri: envVars.MONGO_URI,
    }
};
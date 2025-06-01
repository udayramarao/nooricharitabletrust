const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(options.statusCode).json(options.message);
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// More aggressive rate limiting for payment endpoints
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // Limit each IP to 10 requests per hour
    message: { error: 'Too many payment attempts, please try again later.' },
    handler: (req, res, next, options) => {
        logger.warn(`Payment rate limit exceeded for IP: ${req.ip}`, {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(options.statusCode).json(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    paymentLimiter
};

// middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

// General rate limiter
export const rateLimit = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
        max: options.max || 100, // Limit each IP to 100 requests per window
        message: {
            success: false,
            message: options.message || 'Too many requests, please try again later.'
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        keyGenerator: (req) => {
            // Use user ID for authenticated users, IP for guests
            return req.user?._id || req.ip;
        }
    });
};

// Specific rate limiters for different endpoints
export const shopCreationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 shops per hour
    message: 'Too many shop creation attempts. Please try again later.'
});

export const reviewRateLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // Max 5 reviews per day per user
    message: 'Too many review submissions. Please try again tomorrow.'
});

export const geocodeRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Max 10 geocode requests per minute
    message: 'Too many geocode requests. Please try again later.'
});
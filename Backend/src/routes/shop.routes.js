// routes/shop.routes.js
import { Router } from "express";
import { 
    createShop, 
    getAllShops, 
    getMyShops,
    getNearbyShops, 
    getShopById, 
    toggleShopStatus,
    updateShop,
    searchShops,
    geocodeAddress,
    calculateRoute,
    deleteShop,
    uploadShopImages,
    getShopImages,
    deleteShopImage,
    addShopService,
    updateShopService,
    deleteShopService,
    getShopStatistics,
    updateShopHours,
    updateShopRating,
    getShopReviews,
    addShopReview,
    updateShopReview,
    deleteShopReview,
    getFeaturedShops
} from "../controllers/shop.controllers.js";
import { verfiyJWT } from "../middlewares/auth.middlewares.js";
import { requireVerifiedEmail } from "../middlewares/requireVerifiedEmail.js";
import { requireBarberOrAdmin } from "../middlewares/requireBarberOrAdmin.js";
import { upload } from "../middlewares/multer.middlewares.js";


const router = Router();

// ============ PUBLIC ROUTES ============

/**
 * @route GET /api/v1/shops
 * @desc Get all shops with filters and pagination
 * @access Public
 */
router.get('/', getAllShops);

/**
 * @route GET /api/v1/shops/featured
 * @desc Get featured shops
 * @access Public
 */
router.get('/featured', getFeaturedShops);

/**
 * @route GET /api/v1/shops/nearby
 * @desc Get nearby shops based on coordinates
 * @access Public
 * @query {number} latitude - User's latitude
 * @query {number} longitude - User's longitude
 * @query {number} [distance=5000] - Search radius in meters (default 5km)
 * @query {string} [services] - Comma-separated service names to filter
 */
router.get('/nearby', getNearbyShops);

/**
 * @route GET /api/v1/shops/search
 * @desc Search shops with advanced filters
 * @access Public
 * @query {string} query - Search query
 * @query {number} [latitude] - User's latitude for location-based search
 * @query {number} [longitude] - User's longitude for location-based search
 * @query {number} [radius=5000] - Search radius in meters
 * @query {number} [minPrice] - Minimum service price
 * @query {number} [maxPrice] - Maximum service price
 * @query {string} [serviceType] - Type of service to filter
 */
router.get('/search', searchShops);

/**
 * @route GET /api/v1/shops/:shopId
 * @desc Get shop by ID
 * @access Public
 * @param {string} shopId - Shop ID
 */
router.get('/:shopId', getShopById);

/**
 * @route POST /api/v1/shops/geocode
 * @desc Geocode address to coordinates
 * @access Public
 * @body {string} address - Address to geocode
 */
router.post('/geocode', geocodeAddress);

/**
 * @route GET /api/v1/shops/route/calculate
 * @desc Calculate route between two points
 * @access Public
 * @query {number} originLat - Origin latitude
 * @query {number} originLng - Origin longitude
 * @query {number} destinationLat - Destination latitude
 * @query {number} destinationLng - Destination longitude
 */
router.get('/route/calculate', calculateRoute);

/**
 * @route GET /api/v1/shops/:shopId/reviews
 * @desc Get shop reviews
 * @access Public
 * @param {string} shopId - Shop ID
 */
router.get('/:shopId/reviews', getShopReviews);

// ============ PROTECTED ROUTES (Require Auth) ============

// Apply authentication middleware to all protected routes
router.use(verfiyJWT);

/**
 * @route GET /api/v1/shops/my/shops
 * @desc Get current user's shops
 * @access Private (Barber/Admin only)
 */
router.get('/my/shops', requireBarberOrAdmin, getMyShops);

/**
 * @route GET /api/v1/shops/:shopId/statistics
 * @desc Get shop statistics
 * @access Private (Shop Owner/Admin only)
 */
router.get('/:shopId/statistics', getShopStatistics);

// ============ BARBER/ADMIN ONLY ROUTES ============

// Apply barber/admin middleware to shop management routes
router.use(requireBarberOrAdmin);

/**
 * @route POST /api/v1/shops/create
 * @desc Create a new shop
 * @access Private (Barber/Admin only)
 * @body {string} name - Shop name
 * @body {string} phone - Shop phone number
 * @body {object} address - Shop address object
 * @body {array} [services] - Array of services
 * @body {number} [longitude] - Longitude coordinate
 * @body {number} [latitude] - Latitude coordinate
 */
router.post('/create', createShop);

/**
 * @route PUT /api/v1/shops/update/:shopId
 * @desc Update shop information
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 * @body {string} [name] - Shop name
 * @body {object} [address] - Shop address
 * @body {string} [phone] - Shop phone
 * @body {array} [services] - Shop services
 * @body {number} [averageWaitTime] - Average wait time
 * @body {boolean} [isActive] - Shop active status
 */
router.put('/update/:shopId', updateShop);

/**
 * @route PATCH /api/v1/shops/:shopId/toggle
 * @desc Toggle shop active status
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 */
router.patch('/:shopId/toggle', toggleShopStatus);

/**
 * @route DELETE /api/v1/shops/:shopId
 * @desc Delete shop
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 */
router.delete('/:shopId', deleteShop);

/**
 * @route PATCH /api/v1/shops/:shopId/hours
 * @desc Update shop operating hours
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 * @body {object} operatingHours - Updated operating hours
 */
router.patch('/:shopId/hours', updateShopHours);

// ============ SHOP IMAGES ROUTES ============

/**
 * @route POST /api/v1/shops/:shopId/images
 * @desc Upload shop images
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 * @formData {file[]} images - Shop images (max 5 files, 5MB each)
 */
router.post('/:shopId/images', 
    upload.array('images', 5), // Max 5 images
    uploadShopImages
);

/**
 * @route GET /api/v1/shops/:shopId/images
 * @desc Get shop images
 * @access Public (but requires auth for some info)
 * @param {string} shopId - Shop ID
 */
router.get('/:shopId/images', getShopImages);

/**
 * @route DELETE /api/v1/shops/:shopId/images/:imageId
 * @desc Delete shop image
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 * @param {string} imageId - Image ID or filename
 */
router.delete('/:shopId/images/:imageId', deleteShopImage);

// ============ SHOP SERVICES ROUTES ============

/**
 * @route POST /api/v1/shops/:shopId/services
 * @desc Add new service to shop
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 * @body {string} name - Service name
 * @body {number} price - Service price
 * @body {number} [duration] - Service duration in minutes
 * @body {string} [description] - Service description
 */
router.post('/:shopId/services', addShopService);

/**
 * @route PUT /api/v1/shops/:shopId/services/:serviceId
 * @desc Update shop service
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 * @param {string} serviceId - Service ID
 * @body {string} [name] - Service name
 * @body {number} [price] - Service price
 * @body {number} [duration] - Service duration
 * @body {string} [description] - Service description
 */
router.put('/:shopId/services/:serviceId', updateShopService);

/**
 * @route DELETE /api/v1/shops/:shopId/services/:serviceId
 * @desc Delete shop service
 * @access Private (Shop Owner/Admin only)
 * @param {string} shopId - Shop ID
 * @param {string} serviceId - Service ID
 */
router.delete('/:shopId/services/:serviceId', deleteShopService);

// ============ SHOP REVIEWS ROUTES ============

/**
 * @route POST /api/v1/shops/:shopId/reviews
 * @desc Add review to shop
 * @access Private (Verified Users only)
 * @param {string} shopId - Shop ID
 * @body {number} rating - Rating (1-5)
 * @body {string} comment - Review comment
 */
router.post('/:shopId/reviews', requireVerifiedEmail, addShopReview);

/**
 * @route PUT /api/v1/shops/:shopId/reviews/:reviewId
 * @desc Update shop review
 * @access Private (Review Author only)
 * @param {string} shopId - Shop ID
 * @param {string} reviewId - Review ID
 * @body {number} [rating] - Updated rating
 * @body {string} [comment] - Updated comment
 */
router.put('/:shopId/reviews/:reviewId', updateShopReview);

/**
 * @route DELETE /api/v1/shops/:shopId/reviews/:reviewId
 * @desc Delete shop review
 * @access Private (Review Author or Admin only)
 * @param {string} shopId - Shop ID
 * @param {string} reviewId - Review ID
 */
router.delete('/:shopId/reviews/:reviewId', deleteShopReview);

/**
 * @route PATCH /api/v1/shops/:shopId/rating
 * @desc Update shop rating (internal use, triggered by reviews)
 * @access Private (System/Admin only)
 * @param {string} shopId - Shop ID
 */
router.patch('/:shopId/rating', updateShopRating);

export default router;
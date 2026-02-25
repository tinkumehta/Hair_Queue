// controllers/shop.controllers.js
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"; 
import Shop from "../models/shop.models.js";
import User from '../models/user.models.js'
import mongoose from "mongoose";
import googleMapsService from "../middlewares/googleMaps.service.js"; 
import fs from 'fs';
import path from 'path';

// ============ EXISTING FUNCTIONS ============

export const createShop = asyncHandler(async (req, res) => {
    const { 
        name, 
        phone, 
        email,
        description,
        address, 
        services, 
        longitude, 
        latitude,
        operatingHours 
    } = req.body;

    // Validation
    if (!name || !phone || !address) {
        throw new ApiError(400, "Name, phone, and address are required");
    }

    // Check if shop with the same name already exists
    const existingShop = await Shop.findOne({
        name,
        owner: req.user._id
    });
    
    if (existingShop) {
        throw new ApiError(409, "You already have a shop with this name");
    }

    let coordinates = [0, 0];
    
    // If latitude and longitude provided, use them
    if (longitude && latitude) {
        coordinates = [parseFloat(longitude), parseFloat(latitude)];
    } 
    // Otherwise, try to geocode the address
    else if (address.street && address.city) {
        try {
            const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.country}`;
            const geocodeResult = await googleMapsService.geocodeAddress(fullAddress);
            coordinates = [geocodeResult.longitude, geocodeResult.latitude];
        } catch (error) {
            console.error('Geocoding failed:', error.message);
            // Continue with default coordinates
        }
    }

    // Create shop
    const shop = await Shop.create({
        name,
        owner: req.user._id,
        address,
        phone,
        email,
        description,
        services: services || [],
        location: {
            type: 'Point',
            coordinates: coordinates
        },
        operatingHours: operatingHours || {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '10:00', close: '16:00' },
            sunday: { open: '10:00', close: '14:00' }
        }
    });

    const createdShop = await Shop.findById(shop._id)
        .populate('owner', 'fullName email phone avatar');
    
    return res.status(201).json(
        new ApiResponse(201, createdShop, "Shop created successfully")
    );
});

export const getAllShops = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        city, 
        search, 
        minWaitTime,
        maxWaitTime,
        featured,
        sort = 'newest',
        minRating = 0
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (city) {
        filter['address.city'] = { $regex: city, $options: 'i' };
    }

    if (search) {
        filter.$text = { $search: search };
    }

    if (minWaitTime) {
        filter.averageWaitTime = { $gte: parseInt(minWaitTime) };
    }

    if (maxWaitTime) {
        filter.averageWaitTime = { 
            ...filter.averageWaitTime,
            $lte: parseInt(maxWaitTime)
        };
    }

    if (featured === 'true') {
        filter.featured = true;
    }

    if (minRating) {
        filter.rating = { $gte: parseFloat(minRating) };
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    switch(sort) {
        case 'waitTime':
            sortOption = { averageWaitTime: 1 };
            break;
        case 'rating':
            sortOption = { rating: -1 };
            break;
        case 'name':
            sortOption = { name: 1 };
            break;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const shops = await Shop.find(filter)
        .populate('owner', 'fullName phone avatar')
        .select('-location.coordinates')
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortOption);

    const totalShops = await Shop.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            shops,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalShops,
                pages: Math.ceil(totalShops / parseInt(limit))
            }
        }, "Shops fetched successfully")
    );
});

// ============ MISSING FUNCTIONS ============

export const getMyShops = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const shops = await Shop.find({ owner: req.user._id })
        .populate('owner', 'fullName email phone avatar')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const totalShops = await Shop.countDocuments({ owner: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, {
            shops,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalShops,
                pages: Math.ceil(totalShops / parseInt(limit))
            }
        }, "Your shops fetched successfully")
    );
});

export const getShopById = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    const shop = await Shop.findById(shopId)
        .populate('owner', 'fullName email phone avatar');

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Get nearby places for recommendations
    let nearbyPlaces = [];
    try {
        nearbyPlaces = await googleMapsService.findNearbyPlaces(
            shop.location.coordinates[1],
            shop.location.coordinates[0],
            1000,
            'cafe,restaurant,parking'
        );
    } catch (error) {
        console.error('Failed to fetch nearby places:', error.message);
    }

    const shopObj = shop.toObject();
    shopObj.nearbyPlaces = nearbyPlaces.slice(0, 5); // Return top 5 nearby places
    
    return res.status(200).json(
        new ApiResponse(200, shopObj, "Shop fetched successfully")
    );
});

export const updateShop = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const { name, address, phone, services, averageWaitTime, isActive, description, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    // Find shop
    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to update this shop");
    }

    // Update fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (address !== undefined) updateFields.address = address;
    if (phone !== undefined) updateFields.phone = phone;
    if (services !== undefined) updateFields.services = services;
    if (averageWaitTime !== undefined) updateFields.averageWaitTime = averageWaitTime;
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (description !== undefined) updateFields.description = description;
    if (email !== undefined) updateFields.email = email;

    // Update shop
    const updatedShop = await Shop.findByIdAndUpdate(
        shopId,
        { $set: updateFields },
        { 
            new: true,
            runValidators: true 
        }
    ).populate('owner', 'fullName email phone avatar');

    return res.status(200).json(
        new ApiResponse(200, updatedShop, "Shop updated successfully")
    );
});

export const toggleShopStatus = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop ID");
    }
    
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to update this shop");
    }

    shop.isActive = !shop.isActive;
    await shop.save();
    
    return res.status(200).json(
        new ApiResponse(200, { isActive: shop.isActive }, "Shop status updated")
    );
});

export const getNearbyShops = asyncHandler(async (req, res) => {
    const { 
        latitude, 
        longitude, 
        distance = 5000, // Default 5km
        limit = 20,
        services 
    } = req.query;

    if (!latitude || !longitude) {
        throw new ApiError(400, "Latitude and longitude are required");
    }

    // Build filter
    const filter = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                $maxDistance: parseInt(distance)
            }
        },
        isActive: true
    };

    // Filter by services if provided
    if (services) {
        const serviceList = services.split(',');
        filter['services.name'] = { $in: serviceList };
    }

    const shops = await Shop.find(filter)
        .populate('owner', 'fullName phone avatar')
        .limit(parseInt(limit));

    // Calculate distances for each shop
    const shopsWithDistance = await Promise.all(
        shops.map(async (shop) => {
            const shopObj = shop.toObject();
            
            try {
                const distanceResult = await googleMapsService.calculateDistance(
                    { lat: parseFloat(latitude), lng: parseFloat(longitude) },
                    { lat: shop.location.coordinates[1], lng: shop.location.coordinates[0] }
                );
                
                shopObj.distance = distanceResult.distance;
                shopObj.duration = distanceResult.duration;
            } catch (error) {
                console.error('Distance calculation error:', error.message);
            }
            
            return shopObj;
        })
    );

    // Sort by distance
    shopsWithDistance.sort((a, b) => {
        const distA = a.distance?.value || Infinity;
        const distB = b.distance?.value || Infinity;
        return distA - distB;
    });

    return res.status(200).json(
        new ApiResponse(200, shopsWithDistance, "Nearby shops fetched successfully")
    );
});

export const searchShops = asyncHandler(async (req, res) => {
    const { 
        query, 
        latitude, 
        longitude, 
        radius = 5000,
        minPrice,
        maxPrice,
        serviceType 
    } = req.query;

    if (!query) {
        throw new ApiError(400, "Search query is required");
    }

    let filter = { isActive: true };
    
    // Text search
    if (query) {
        filter.$text = { $search: query };
    }

    // Geolocation search
    if (latitude && longitude) {
        filter.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                $maxDistance: parseInt(radius)
            }
        };
    }

    // Service filter
    if (serviceType) {
        filter['services.name'] = { $regex: serviceType, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
        filter['services.price'] = {};
        if (minPrice) {
            filter['services.price'].$gte = parseFloat(minPrice);
        }
        if (maxPrice) {
            filter['services.price'].$lte = parseFloat(maxPrice);
        }
    }

    const shops = await Shop.find(filter)
        .populate('owner', 'fullName phone avatar')
        .limit(20);

    return res.status(200).json(
        new ApiResponse(200, shops, "Shops search results")
    );
});

export const geocodeAddress = asyncHandler(async (req, res) => {
    const { address } = req.body;

    if (!address) {
        throw new ApiError(400, "Address is required");
    }

    try {
        const result = await googleMapsService.geocodeAddress(address);
        
        return res.status(200).json(
            new ApiResponse(200, result, "Address geocoded successfully")
        );
    } catch (error) {
        throw new ApiError(500, `Geocoding failed: ${error.message}`);
    }
});

export const calculateRoute = asyncHandler(async (req, res) => {
    const { originLat, originLng, destinationLat, destinationLng } = req.query;

    if (!originLat || !originLng || !destinationLat || !destinationLng) {
        throw new ApiError(400, "Origin and destination coordinates are required");
    }

    try {
        const result = await googleMapsService.calculateDistance(
            { lat: parseFloat(originLat), lng: parseFloat(originLng) },
            { lat: parseFloat(destinationLat), lng: parseFloat(destinationLng) }
        );

        return res.status(200).json(
            new ApiResponse(200, result, "Route calculated successfully")
        );
    } catch (error) {
        throw new ApiError(500, `Route calculation failed: ${error.message}`);
    }
});

// Delete shop
export const deleteShop = asyncHandler(async (req, res) => {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to delete this shop");
    }

    // Soft delete (update isActive to false)
    shop.isActive = false;
    shop.deletedAt = new Date();
    await shop.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Shop deleted successfully")
    );
});

// Upload shop images
export const uploadShopImages = asyncHandler(async (req, res) => {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to upload images for this shop");
    }

    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "No images uploaded");
    }

    // Get uploaded file paths
    const imagePaths = req.files.map(file => 
        `/uploads/shops/${shopId}/${file.filename}`
    );

    // Add images to shop
    shop.images = [...(shop.images || []), ...imagePaths];
    await shop.save();

    return res.status(200).json(
        new ApiResponse(200, { images: imagePaths }, "Images uploaded successfully")
    );
});

// Get shop images
export const getShopImages = asyncHandler(async (req, res) => {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    const shop = await Shop.findById(shopId).select('images');

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { images: shop.images || [] }, "Shop images retrieved successfully")
    );
});

// Delete shop image
export const deleteShopImage = asyncHandler(async (req, res) => {
    const { shopId, imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to delete images for this shop");
    }

    // Find image index
    const imageIndex = shop.images.findIndex(img => 
        img.includes(imageId) || img === imageId
    );

    if (imageIndex === -1) {
        throw new ApiError(404, "Image not found");
    }

    // Remove image from filesystem
    const imagePath = shop.images[imageIndex];
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }

    // Remove image from array
    shop.images.splice(imageIndex, 1);
    await shop.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Image deleted successfully")
    );
});

// Add shop service
export const addShopService = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const { name, price, duration, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    if (!name || !price) {
        throw new ApiError(400, "Service name and price are required");
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to add services to this shop");
    }

    // Add new service
    const newService = {
        name,
        price: parseFloat(price),
        duration: duration ? parseInt(duration) : 30,
        description: description || ''
    };

    shop.services.push(newService);
    await shop.save();

    return res.status(201).json(
        new ApiResponse(201, { service: newService }, "Service added successfully")
    );
});

// Update shop service
export const updateShopService = asyncHandler(async (req, res) => {
    const { shopId, serviceId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to update services for this shop");
    }

    // Find service index
    const serviceIndex = shop.services.findIndex(service => 
        service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
        throw new ApiError(404, "Service not found");
    }

    // Update service
    if (updates.name) shop.services[serviceIndex].name = updates.name;
    if (updates.price) shop.services[serviceIndex].price = parseFloat(updates.price);
    if (updates.duration) shop.services[serviceIndex].duration = parseInt(updates.duration);
    if (updates.description !== undefined) shop.services[serviceIndex].description = updates.description;

    await shop.save();

    return res.status(200).json(
        new ApiResponse(200, { service: shop.services[serviceIndex] }, "Service updated successfully")
    );
});

// Delete shop service
export const deleteShopService = asyncHandler(async (req, res) => {
    const { shopId, serviceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to delete services from this shop");
    }

    // Check if it's the last service
    if (shop.services.length <= 1) {
        throw new ApiError(400, "Cannot delete the last service. Add another service first.");
    }

    // Find service index
    const serviceIndex = shop.services.findIndex(service => 
        service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
        throw new ApiError(404, "Service not found");
    }

    // Remove service
    shop.services.splice(serviceIndex, 1);
    await shop.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Service deleted successfully")
    );
});

// Get shop statistics
export const getShopStatistics = asyncHandler(async (req, res) => {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to view statistics for this shop");
    }

    // Get queue statistics (you'll need to implement queue model)
    // For now, return basic stats
    const stats = {
        averageWaitTime: shop.averageWaitTime || 15,
        totalServices: shop.services.length,
        totalReviews: shop.totalRatings || 0,
        averageRating: shop.rating || 0,
        isActive: shop.isActive,
        createdAt: shop.createdAt,
        totalCustomers: 0, // Placeholder
        todayCustomers: 0, // Placeholder
        // Add more statistics as needed
    };

    return res.status(200).json(
        new ApiResponse(200, stats, "Shop statistics retrieved successfully")
    );
});

// Update shop operating hours
export const updateShopHours = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const { operatingHours } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    if (!operatingHours) {
        throw new ApiError(400, "Operating hours are required");
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Check authorization
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to update operating hours for this shop");
    }

    // Update operating hours
    shop.operatingHours = operatingHours;
    await shop.save();

    return res.status(200).json(
        new ApiResponse(200, { operatingHours: shop.operatingHours }, "Operating hours updated successfully")
    );
});

// Update shop rating (called when reviews are added/updated)
export const updateShopRating = asyncHandler(async (req, res) => {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    // Get all reviews for this shop
    // Note: You need to create a Review model first
    // For now, this is a placeholder
    const reviews = []; // Placeholder

    if (reviews.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { rating: 0, totalRatings: 0 }, "No reviews found")
        );
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Update shop
    const shop = await Shop.findByIdAndUpdate(
        shopId,
        {
            rating: parseFloat(averageRating.toFixed(1)),
            totalRatings: reviews.length
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, { 
            rating: shop.rating, 
            totalRatings: shop.totalRatings 
        }, "Shop rating updated successfully")
    );
});

// Get shop reviews
export const getShopReviews = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Get reviews with pagination
    // Note: You need to create a Review model first
    // For now, return empty array
    const reviews = [];
    const totalReviews = 0;

    return res.status(200).json(
        new ApiResponse(200, {
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalReviews,
                pages: Math.ceil(totalReviews / parseInt(limit))
            }
        }, "Reviews retrieved successfully")
    );
});

// Add shop review
export const addShopReview = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new ApiError(400, "Invalid shop id");
    }

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Note: You need to implement Review model first
    // For now, return a placeholder response
    const review = {
        _id: new mongoose.Types.ObjectId(),
        shop: shopId,
        user: req.user._id,
        rating: parseInt(rating),
        comment: comment || '',
        createdAt: new Date()
    };

    // Update shop rating (placeholder)
    const newRating = (shop.rating * shop.totalRatings + parseInt(rating)) / (shop.totalRatings + 1);
    shop.rating = parseFloat(newRating.toFixed(1));
    shop.totalRatings = (shop.totalRatings || 0) + 1;
    await shop.save();

    return res.status(201).json(
        new ApiResponse(201, { review }, "Review added successfully")
    );
});

// Update shop review
export const updateShopReview = asyncHandler(async (req, res) => {
    const { shopId, reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
        throw new ApiError(400, "Invalid shop or review id");
    }

    // Note: You need to implement Review model first
    // For now, return a placeholder response
    const review = {
        _id: reviewId,
        shop: shopId,
        user: req.user._id,
        rating: rating ? parseInt(rating) : 4,
        comment: comment || 'Updated review',
        updatedAt: new Date()
    };

    return res.status(200).json(
        new ApiResponse(200, { review }, "Review updated successfully")
    );
});

// Delete shop review
export const deleteShopReview = asyncHandler(async (req, res) => {
    const { shopId, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
        throw new ApiError(400, "Invalid shop or review id");
    }

    // Note: You need to implement Review model first
    // For now, return a placeholder response

    return res.status(200).json(
        new ApiResponse(200, {}, "Review deleted successfully")
    );
});

// Get featured shops
export const getFeaturedShops = asyncHandler(async (req, res) => {
    const { limit = 6 } = req.query;

    const shops = await Shop.find({ 
        featured: true, 
        isActive: true 
    })
    .populate('owner', 'fullName avatar')
    .limit(parseInt(limit))
    .sort({ rating: -1, createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, shops, "Featured shops retrieved successfully")
    );
});
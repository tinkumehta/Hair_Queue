// services/shop.service.js
import api from '../../context/api';

export const shopService = {
  // Create shop
  createShop: async (shopData) => {
    try {
      const response = await api.post('/shop/create', shopData);
      return response.data;
    } catch (error) {
     // console.error('Create shop error:', error);
      throw error;
    }
  },

  // Get all shops
  getAllShops: async (params = {}) => {
    try {
      const response = await api.get('/shop', { params });
      return response.data;
    } catch (error) {
    //  console.error('Get all shops error:', error);
      throw error;
    }
  },

  // Get my shops
  getMyShops: async (params = {}) => {
    try {
      const response = await api.get('/shop/my/shops', { params });
      return response.data;
    } catch (error) {
     // console.error('Get my shops error:', error);
      throw error;
    }
  },

  // Get nearby shops
  getNearbyShops: async (latitude, longitude, distance = 5000, services = '') => {
    try {
      const params = { latitude, longitude, distance };
      if (services) params.services = services;
      const response = await api.get('/shop/nearby', { params });
      return response.data;
    } catch (error) {
      console.error('Get nearby shops error:', error);
      throw error;
    }
  },

  // Get shop by ID
  getShopById: async (shopId) => {
    try {
      const response = await api.get(`/shop/${shopId}`);
      return response.data;
    } catch (error) {
      console.error('Get shop by ID error:', error);
      throw error;
    }
  },

  // Update shop
  updateShop: async (shopId, shopData) => {
    try {
      const response = await api.put(`/shop/update/${shopId}`, shopData);
      return response.data;
    } catch (error) {
      console.error('Update shop error:', error);
      throw error;
    }
  },

  // Toggle shop status
  toggleShopStatus: async (shopId) => {
    try {
      const response = await api.patch(`/shop/${shopId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Toggle shop status error:', error);
      throw error;
    }
  },

  // Search shops
  searchShops: async (query, filters = {}) => {
    try {
      const params = { query, ...filters };
      const response = await api.get('/shop/search', { params });
      return response.data;
    } catch (error) {
      console.error('Search shops error:', error);
      throw error;
    }
  },

  // Get featured shops
  getFeaturedShops: async (limit = 6) => {
    try {
      const response = await api.get('/shop/featured', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Get featured shops error:', error);
      throw error;
    }
  },

  // Geocode address
  geocodeAddress: async (address) => {
    try {
      const response = await api.post('/shop/geocode', { address });
      return response.data;
    } catch (error) {
      console.error('Geocode error:', error);
      throw error;
    }
  },

  // Calculate route
  calculateRoute: async (originLat, originLng, destLat, destLng) => {
    try {
      const params = { originLat, originLng, destinationLat: destLat, destinationLng: destLng };
      const response = await api.get('/shop/route/calculate', { params });
      return response.data;
    } catch (error) {
      console.error('Calculate route error:', error);
      throw error;
    }
  },

  // Delete shop
  deleteShop: async (shopId) => {
    try {
      const response = await api.delete(`/shop/${shopId}`);
      return response.data;
    } catch (error) {
      console.error('Delete shop error:', error);
      throw error;
    }
  },

  // Add service to shop
  addService: async (shopId, serviceData) => {
    try {
      const response = await api.post(`/shop/${shopId}/services`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Add service error:', error);
      throw error;
    }
  },

  // Update service
  updateService: async (shopId, serviceId, serviceData) => {
    try {
      const response = await api.put(`/shop/${shopId}/services/${serviceId}`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Update service error:', error);
      throw error;
    }
  },

  // Remove service from shop
  removeService: async (shopId, serviceId) => {
    try {
      const response = await api.delete(`/shop/${shopId}/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error('Remove service error:', error);
      throw error;
    }
  },

  // Get shop statistics
  getShopStatistics: async (shopId) => {
    try {
      const response = await api.get(`/shop/${shopId}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Get shop statistics error:', error);
      throw error;
    }
  },

  // Update shop hours
  updateShopHours: async (shopId, operatingHours) => {
    try {
      const response = await api.patch(`/shop/${shopId}/hours`, { operatingHours });
      return response.data;
    } catch (error) {
      console.error('Update shop hours error:', error);
      throw error;
    }
  },

  // Upload shop images
  uploadShopImages: async (shopId, images) => {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append('images', image);
      });
      
      const response = await api.post(`/shop/${shopId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Upload images error:', error);
      throw error;
    }
  },

  // Get shop images
  getShopImages: async (shopId) => {
    try {
      const response = await api.get(`/shop/${shopId}/images`);
      return response.data;
    } catch (error) {
      console.error('Get shop images error:', error);
      throw error;
    }
  },

  // Delete shop image
  deleteShopImage: async (shopId, imageId) => {
    try {
      const response = await api.delete(`/shop/${shopId}/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Delete shop image error:', error);
      throw error;
    }
  },

  // Add shop review
  addShopReview: async (shopId, reviewData) => {
    try {
      const response = await api.post(`/shop/${shopId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Add shop review error:', error);
      throw error;
    }
  },

  // Get shop reviews
  getShopReviews: async (shopId, params = {}) => {
    try {
      const response = await api.get(`/shop/${shopId}/reviews`, { params });
      return response.data;
    } catch (error) {
      console.error('Get shop reviews error:', error);
      throw error;
    }
  },

  // Update shop review
  updateShopReview: async (shopId, reviewId, reviewData) => {
    try {
      const response = await api.put(`/shop/${shopId}/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Update shop review error:', error);
      throw error;
    }
  },

  // Delete shop review
  deleteShopReview: async (shopId, reviewId) => {
    try {
      const response = await api.delete(`/shop/${shopId}/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Delete shop review error:', error);
      throw error;
    }
  }
};
import api from './api';

export const queueService = {
  // Join queue - FIXED URL
  joinQueue: async (shopId, service) => {
    const response = await api.post(`/queue/${shopId}/join`, { service }); // Keep as '/queue/:shopId/join'
    return response.data;
  },

  // Leave queue - FIXED URL
  leaveQueue: async (queueId) => {
    const response = await api.delete(`/queue/${queueId}/leave`); // Keep as '/queue/:queueId/leave'
    return response.data;
  },

  // Get shop queue - FIXED URL
  getShopQueue: async (shopId) => {
    const response = await api.get(`/queue/shop/${shopId}`); // Keep as '/queue/shop/:shopId'
    return response.data;
  },

  // Next customer - FIXED URL
  nextCustomer: async (shopId) => {
    const response = await api.post(`/queue/${shopId}/next`); // Keep as '/queue/:shopId/next'
    return response.data;
  }
};
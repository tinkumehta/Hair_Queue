import api from './api';

export const authService = {
  // Register user - FIXED URL
  register: async (userData) => {
    const response = await api.post('/users/register', userData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Login user - FIXED URL
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  // Logout user - FIXED URL
  logout: async () => {
    const response = await api.post('/users/logout');
    return response.data;
  },

  // Get current user - FIXED URL
  getCurrentUser: async () => {
    const response = await api.get('/users/current-user');
    return response.data;
  },

  // Change password - FIXED URL
  changePassword: async (passwordData) => {
    const response = await api.post('/users/change-password', passwordData);
    return response.data;
  }
};
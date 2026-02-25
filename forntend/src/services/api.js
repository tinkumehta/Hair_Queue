import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL =  import.meta.VITE_APP_API_URL || 'http://localhost:5000/api/v1';

console.log('API Base URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
   // console.log(`Making ${config.method.toUpperCase()} request to:`, config.url); // Debug log
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request'); // Debug log
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
  //  console.log(`Response from ${response.config.url}:`, response.status); // Debug log
    return response;
  },
  (error) => {
    const { response } = error;
    
    console.error('API Error:', {
      url: error.config?.url,
      status: response?.status,
      data: response?.data,
      message: error.message
    }); // Debug log
    
    if (response) {
      switch (response.status) {
        case 401:
          // Token expired or invalid
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
          }
          break;
        
        case 403:
          toast.error('You do not have permission to access this resource.');
          break;
        
        case 404:
          toast.error(`Resource not found: ${error.config?.url}`);
          break;
        
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        
        default:
          if (response.data?.message) {
            toast.error(response.data.message);
          } else {
            toast.error('Something went wrong.');
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
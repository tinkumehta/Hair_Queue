import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL =  'http://localhost:5000/api/v1';

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
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
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
          toast.error('Resource not found.');
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
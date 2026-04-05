/**
 * Axios Instance
 * Configured with base URL and auth token interceptor
 */
import axios from 'axios';

const API = axios.create({
  baseURL: '', // Uses Vite proxy
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mobiflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (expired token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mobiflow_token');
      localStorage.removeItem('mobiflow_user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;

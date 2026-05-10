// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const rawBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Normalize environment URL values to avoid malformed bases like ":5000"
const normalizeBase = (raw) => {
  if (!raw) return 'http://localhost:5000/api';

  let trimmed = String(raw).trim().replace(/\/$/, '');

  // If value is like ":5000" -> assume localhost
  if (/^:\d+$/.test(trimmed)) {
    trimmed = `http://localhost${trimmed}`;
  }

  // If host:port without protocol (e.g. "localhost:5000") -> add http://
  if (/^[^/:]+:\d+$/.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }

  // If missing protocol but starts with a hostname, add http://
  if (!/^https?:\/\//i.test(trimmed) && !/^\/\//.test(trimmed)) {
    if (trimmed.startsWith('/')) {
      trimmed = `http://localhost:5000${trimmed}`;
    } else if (!trimmed.includes('://')) {
      trimmed = `http://${trimmed}`;
    }
  }

  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

const baseURL = normalizeBase(rawBase);

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
            refreshToken
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      toast.error('Request timed out. Please try again.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('Something went wrong. Please try again.');
    }

    return Promise.reject(error);
  }
);

export { api, setTokens, clearTokens, getAccessToken };
export default api;
// src/api/axios.js
import axios from 'axios';
import toast from 'react-hot-toast';
import { showLoader, hideLoader } from '../utils/loaderEvent';
import { MOCK_DATA } from './mockData';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Ensure this matches your backend URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Show loader only for "processes" (POST, PUT, PATCH, DELETE)
    // or if explicitly requested via config.showLoader = true
    if (config.method !== 'get' || config.showLoader) {
      showLoader();
    }
    return config;
  },
  (error) => {
    hideLoader();
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    hideLoader();
    return response;
  },
  (error) => {
    hideLoader();

    // 1. Handle Network Errors (API Refused / Server Down)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const requestUrl = error.config.url;
      const mockKey = Object.keys(MOCK_DATA).find(key => requestUrl.includes(key));

      if (mockKey) {
        console.warn(`[Mock Mode] Serving mock data for: ${requestUrl}`);
        window.dispatchEvent(new Event('mock-mode-active'));
        return Promise.resolve({
          data: {
            success: true,
            data: MOCK_DATA[mockKey],
            message: "Data retrieved from local mock store"
          },
          status: 200,
        });
      } else {
        toast.error("Network Error: Backend is unreachable.");
      }
    }

    // 2. Global Error Handling
    const errorMessage = error.response?.data?.message || error.message || "Something went wrong";
    
    // Prevent duplicate toasts for 401 (Auth logic might handle redirects)
    if (error.response?.status !== 401) {
      toast.error(errorMessage);
    } else {
      // Optional: Specific message for session expiry
      // toast.error("Session expired. Please login again.");
    }

    return Promise.reject(error);
  }
);

export default api;
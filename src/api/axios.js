// src/api/axios.js
import axios from 'axios';
import { MOCK_DATA } from './mockData';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle Network Errors (API Refused / Server Down)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const requestUrl = error.config.url;
      
      // Find matching mock data key
      // Checks if the request URL contains the key (e.g. '/orders/restaurant' matches '/orders/restaurant/new')
      const mockKey = Object.keys(MOCK_DATA).find(key => requestUrl.includes(key));

      if (mockKey) {
        console.warn(`[Mock Mode] Serving mock data for: ${requestUrl}`);
        
        // Signal the app to show the Mock Banner (using a custom event)
        window.dispatchEvent(new Event('mock-mode-active'));

        return Promise.resolve({
          data: {
            success: true,
            data: MOCK_DATA[mockKey],
            message: "Data retrieved from local mock store (Server Unavailable)"
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config
        });
      }
    }

    // 2. Handle 401 Unauthorized (Normal Auth Flow)
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.startsWith('/auth')) {
        // window.location.href = '/auth/login'; // Optional: Comment out during dev if you want to stay on page
      }
    }
    return Promise.reject(error);
  }
);

export default api;
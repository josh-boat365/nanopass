// src/services/apiClient.js

import axios from 'axios';
import { API_CONFIG } from '@/config/apiConfig';
import { useUserStore } from '@/stores/useUserStore';

// Create axios instance with base configuration
const apiClient = axios.create(API_CONFIG);

// Request interceptor - runs before every request
apiClient.interceptors.request.use(
    (config) => {
        // Get the authentication token from localStorage
        const token = localStorage.getItem('auth_token');

        // If token exists, add it to the Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // You can also add other headers here if needed
        // config.headers['X-Custom-Header'] = 'value';

        return config;
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
);

// Response interceptor - runs after every response
apiClient.interceptors.response.use(
    (response) => {
        // Any status code within the range of 2xx will trigger this function
        // You can transform response data here if needed
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors (token expired or invalid)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Get the current path
            const currentPath = window.location.pathname;
            const basePath = import.meta.env.BASE_URL;

            // Don't logout/redirect if we're on the login page or calling verify-password endpoint
            const isLoginPage = currentPath.includes('login');
            const isVerifyPasswordEndpoint = error.config?.url?.includes('verify-password');

            if (!isLoginPage && !isVerifyPasswordEndpoint) {
                // Use store to clear authentication data
                const userStore = useUserStore();

                // Clear authentication data using store
                userStore.logout();

                // Redirect to login page
                const loginPath = basePath + 'login';
                window.location.href = loginPath;
            }
            // If on login page or verify-password endpoint, just let the error propagate to the component
        }

        // Handle 403 Forbidden errors
        if (error.response?.status === 403) {
            console.error('Access forbidden:', error.response.data);
            // You can redirect to a "not authorized" page or show a message
        }

        // Handle 404 Not Found errors
        if (error.response?.status === 404) {
            console.error('Resource not found:', error.response.data);
        }

        // Handle 500 Server errors
        if (error.response?.status === 500) {
            console.error('Server error:', error.response.data);
        }

        // Format error for easier handling in components
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

        return Promise.reject({
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
            originalError: error
        });
    }
);

export default apiClient;
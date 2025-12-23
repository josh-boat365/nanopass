// src/config/apiConfig.js

const API_BASE_URL = 'http://192.168.1.200/nanopass-backend/public/api';

const API_ENDPOINTS = {
    // Auth endpoints
    AUTH: {
        REGISTER: '/register',
        LOGIN: '/login',
        LOGOUT: '/logout',
    },

    // User endpoints
    USERS: {
        LIST: '/users',
        SEARCH: '/users/search',
        SHOW: (id) => `/users/${id}`,
        UPDATE: (id) => `/users/${id}`,
        DELETE: (id) => `/users/${id}`,
        AUDIT_TRAILS: (id) => `/users/${id}/audit-trails`,
        PERMISSIONS: (id) => `/users/${id}/permissions`,
    },
};

const API_CONFIG = {
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
};

export {
    API_BASE_URL,
    API_ENDPOINTS,
    API_CONFIG
};
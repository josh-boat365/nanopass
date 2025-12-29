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
        CREATE: '/users', // Admin creating new user (no auth)
        SEARCH: '/users/search',
        SHOW: (id) => `/users/${id}`,
        UPDATE: (id) => `/users/${id}`,
        DELETE: (id) => `/users/${id}`,
        AUDIT_TRAILS: (id) => `/users/${id}/audit-trails`,
        PERMISSIONS: (id) => `/users/${id}/permissions`,
    },

    // Policy endpoints
    POLICIES: {
        LIST: '/policies',
        SHOW: (id) => `/policies/${id}`,
        CREATE: '/policies',
        UPDATE: (id) => `/policies/${id}`,
        DELETE: (id) => `/policies/${id}`,
    },

    // Category endpoints
    CATEGORIES: {
        LIST: '/categories',
        SHOW: (id) => `/categories/${id}`,
        CREATE: '/categories',
        UPDATE: (id) => `/categories/${id}`,
        DELETE: (id) => `/categories/${id}`,
    },

    // System endpoints
    SYSTEMS: {
        LIST: '/systems',
        SHOW: (id) => `/systems/${id}`,
        CREATE: '/systems',
        UPDATE: (id) => `/systems/${id}`,
        DELETE: (id) => `/systems/${id}`,
        GET_PASSWORD: (id) => `/systems/${id}/password`,
    },

    // Password endpoints
    PASSWORDS: {
        LIST: '/passwords',
        SHOW: (id) => `/passwords/${id}`,
        CREATE: '/passwords',
        UPDATE: (id) => `/passwords/${id}`,
        DELETE: (id) => `/passwords/${id}`,
        BY_SYSTEM: (systemId) => `/passwords/system/${systemId}`,
        TOGGLE_ACTIVE: (id) => `/passwords/${id}/toggle-active`,
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
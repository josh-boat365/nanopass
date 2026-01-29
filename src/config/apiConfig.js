// src/config/apiConfig.js

const API_BASE_URL = 'http://192.168.1.200/nanopass-backend/public/api';

const API_ENDPOINTS = {
    // Auth endpoints
    AUTH: {
        REGISTER: '/register',
        LOGIN: '/login',
        LOGOUT: '/logout',
        VERIFY_PASSWORD: '/verify-password',
        CHANGE_PASSWORD: '/change-password',
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
        TRANSFER_ADMIN: '/users/transfer-admin',
        CURRENT_ADMIN: '/users/current-admin',
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

    // Permission endpoints
    PERMISSIONS: {
        LIST: '/permissions',
        SHOW: (id) => `/permissions/${id}`,
        CREATE: '/permissions',
        UPDATE: (id) => `/permissions/${id}`,
        DELETE: (id) => `/permissions/${id}`,
        BY_USER: (userId) => `/permissions/user/${userId}`,
        BY_SYSTEM: (systemId) => `/permissions/system/${systemId}`,
        ACTIVE: '/permissions/active',
    },

    // Personal Key endpoints
    PERSONAL_KEYS: {
        LIST: '/personal-keys',
        SHOW: (id) => `/personal-keys/${id}`,
        CREATE: '/personal-keys',
        UPDATE: (id) => `/personal-keys/${id}`,
        DELETE: (id) => `/personal-keys/${id}`,
        VERIFY: (id) => `/personal-keys/${id}/verify`,
        SEARCH: '/personal-keys/search',
    },

    // Department endpoints
    DEPARTMENTS: {
        LIST: '/departments',
        SHOW: (id) => `/departments/${id}`,
        CREATE: '/departments',
        UPDATE: (id) => `/departments/${id}`,
        DELETE: (id) => `/departments/${id}`,
        GET_USERS: (id) => `/departments/${id}/users`,
    },

    // Description endpoints
    DESCRIPTIONS: {
        LIST: '/descriptions',
        SHOW: (id) => `/descriptions/${id}`,
        CREATE: '/descriptions',
        UPDATE: (id) => `/descriptions/${id}`,
        DELETE: (id) => `/descriptions/${id}`,
        BY_SYSTEM: (systemId) => `/descriptions/system/${systemId}`,
    },

    // Audit Trail endpoints
    AUDIT_TRAILS: {
        LIST: '/audit-trails',
        SHOW: (id) => `/audit-trails/${id}`,
        BY_USER: (userId) => `/audit-trails/user/${userId}`,
        BY_MODEL: (modelType, modelId) => `/audit-trails/model/${modelType}/${modelId}`,
        RECENT_ACTIVITY: '/audit-trails/recent-activity',
        PASSWORD_ACCESS_LOGS: '/audit-trails/password-access-logs',
        PERMISSION_LOGS: '/audit-trails/permission-logs',
        PERSONAL_KEY_ACCESS_LOGS: '/audit-trails/personal-key-access-logs',
        ADMIN_ACTIVITY: '/audit-trails/admin-activity',
        EXPORT: '/audit-trails/export',
        STATISTICS: '/audit-trails/statistics',
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
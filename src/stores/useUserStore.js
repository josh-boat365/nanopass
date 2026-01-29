// src/stores/useUserStore.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'
import { API_ENDPOINTS } from '@/config/apiConfig'

export const useUserStore = defineStore('user', () => {
    // State
    const user = ref(null)
    const token = ref(null)
    const users = ref([])
    const currentUserDetails = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // Getters
    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() => user.value?.admin || false)

    // Initialize from localStorage on store creation
    const initializeStore = () => {
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('auth_token')
        if (storedUser && storedToken) {
            try {
                user.value = JSON.parse(storedUser)
                token.value = storedToken
            } catch (error) {
                console.error('Error parsing stored user data:', error)
                localStorage.removeItem('user')
                localStorage.removeItem('auth_token')
            }
        }
    }

    // Register (self-registration with authentication)
    const register = async (userData, shouldAuthenticate = true) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData)

            // Only authenticate if flag is true (self-registration case)
            if (shouldAuthenticate && data.token) {
                user.value = data.user
                token.value = data.token
                localStorage.setItem('user', JSON.stringify(data.user))
                localStorage.setItem('auth_token', data.token)
            }

            return data
        } catch (err) {
            error.value = err.message || 'Registration failed'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Create User (admin creating user without authentication)
    const createUser = async (userData) => {
        // Use register but don't authenticate the user
        return await register(userData, false)
    }

    // Login
    const login = async (credentials) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
            user.value = data.user
            token.value = data.token
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('auth_token', data.token)
            return data
        } catch (err) {
            error.value = err.message || 'Login failed'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Logout
    const logout = async () => {
        loading.value = true
        try {
            if (token.value) await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
        } catch (err) {
            console.error('Logout error:', err)
        } finally {
            user.value = null
            token.value = null
            users.value = []
            currentUserDetails.value = null
            localStorage.removeItem('user')
            localStorage.removeItem('auth_token')
            loading.value = false
        }
    }

    // Force Logout - clears all auth state synchronously without API call
    // Used when server has already invalidated the token (e.g., after admin transfer)
    const forceLogout = () => {
        user.value = null
        token.value = null
        users.value = []
        currentUserDetails.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('auth_token')
        sessionStorage.clear()
    }

    // Get All Users (LIST)
    const getAllUsers = async (params = {}) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.USERS.LIST, { params })
            users.value = data || []
            return data
        } catch (err) {
            error.value = err.message || 'Failed to fetch users'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Search Users
    const searchUsers = async (searchParams) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.USERS.SEARCH, { params: searchParams })
            return data
        } catch (err) {
            error.value = err.message || 'Search failed'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get User by ID
    const getUserById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.USERS.SHOW(id))
            currentUserDetails.value = data
            return data
        } catch (err) {
            error.value = err.message || 'Failed to fetch user'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update User
    const updateUser = async (id, userData) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(id), userData)
            if (user.value?.id === id) {
                user.value = data
                localStorage.setItem('user', JSON.stringify(data))
            }
            const index = users.value.findIndex(u => u.id === id)
            if (index !== -1) users.value[index] = data
            return data
        } catch (err) {
            error.value = err.message || 'Failed to update user'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete User
    const deleteUser = async (id) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id))
            users.value = users.value.filter(u => u.id !== id)
            return data
        } catch (err) {
            error.value = err.message || 'Failed to delete user'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get User Audit Trails
    const getUserAuditTrails = async (id, params = {}) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.USERS.AUDIT_TRAILS(id), { params })
            return data
        } catch (err) {
            error.value = err.message || 'Failed to fetch audit trails'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get User Permissions
    const getUserPermissions = async (id) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.USERS.PERMISSIONS(id))
            return data
        } catch (err) {
            error.value = err.message || 'Failed to fetch permissions'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get Current Admin
    const getCurrentAdmin = async () => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.USERS.CURRENT_ADMIN)
            return data
        } catch (err) {
            error.value = err.message || 'Failed to fetch current admin'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Transfer Admin Privileges
    const transferAdmin = async (userId) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.post(API_ENDPOINTS.USERS.TRANSFER_ADMIN, { user_id: userId })

            // CRITICAL: If server logged out the user, clear all auth state immediately
            if (data.logged_out) {
                forceLogout()
            }

            return data
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to transfer admin privileges'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Clear error
    const clearError = () => {
        error.value = null
    }

    // Initialize store
    initializeStore()

    return {
        // State
        user,
        token,
        users,
        currentUserDetails,
        loading,
        error,

        // Getters
        isAuthenticated,
        isAdmin,

        // Actions
        register,
        createUser,
        login,
        logout,
        forceLogout,
        getAllUsers,
        searchUsers,
        getUserById,
        updateUser,
        deleteUser,
        getUserAuditTrails,
        getUserPermissions,
        getCurrentAdmin,
        transferAdmin,
        clearError
    }
});
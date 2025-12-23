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

    // Register
    const register = async (userData) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData)
            user.value = response.data.user
            token.value = response.data.token
            localStorage.setItem('user', JSON.stringify(response.data.user))
            localStorage.setItem('auth_token', response.data.token)
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Registration failed'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Login
    const login = async (credentials) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)

            console.log('Full API Response:', response)
            console.log('Response data:', response.data)

            user.value = response.data.user
            token.value = response.data.token
            localStorage.setItem('user', JSON.stringify(response.data.user))
            localStorage.setItem('auth_token', response.data.token)
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Login failed'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Logout
    const logout = async () => {
        try {
            loading.value = true
            if (token.value) {
                await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
            }
        } catch (err) {
            console.error('Logout API error:', err)
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

    // Get All Users (LIST)
    const getAllUsers = async (params = {}) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.get(API_ENDPOINTS.USERS.LIST, { params })
            users.value = response.data.data || response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch users'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Search Users
    const searchUsers = async (searchParams) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.get(API_ENDPOINTS.USERS.SEARCH, {
                params: searchParams
            })
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Search failed'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get User by ID
    const getUserById = async (id) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.get(API_ENDPOINTS.USERS.SHOW(id))
            currentUserDetails.value = response.data.data || response.data
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch user'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update User
    const updateUser = async (id, userData) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(id), userData)

            // Update current user if updating self
            if (user.value?.id === id) {
                user.value = response.data.data || response.data.user
                localStorage.setItem('user', JSON.stringify(user.value))
            }

            // Update in users list if exists
            const index = users.value.findIndex(u => u.id === id)
            if (index !== -1) {
                users.value[index] = response.data.data || response.data.user
            }

            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update user'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete User
    const deleteUser = async (id) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id))

            // Remove from users list
            users.value = users.value.filter(u => u.id !== id)

            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to delete user'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get User Audit Trails
    const getUserAuditTrails = async (id, params = {}) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.get(
                API_ENDPOINTS.USERS.AUDIT_TRAILS(id),
                { params }
            )
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch audit trails'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get User Permissions
    const getUserPermissions = async (id) => {
        try {
            loading.value = true
            error.value = null
            const response = await apiClient.get(API_ENDPOINTS.USERS.PERMISSIONS(id))
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch permissions'
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
        login,
        logout,
        getAllUsers,
        searchUsers,
        getUserById,
        updateUser,
        deleteUser,
        getUserAuditTrails,
        getUserPermissions,
        clearError
    }
});
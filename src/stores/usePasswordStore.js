// src/stores/usePasswordStore.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'
import { API_ENDPOINTS } from '@/config/apiConfig'

export const usePasswordStore = defineStore('password', () => {
    // State
    const passwords = ref([])
    const currentPassword = ref(null)
    const accessiblePasswords = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Getters
    const hasPasswords = computed(() => passwords.value.length > 0)
    const activePasswords = computed(() => passwords.value.filter(p => p.is_active))
    const inactivePasswords = computed(() => passwords.value.filter(p => !p.is_active))

    // Get all passwords (ADMIN ONLY)
    const getAllPasswords = async () => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.PASSWORDS.LIST)
            passwords.value = data.data || data || []
            return passwords.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch passwords'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get user's accessible passwords
    const getAccessiblePasswords = async () => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get('/passwords/accessible')
            accessiblePasswords.value = data.data || data || []
            return accessiblePasswords.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch accessible passwords'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get active passwords for a specific system
    const getActivePasswordsBySystem = async (systemId) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PASSWORDS.BY_SYSTEM(systemId) || `/passwords/system/${systemId}/active`
            const { data } = await apiClient.get(endpoint)
            return data.data || data || []
        } catch (err) {
            error.value = err.message || 'Failed to fetch system passwords'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get single password by ID
    const getPasswordById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PASSWORDS.SHOW(id)
            const { data } = await apiClient.get(endpoint)
            currentPassword.value = data.data || data
            return currentPassword.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch password'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Create new password
    const createPassword = async (passwordData) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.post(API_ENDPOINTS.PASSWORDS.CREATE, passwordData)
            const newPassword = data.data || data
            passwords.value.unshift(newPassword)
            return newPassword
        } catch (err) {
            error.value = err.message || 'Failed to create password'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update password
    const updatePassword = async (id, passwordData) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PASSWORDS.UPDATE(id)
            const { data } = await apiClient.put(endpoint, passwordData)
            const updatedPassword = data.data || data

            // Update in local array
            const index = passwords.value.findIndex(p => p.id === id)
            if (index !== -1) {
                passwords.value[index] = updatedPassword
            }

            if (currentPassword.value?.id === id) {
                currentPassword.value = updatedPassword
            }

            return updatedPassword
        } catch (err) {
            error.value = err.message || 'Failed to update password'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete password
    const deletePassword = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PASSWORDS.DELETE(id)
            await apiClient.delete(endpoint)

            passwords.value = passwords.value.filter(p => p.id !== id)

            if (currentPassword.value?.id === id) {
                currentPassword.value = null
            }

            return true
        } catch (err) {
            error.value = err.message || 'Failed to delete password'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Toggle password active status
    const togglePasswordActive = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PASSWORDS.TOGGLE_ACTIVE(id)
            const { data } = await apiClient.post(endpoint)
            const updatedPassword = data.data || data

            const index = passwords.value.findIndex(p => p.id === id)
            if (index !== -1) {
                passwords.value[index] = updatedPassword
            }

            return updatedPassword
        } catch (err) {
            error.value = err.message || 'Failed to toggle password status'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Access/reveal password with brute-force protection
    const accessPassword = async (userId, systemId, passwordId = null) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.post('/passwords/access', {
                user_id: userId,
                system_id: systemId,
                password_id: passwordId
            })
            return data.data || data
        } catch (err) {
            error.value = err.message || 'Failed to access password'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Clear error
    const clearError = () => {
        error.value = null
    }

    // Clear current password
    const clearCurrentPassword = () => {
        currentPassword.value = null
    }

    return {
        // State
        passwords,
        currentPassword,
        accessiblePasswords,
        loading,
        error,

        // Getters
        hasPasswords,
        activePasswords,
        inactivePasswords,

        // Actions
        getAllPasswords,
        getAccessiblePasswords,
        getActivePasswordsBySystem,
        getPasswordById,
        createPassword,
        updatePassword,
        deletePassword,
        togglePasswordActive,
        accessPassword,
        clearError,
        clearCurrentPassword
    }
})

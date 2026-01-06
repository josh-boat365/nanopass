// src/stores/usePersonalKeyStore.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'
import { API_ENDPOINTS } from '@/config/apiConfig'

export const usePersonalKeyStore = defineStore('personalKey', () => {
    // State
    const personalKeys = ref([])
    const currentKey = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({
        total: 0,
        perPage: 10,
        currentPage: 1,
        lastPage: 1
    })

    // Getters
    const hasPersonalKeys = computed(() => personalKeys.value.length > 0)
    const totalKeys = computed(() => pagination.value.total)

    // Get all personal keys for authenticated user
    const getAllPersonalKeys = async (page = 1) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = `${API_ENDPOINTS.PERSONAL_KEYS.LIST}?page=${page}`
            const { data } = await apiClient.get(endpoint)

            personalKeys.value = data.data || data || []

            // Handle pagination if available
            if (data.pagination) {
                pagination.value = data.pagination
            }

            return personalKeys.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch personal keys'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Search personal keys
    const searchPersonalKeys = async (searchParams) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PERSONAL_KEYS.SEARCH
            const { data } = await apiClient.get(endpoint, { params: searchParams })
            return data.data || data || []
        } catch (err) {
            error.value = err.message || 'Search failed'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get single personal key by ID
    const getPersonalKeyById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PERSONAL_KEYS.SHOW(id)
            const { data } = await apiClient.get(endpoint)
            currentKey.value = data.data || data
            return currentKey.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch personal key'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Create new personal key
    const createPersonalKey = async (keyData) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.post(API_ENDPOINTS.PERSONAL_KEYS.CREATE, keyData)
            const newKey = data.data || data
            personalKeys.value.unshift(newKey)
            return newKey
        } catch (err) {
            error.value = err.message || 'Failed to create personal key'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update personal key
    const updatePersonalKey = async (id, keyData) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PERSONAL_KEYS.UPDATE(id)
            const { data } = await apiClient.put(endpoint, keyData)
            const updatedKey = data.data || data

            // Update in local array
            const index = personalKeys.value.findIndex(k => k.id === id)
            if (index !== -1) {
                personalKeys.value[index] = updatedKey
            }

            // Update current key if it's the one being edited
            if (currentKey.value?.id === id) {
                currentKey.value = updatedKey
            }

            return updatedKey
        } catch (err) {
            error.value = err.message || 'Failed to update personal key'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete personal key
    const deletePersonalKey = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PERSONAL_KEYS.DELETE(id)
            await apiClient.delete(endpoint)

            // Remove from local array
            personalKeys.value = personalKeys.value.filter(k => k.id !== id)

            // Clear current key if it was deleted
            if (currentKey.value?.id === id) {
                currentKey.value = null
            }

            return true
        } catch (err) {
            error.value = err.message || 'Failed to delete personal key'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Verify personal key (reveal the key value)
    const verifyPersonalKey = async (id, password) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.PERSONAL_KEYS.VERIFY(id)
            const { data } = await apiClient.post(endpoint, { password })
            return data.data || data
        } catch (err) {
            error.value = err.message || 'Failed to verify personal key'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Clear error
    const clearError = () => {
        error.value = null
    }

    // Clear current key
    const clearCurrentKey = () => {
        currentKey.value = null
    }

    return {
        // State
        personalKeys,
        currentKey,
        loading,
        error,
        pagination,

        // Getters
        hasPersonalKeys,
        totalKeys,

        // Actions
        getAllPersonalKeys,
        searchPersonalKeys,
        getPersonalKeyById,
        createPersonalKey,
        updatePersonalKey,
        deletePersonalKey,
        verifyPersonalKey,
        clearError,
        clearCurrentKey
    }
})

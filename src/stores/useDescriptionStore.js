// src/stores/useDescriptionStore.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'
import { API_ENDPOINTS } from '@/config/apiConfig'

export const useDescriptionStore = defineStore('description', () => {
    // State
    const descriptions = ref([])
    const currentDescription = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // Getters
    const hasDescriptions = computed(() => descriptions.value.length > 0)
    const totalDescriptions = computed(() => descriptions.value.length)

    // Get all descriptions (permission-aware)
    const getAllDescriptions = async () => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.DESCRIPTIONS.LIST)
            descriptions.value = data.data || data || []
            return descriptions.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch descriptions'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get single description by ID
    const getDescriptionById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.DESCRIPTIONS.SHOW(id)
            const { data } = await apiClient.get(endpoint)
            currentDescription.value = data.data || data
            return currentDescription.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch description'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get description for a system
    const getDescriptionBySystem = async (systemId) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.DESCRIPTIONS.BY_SYSTEM(systemId)
            const { data } = await apiClient.get(endpoint)
            return data.data || data
        } catch (err) {
            error.value = err.message || 'Failed to fetch system description'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Create new description
    const createDescription = async (descriptionData) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.post(API_ENDPOINTS.DESCRIPTIONS.CREATE, descriptionData)
            const newDescription = data.data || data
            descriptions.value.push(newDescription)
            return newDescription
        } catch (err) {
            error.value = err.message || 'Failed to create description'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update description
    const updateDescription = async (id, descriptionData) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.DESCRIPTIONS.UPDATE(id)
            const { data } = await apiClient.put(endpoint, descriptionData)
            const updatedDescription = data.data || data

            // Update in local array
            const index = descriptions.value.findIndex(d => d.id === id)
            if (index !== -1) {
                descriptions.value[index] = updatedDescription
            }

            if (currentDescription.value?.id === id) {
                currentDescription.value = updatedDescription
            }

            return updatedDescription
        } catch (err) {
            error.value = err.message || 'Failed to update description'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete description
    const deleteDescription = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.DESCRIPTIONS.DELETE(id)
            await apiClient.delete(endpoint)

            descriptions.value = descriptions.value.filter(d => d.id !== id)

            if (currentDescription.value?.id === id) {
                currentDescription.value = null
            }

            return true
        } catch (err) {
            error.value = err.message || 'Failed to delete description'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Clear error
    const clearError = () => {
        error.value = null
    }

    // Clear current description
    const clearCurrentDescription = () => {
        currentDescription.value = null
    }

    return {
        // State
        descriptions,
        currentDescription,
        loading,
        error,

        // Getters
        hasDescriptions,
        totalDescriptions,

        // Actions
        getAllDescriptions,
        getDescriptionById,
        getDescriptionBySystem,
        createDescription,
        updateDescription,
        deleteDescription,
        clearError,
        clearCurrentDescription
    }
})

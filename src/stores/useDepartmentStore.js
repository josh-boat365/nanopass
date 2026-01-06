// src/stores/useDepartmentStore.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'
import { API_ENDPOINTS } from '@/config/apiConfig'

export const useDepartmentStore = defineStore('department', () => {
    // State
    const departments = ref([])
    const currentDepartment = ref(null)
    const departmentUsers = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Getters
    const hasDepartments = computed(() => departments.value.length > 0)
    const totalDepartments = computed(() => departments.value.length)

    // Get all departments
    const getAllDepartments = async () => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.DEPARTMENTS.LIST)
            departments.value = data.data || data || []
            return departments.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch departments'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get single department by ID
    const getDepartmentById = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.DEPARTMENTS.SHOW(id)
            const { data } = await apiClient.get(endpoint)
            currentDepartment.value = data.data || data
            return currentDepartment.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch department'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get users in department
    const getDepartmentUsers = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.DEPARTMENTS.GET_USERS(id)
            const { data } = await apiClient.get(endpoint)
            departmentUsers.value = data.data || data || []
            return departmentUsers.value
        } catch (err) {
            error.value = err.message || 'Failed to fetch department users'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Create new department
    const createDepartment = async (departmentData) => {
        loading.value = true
        error.value = null
        try {
            const { data } = await apiClient.post(API_ENDPOINTS.DEPARTMENTS.CREATE, departmentData)
            const newDepartment = data.data || data
            departments.value.push(newDepartment)
            return newDepartment
        } catch (err) {
            error.value = err.message || 'Failed to create department'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update department
    const updateDepartment = async (id, departmentData) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.DEPARTMENTS.UPDATE(id)
            const { data } = await apiClient.put(endpoint, departmentData)
            const updatedDepartment = data.data || data

            // Update in local array
            const index = departments.value.findIndex(d => d.id === id)
            if (index !== -1) {
                departments.value[index] = updatedDepartment
            }

            if (currentDepartment.value?.id === id) {
                currentDepartment.value = updatedDepartment
            }

            return updatedDepartment
        } catch (err) {
            error.value = err.message || 'Failed to update department'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete department
    const deleteDepartment = async (id) => {
        loading.value = true
        error.value = null
        try {
            const endpoint = API_ENDPOINTS.DEPARTMENTS.DELETE(id)
            await apiClient.delete(endpoint)

            departments.value = departments.value.filter(d => d.id !== id)

            if (currentDepartment.value?.id === id) {
                currentDepartment.value = null
            }

            return true
        } catch (err) {
            error.value = err.message || 'Failed to delete department'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Clear error
    const clearError = () => {
        error.value = null
    }

    // Clear current department
    const clearCurrentDepartment = () => {
        currentDepartment.value = null
    }

    // Clear department users
    const clearDepartmentUsers = () => {
        departmentUsers.value = []
    }

    return {
        // State
        departments,
        currentDepartment,
        departmentUsers,
        loading,
        error,

        // Getters
        hasDepartments,
        totalDepartments,

        // Actions
        getAllDepartments,
        getDepartmentById,
        getDepartmentUsers,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        clearError,
        clearCurrentDepartment,
        clearDepartmentUsers
    }
})

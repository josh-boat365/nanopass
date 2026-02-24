// src/composables/useAuditTrails.js

import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'
import { API_ENDPOINTS } from '@/config/apiConfig'

export const useAuditTrails = () => {
  // State
  const auditTrails = ref([])
  const loading = ref(false)
  const pagination = ref({
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1
  })

  // Filter state
  const filters = ref({
    search: '',
    category: null,
    action_type: null,
    status: null,
    affected_user_id: null,
    affected_system_id: null,
    model_type: null,
    from_date: null,
    to_date: null,
    per_page: 20,
    page: 1
  })

  /**
   * Build query parameters from filters
   */
  const buildQueryParams = () => {
    const params = new URLSearchParams()

    Object.entries(filters.value).forEach(([key, value]) => {
      if (value !== null && value !== '' && value !== undefined) {
        params.append(key, value)
      }
    })

    return params.toString()
  }

  /**
   * Fetch audit trails with current filters
   */
  const fetchAuditTrails = async () => {
    loading.value = true
    try {
      console.log('📥 Fetching audit trails with filters:', filters.value)

      const endpoint = API_ENDPOINTS.AUDIT_TRAILS.LIST
      const queryParams = buildQueryParams()
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint

      const response = await apiClient.get(url)

      auditTrails.value = response.data?.data || []
      pagination.value = response.data?.pagination || {
        total: auditTrails.value.length,
        per_page: filters.value.per_page,
        current_page: filters.value.page,
        last_page: Math.ceil(auditTrails.value.length / filters.value.per_page)
      }

      console.log('✅ Audit trails loaded:', auditTrails.value.length)
    } catch (err) {
      console.error('❌ Error fetching audit trails:', err)
      auditTrails.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch audit trail by ID
   */
  const fetchAuditTrailById = async (id) => {
    try {
      console.log(`📥 Fetching audit trail ${id}...`)
      const response = await apiClient.get(API_ENDPOINTS.AUDIT_TRAILS.SHOW(id))
      console.log('✅ Audit trail loaded:', response.data.data)
      return response.data.data
    } catch (err) {
      console.error(`❌ Error fetching audit trail ${id}:`, err)
      throw err
    }
  }

  /**
   * Fetch audit trails for a specific user
   */
  const fetchUserAuditTrails = async (userId) => {
    try {
      console.log(`📥 Fetching audit trails for user ${userId}...`)
      const queryParams = buildQueryParams()
      const url = queryParams
        ? `${API_ENDPOINTS.AUDIT_TRAILS.BY_USER(userId)}?${queryParams}`
        : API_ENDPOINTS.AUDIT_TRAILS.BY_USER(userId)

      const response = await apiClient.get(url)
      console.log('✅ User audit trails loaded:', response.data.data.length)
      return response.data
    } catch (err) {
      console.error(`❌ Error fetching user audit trails:`, err)
      throw err
    }
  }

  /**
   * Fetch password access logs (admin only)
   */
  const fetchPasswordAccessLogs = async () => {
    try {
      console.log('📥 Fetching password access logs...')
      const queryParams = buildQueryParams()
      const url = queryParams
        ? `${API_ENDPOINTS.AUDIT_TRAILS.PASSWORD_ACCESS_LOGS}?${queryParams}`
        : API_ENDPOINTS.AUDIT_TRAILS.PASSWORD_ACCESS_LOGS

      const response = await apiClient.get(url)
      console.log('✅ Password access logs loaded:', response.data.data.length)
      return response.data
    } catch (err) {
      console.error('❌ Error fetching password access logs:', err)
      throw err
    }
  }

  /**
   * Fetch permission logs (admin only)
   */
  const fetchPermissionLogs = async () => {
    try {
      console.log('📥 Fetching permission logs...')
      const queryParams = buildQueryParams()
      const url = queryParams
        ? `${API_ENDPOINTS.AUDIT_TRAILS.PERMISSION_LOGS}?${queryParams}`
        : API_ENDPOINTS.AUDIT_TRAILS.PERMISSION_LOGS

      const response = await apiClient.get(url)
      console.log('✅ Permission logs loaded:', response.data.data.length)
      return response.data
    } catch (err) {
      console.error('❌ Error fetching permission logs:', err)
      throw err
    }
  }

  /**
   * Fetch key access logs
   */
  const fetchKeyAccessLogs = async () => {
    try {
      console.log('📥 Fetching key access logs...')
      const queryParams = buildQueryParams()
      const url = queryParams
        ? `${API_ENDPOINTS.AUDIT_TRAILS.KEY_ACCESS_LOGS}?${queryParams}`
        : API_ENDPOINTS.AUDIT_TRAILS.KEY_ACCESS_LOGS

      const response = await apiClient.get(url)
      console.log('✅ Key access logs loaded:', response.data.data.length)
      return response.data
    } catch (err) {
      console.error('❌ Error fetching key access logs:', err)
      throw err
    }
  }

  /**
   * Fetch admin activity logs (admin only)
   */
  const fetchAdminActivityLogs = async () => {
    try {
      console.log('📥 Fetching admin activity logs...')
      const queryParams = buildQueryParams()
      const url = queryParams
        ? `${API_ENDPOINTS.AUDIT_TRAILS.ADMIN_ACTIVITY_LOGS}?${queryParams}`
        : API_ENDPOINTS.AUDIT_TRAILS.ADMIN_ACTIVITY_LOGS

      const response = await apiClient.get(url)
      console.log('✅ Admin activity logs loaded:', response.data.data.length)
      return response.data
    } catch (err) {
      console.error('❌ Error fetching admin activity logs:', err)
      throw err
    }
  }

  /**
   * Fetch recent activity (admin only)
   */
  const fetchRecentActivity = async (limit = 50) => {
    try {
      console.log(`📥 Fetching recent activity (limit: ${limit})...`)
      const url = `${API_ENDPOINTS.AUDIT_TRAILS.RECENT_ACTIVITY}?limit=${limit}`
      const response = await apiClient.get(url)
      console.log('✅ Recent activity loaded:', response.data.data.length)
      return response.data
    } catch (err) {
      console.error('❌ Error fetching recent activity:', err)
      throw err
    }
  }

  /**
   * Log key copied action
   */
  const logKeyCopied = async (keyType, keyId, keyName) => {
    try {
      console.log(`📝 Logging ${keyType} key copy for key ${keyId}...`)
      const response = await apiClient.post(API_ENDPOINTS.AUDIT_TRAILS.LOG_KEY_COPIED, {
        key_type: keyType,
        key_id: keyId,
        key_name: keyName
      })
      console.log('✅ Key copy logged')
      return response.data
    } catch (err) {
      console.error('❌ Error logging key copy:', err)
      throw err
    }
  }

  /**
   * Log admin review
   */
  const logAdminReview = async (reviewedUserId, filterAction, reason) => {
    try {
      console.log('📝 Logging admin review...')
      const response = await apiClient.post(API_ENDPOINTS.AUDIT_TRAILS.LOG_ADMIN_REVIEW, {
        reviewed_user_id: reviewedUserId,
        filter_action: filterAction,
        reason
      })
      console.log('✅ Admin review logged')
      return response.data
    } catch (err) {
      console.error('❌ Error logging admin review:', err)
      throw err
    }
  }

  /**
   * Export audit trails to CSV
   */
  const exportAuditTrails = async () => {
    try {
      console.log('📤 Exporting audit trails...')
      const queryParams = buildQueryParams()
      const url = queryParams
        ? `${API_ENDPOINTS.AUDIT_TRAILS.EXPORT}?${queryParams}`
        : API_ENDPOINTS.AUDIT_TRAILS.EXPORT

      window.location.href = url
      console.log('✅ Export initiated')
    } catch (err) {
      console.error('❌ Error exporting audit trails:', err)
      throw err
    }
  }

  /**
   * Update a single filter
   */
  const setFilter = (filterName, value) => {
    filters.value[filterName] = value
    filters.value.page = 1 // Reset to first page when filter changes
  }

  /**
   * Update multiple filters
   */
  const setFilters = (newFilters) => {
    Object.assign(filters.value, newFilters)
    filters.value.page = 1 // Reset to first page when filters change
  }

  /**
   * Reset all filters to default
   */
  const resetFilters = () => {
    filters.value = {
      search: '',
      category: null,
      action_type: null,
      status: null,
      affected_user_id: null,
      affected_system_id: null,
      model_type: null,
      from_date: null,
      to_date: null,
      per_page: 20,
      page: 1
    }
  }

  /**
   * Change page
   */
  const setPage = (page) => {
    filters.value.page = page
  }

  /**
   * Change items per page
   */
  const setPerPage = (perPage) => {
    filters.value.per_page = perPage
    filters.value.page = 1 // Reset to first page
  }

  return {
    // State
    auditTrails,
    loading,
    pagination,
    filters,

    // Fetch methods
    fetchAuditTrails,
    fetchAuditTrailById,
    fetchUserAuditTrails,
    fetchPasswordAccessLogs,
    fetchPermissionLogs,
    fetchKeyAccessLogs,
    fetchAdminActivityLogs,
    fetchRecentActivity,

    // Log methods
    logKeyCopied,
    logAdminReview,

    // Export
    exportAuditTrails,

    // Filter management
    setFilter,
    setFilters,
    resetFilters,
    setPage,
    setPerPage,

    // Utilities
    buildQueryParams
  }
}

import { ref } from 'vue'
import apiClient from '@/services/apiClient'
import { API_ENDPOINTS } from '@/config/apiConfig'

export function usePermissionExpiry() {
    const expiredPermissions = ref([])
    const isProcessing = ref(false)

    /**
     * Notify admins of permission revocation/expiry
     */
    const notifyAdminOfRevocation = async (permissionData, revocationReason = 'automatic_expiry') => {
        try {
            const notificationData = {
                title: 'Permission Revoked',
                message: `Permission for ${permissionData.user_email} to access ${permissionData.system_name} has been ${revocationReason === 'automatic_expiry' ? 'automatically expired' : 'revoked'}`,
                type: 'permission_revocation',
                severity: 'info',
                data: {
                    permission_id: permissionData.id,
                    user_email: permissionData.user_email,
                    system_name: permissionData.system_name,
                    revocation_reason: revocationReason,
                    revoked_at: new Date().toISOString(),
                },
            }

            // Send notification to backend (for admin notification system)
            await apiClient.post('/notifications/admin', notificationData)
            console.log(`✅ Admin notified of revocation: ${permissionData.user_email} → ${permissionData.system_name}`)
        } catch (err) {
            console.error('⚠️ Failed to notify admin (non-critical):', err)
            // Don't throw - this is a non-critical operation
        }
    }

    /**
     * Check if a permission has expired
     */
    const isPermissionExpired = (expiryDate) => {
        if (!expiryDate) return false
        const today = new Date()
        const expiry = new Date(expiryDate)
        return today > expiry
    }

    /**
     * Calculate days left until expiry
     */
    const calculateDaysLeft = (expiryDate) => {
        if (!expiryDate) return 0
        const today = new Date()
        const expiry = new Date(expiryDate)
        const diffTime = expiry - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    }

    /**
     * Revoke a single expired permission
     */
    const revokeExpiredPermission = async (permissionId, permissionData = null) => {
        try {
            console.log(`📤 Revoking expired permission ${permissionId}...`)
            const response = await apiClient.post(
                API_ENDPOINTS.PERMISSIONS.REVOKE(permissionId),
                { reason: 'automatic_expiry' }
            )

            if (response.status === 200 || response.data?.success) {
                console.log(`✅ Permission ${permissionId} revoked successfully`)

                // Notify admin of automatic expiry
                if (permissionData) {
                    await notifyAdminOfRevocation(permissionData, 'automatic_expiry')
                }

                return response.data
            } else {
                throw new Error('Failed to revoke permission')
            }
        } catch (err) {
            console.error(`❌ Error revoking permission ${permissionId}:`, err)
            throw err
        }
    }

    /**
     * Check for expired permissions and revoke them
     * Returns array of revoked permission IDs
     */
    const checkAndRevokeExpiredPermissions = async (permissions) => {
        if (!permissions || permissions.length === 0) {
            console.log('ℹ️ No permissions to check for expiry')
            return []
        }

        isProcessing.value = true
        const revokedIds = []

        try {
            // Find expired permissions
            const expiredPerms = permissions.filter(perm =>
                isPermissionExpired(perm.date_time_expiry)
            )

            if (expiredPerms.length === 0) {
                console.log('✅ No expired permissions found')
                return []
            }

            console.log(`⏰ Found ${expiredPerms.length} expired permission(s), revoking...`)

            // Revoke each expired permission
            for (const perm of expiredPerms) {
                try {
                    await revokeExpiredPermission(perm.id, perm)
                    revokedIds.push(perm.id)
                } catch (err) {
                    console.error(`Failed to revoke permission ${perm.id}, continuing with others...`, err)
                }
            }

            if (revokedIds.length > 0) {
                console.log(`✅ Successfully revoked ${revokedIds.length} expired permission(s)`)
                expiredPermissions.value = revokedIds
            }

            return revokedIds
        } catch (err) {
            console.error('❌ Error checking and revoking expired permissions:', err)
            throw err
        } finally {
            isProcessing.value = false
        }
    }

    /**
     * One-time check for expired permissions on component initialization
     * Revokes any permissions that have already expired
     */
    const checkAndRevokeOnMount = async (permissions) => {
        if (!permissions || permissions.length === 0) return []

        console.log('🔍 Checking for already-expired permissions on mount...')
        const revokedIds = await checkAndRevokeExpiredPermissions(permissions)

        if (revokedIds && revokedIds.length > 0) {
            console.log(`✅ Auto-revoked ${revokedIds.length} already-expired permission(s)`)
        }

        return revokedIds
    }

    /**
     * Check permissions that are about to expire (within X days)
     */
    const getExpiringPermissions = (permissions, daysThreshold = 7) => {
        if (!permissions || permissions.length === 0) return []

        return permissions.filter(perm => {
            const daysLeft = calculateDaysLeft(perm.date_time_expiry)
            return daysLeft > 0 && daysLeft <= daysThreshold
        })
    }

    /**
     * Get permissions that expired today
     */
    const getJustExpiredPermissions = (permissions) => {
        if (!permissions || permissions.length === 0) return []

        return permissions.filter(perm => {
            const daysLeft = calculateDaysLeft(perm.date_time_expiry)
            return daysLeft === 0 && isPermissionExpired(perm.date_time_expiry)
        })
    }

    /**
     * Fetch expiring permissions from backend
     * Used for early warning system (7 days by default)
     */
    const fetchExpiringPermissions = async (days = 7) => {
        try {
            console.log(`📥 Fetching permissions expiring in ${days} days...`)
            const response = await apiClient.get(API_ENDPOINTS.PERMISSIONS.EXPIRING, {
                params: { days }
            })

            if (response.data?.success) {
                console.log(`✅ Found ${response.data.data?.expiring_count || 0} expiring permissions`)
                return response.data.data
            }

            return { expiring_count: 0, permissions: [] }
        } catch (err) {
            console.error('❌ Error fetching expiring permissions:', err)
            throw err
        }
    }

    /**
     * Bulk revoke multiple permissions at once
     */
    const bulkRevokePermissions = async (permissionIds, reason = 'manual', notes = '', permissionsData = []) => {
        if (!permissionIds || permissionIds.length === 0) {
            console.warn('⚠️ No permissions to revoke')
            return { total: 0, revoked: 0, failed: 0 }
        }

        isProcessing.value = true

        try {
            console.log(`📤 Bulk revoking ${permissionIds.length} permissions...`)
            const response = await apiClient.post(
                API_ENDPOINTS.PERMISSIONS.BULK_REVOKE,
                {
                    permission_ids: permissionIds,
                    reason,
                    notes
                }
            )

            if (response.data?.success) {
                const { total, revoked, failed } = response.data.data
                console.log(`✅ Bulk revoke complete: ${revoked}/${total} succeeded, ${failed} failed`)

                // Notify admin of bulk revocation
                if (permissionsData && permissionsData.length > 0) {
                    for (const permData of permissionsData) {
                        await notifyAdminOfRevocation(permData, reason)
                    }
                }

                return response.data.data
            }

            throw new Error('Failed to bulk revoke permissions')
        } catch (err) {
            console.error('❌ Error bulk revoking permissions:', err)
            throw err
        } finally {
            isProcessing.value = false
        }
    }

    /**
     * Get revocation history (admin only)
     */
    const fetchRevocationHistory = async (filters = {}) => {
        try {
            console.log('📥 Fetching revocation history...')
            const response = await apiClient.get(
                API_ENDPOINTS.PERMISSIONS.REVOCATION_HISTORY,
                { params: filters }
            )

            if (response.data?.success) {
                console.log(`✅ Found ${response.data.data?.length || 0} revoked permissions`)
                return response.data
            }

            // If no success flag, treat as empty result
            return { data: [], pagination: {} }
        } catch (err) {
            console.error('⚠️ Error fetching revocation history (non-critical):', err)
            // Return empty data instead of throwing - the endpoint might not exist yet
            return { data: [], pagination: {} }
        }
    }

    /**
     * Get dashboard metrics (admin only)
     */
    const fetchDashboardMetrics = async () => {
        try {
            console.log('📥 Fetching permission metrics...')
            const response = await apiClient.get(
                API_ENDPOINTS.PERMISSIONS.DASHBOARD_METRICS
            )

            if (response.data?.success) {
                console.log('✅ Dashboard metrics loaded')
                return response.data.data
            }

            return null
        } catch (err) {
            console.error('❌ Error fetching dashboard metrics:', err)
            throw err
        }
    }

    return {
        expiredPermissions,
        isProcessing,
        isPermissionExpired,
        calculateDaysLeft,
        revokeExpiredPermission,
        checkAndRevokeExpiredPermissions,
        checkAndRevokeOnMount,
        getExpiringPermissions,
        getJustExpiredPermissions,
        fetchExpiringPermissions,
        bulkRevokePermissions,
        fetchRevocationHistory,
        fetchDashboardMetrics,
        notifyAdminOfRevocation,
    }
}

// src/composables/useNotifications.js

import { ref, computed } from 'vue'
import apiClient from '@/services/apiClient'
import { API_ENDPOINTS } from '@/config/apiConfig'
import { useUserStore } from '@/stores/useUserStore'

const notifications = ref([])
const loading = ref(false)
let pollInterval = null

// Notification types enum
export const NOTIFICATION_TYPES = {
    ASSIGNMENT: 'assignment',
    REVOCATION: 'revocation',
    EXTENSION: 'extension',
    DELETION: 'deletion',
    PASSWORD_UPDATE: 'password_update',
    SYSTEM_ALERT: 'system_alert',
}

// Map notification types to human-readable labels
const notificationTypeLabels = {
    [NOTIFICATION_TYPES.ASSIGNMENT]: 'Access Granted',
    [NOTIFICATION_TYPES.REVOCATION]: 'Access Revoked',
    [NOTIFICATION_TYPES.EXTENSION]: 'Access Extended',
    [NOTIFICATION_TYPES.DELETION]: 'Access Removed',
    [NOTIFICATION_TYPES.PASSWORD_UPDATE]: 'Password Updated',
    [NOTIFICATION_TYPES.SYSTEM_ALERT]: 'System Alert',
}

export function useNotifications() {
    /**
     * Fetch all notifications for the current user
     */
    const fetchNotifications = async () => {
        loading.value = true
        try {
            const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST)
            notifications.value = response.data || []
            console.log('✅ Notifications fetched:', notifications.value.length)
        } catch (err) {
            console.error('❌ Error fetching notifications:', err)
            notifications.value = []
        } finally {
            loading.value = false
        }
    }

    /**
     * Mark a single notification as read
     */
    const markAsRead = async (notificationId) => {
        try {
            const response = await apiClient.post(
                API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId),
                {}
            )
            if (response.data?.success) {
                // Update local notification
                const notification = notifications.value.find(n => n.id === notificationId)
                if (notification) {
                    notification.read = true
                }
                console.log(`✅ Notification ${notificationId} marked as read`)
                return response.data
            } else {
                throw new Error('Failed to mark notification as read')
            }
        } catch (err) {
            console.error('❌ Error marking notification as read:', err)
            throw err
        }
    }

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = async () => {
        try {
            // Try the bulk endpoint first
            const response = await apiClient.post(
                API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
                {}
            )
            console.log('✅ Bulk mark all as read response:', response.data)

            // If successful, update all local notifications
            notifications.value.forEach(n => {
                n.read = true
            })
            console.log('✅ All notifications marked as read')
            return response.data
        } catch (err) {
            console.error('❌ Bulk mark all failed, trying individual marks:', err)

            // Fallback: Mark each notification individually
            try {
                const unreadNotifications = notifications.value.filter(n => !n.read)
                console.log(`📤 Marking ${unreadNotifications.length} notifications individually...`)

                for (const notification of unreadNotifications) {
                    await markAsRead(notification.id)
                }

                console.log('✅ All notifications marked as read individually')
                return { success: true, message: 'All notifications marked as read' }
            } catch (fallbackErr) {
                console.error('❌ Error marking all notifications as read:', fallbackErr)
                throw fallbackErr
            }
        }
    }

    /**
     * Delete a notification
     */
    const deleteNotification = async (notificationId) => {
        try {
            const response = await apiClient.delete(
                API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)
            )
            // Backend may return success: true or just 200 OK with no specific field
            if (response.status === 200 || response.data?.success) {
                notifications.value = notifications.value.filter(n => n.id !== notificationId)
                console.log(`✅ Notification ${notificationId} deleted`)
                return response.data
            } else {
                throw new Error('Failed to delete notification')
            }
        } catch (err) {
            console.error('❌ Error deleting notification:', err)
            throw err
        }
    }

    /**
     * Start polling for new notifications
     */
    const startPolling = (intervalMs = 30000) => {
        // Initial fetch
        fetchNotifications()

        // Poll every 30 seconds (or custom interval)
        pollInterval = setInterval(() => {
            fetchNotifications()
        }, intervalMs)

        console.log(`📡 Started polling notifications every ${intervalMs}ms`)
    }

    /**
     * Stop polling for notifications
     */
    const stopPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
            console.log('⏹️ Stopped polling notifications')
        }
    }

    /**
     * Computed: Unread notifications count
     */
    const unreadCount = computed(() => {
        return notifications.value.filter(n => !n.read).length
    })

    /**
     * Computed: Unread notifications only
     */
    const unreadNotifications = computed(() => {
        return notifications.value.filter(n => !n.read)
    })

    /**
     * Computed: Notifications grouped by type
     */
    const notificationsByType = computed(() => {
        const grouped = {}
        notifications.value.forEach(notification => {
            if (!grouped[notification.type]) {
                grouped[notification.type] = []
            }
            grouped[notification.type].push(notification)
        })
        return grouped
    })

    /**
     * Get human-readable label for notification type
     */
    const getNotificationTypeLabel = (type) => {
        return notificationTypeLabels[type] || type
    }

    /**
     * Computed: Check if current user is admin
     */
    const userStore = useUserStore()
    const isAdmin = computed(() => {
        return userStore.user?.role === 'admin' || userStore.isAdmin || false
    })

    return {
        notifications,
        loading,
        unreadCount,
        unreadNotifications,
        notificationsByType,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        startPolling,
        stopPolling,
        getNotificationTypeLabel,
        isAdmin,
    }
}

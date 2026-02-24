<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useNotifications, NOTIFICATION_TYPES } from "@/composables/useNotifications";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/composables/useToast";
import BaseLayout from "@/layouts/AppLayout.vue";
import { Loader2, Trash2, Filter, Users, User, Shield, Key, Clock, AlertTriangle, Bell } from "lucide-vue-next";

const userStore = useUserStore();

const {
  notifications,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  isAdmin,
  getNotificationTypeLabel,
} = useNotifications();

const { success, error: showError } = useToast();
const isMarking = ref(null);
const isDeleting = ref(null);
const isMarkingAll = ref(false);

// Admin filters
const showAllUsers = ref(false);
const selectedType = ref('all');

// Notification type options for filter
const notificationTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: NOTIFICATION_TYPES.ASSIGNMENT, label: 'Access Granted' },
  { value: NOTIFICATION_TYPES.REVOCATION, label: 'Access Revoked' },
  { value: NOTIFICATION_TYPES.EXTENSION, label: 'Access Extended' },
  { value: NOTIFICATION_TYPES.DELETION, label: 'Access Removed' },
  { value: NOTIFICATION_TYPES.PASSWORD_UPDATE, label: 'Password Updated' },
  { value: NOTIFICATION_TYPES.SYSTEM_ALERT, label: 'System Alert' },
];

// Filtered notifications based on selected type
const filteredNotifications = computed(() => {
  if (selectedType.value === 'all') {
    return notifications.value;
  }
  return notifications.value.filter(n => n.type === selectedType.value);
});

// Get icon for notification type
const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.ASSIGNMENT:
      return Key;
    case NOTIFICATION_TYPES.REVOCATION:
    case NOTIFICATION_TYPES.DELETION:
      return Shield;
    case NOTIFICATION_TYPES.EXTENSION:
      return Clock;
    case NOTIFICATION_TYPES.SYSTEM_ALERT:
      return AlertTriangle;
    default:
      return Bell;
  }
};

// Get color for notification type
const getNotificationColor = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.ASSIGNMENT:
      return 'text-green-600 bg-green-100';
    case NOTIFICATION_TYPES.REVOCATION:
    case NOTIFICATION_TYPES.DELETION:
      return 'text-red-600 bg-red-100';
    case NOTIFICATION_TYPES.EXTENSION:
      return 'text-blue-600 bg-blue-100';
    case NOTIFICATION_TYPES.SYSTEM_ALERT:
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const loadNotifications = async () => {
  const options = {};
  if (isAdmin.value && showAllUsers.value) {
    options.allUsers = true;
  }
  if (selectedType.value !== 'all') {
    options.type = selectedType.value;
  }
  await fetchNotifications(options);
};

onMounted(async () => {
  await loadNotifications();
});

// Watch for filter changes
watch([showAllUsers, selectedType], async () => {
  await loadNotifications();
});

const handleMarkAsRead = async (id) => {
  isMarking.value = id;
  try {
    await markAsRead(id);
    success("Notification marked as read");
  } catch (err) {
    showError("Failed to mark notification as read");
    console.error("Error marking as read:", err);
  } finally {
    isMarking.value = null;
  }
};

const handleDelete = async (id) => {
  isDeleting.value = id;
  try {
    await deleteNotification(id);
    success("Notification deleted");
  } catch (err) {
    showError("Failed to delete notification");
    console.error("Error deleting notification:", err);
  } finally {
    isDeleting.value = null;
  }
};

const handleMarkAllAsRead = async () => {
  isMarkingAll.value = true;
  try {
    await markAllAsRead();
    success("All notifications marked as read");
  } catch (err) {
    showError("Failed to mark all as read");
    console.error("Error marking all as read:", err);
  } finally {
    isMarkingAll.value = false;
  }
};
</script>

<template>
  <BaseLayout>
    <div class="p-4 max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Notifications</h1>
        <p class="mt-2 text-gray-600">
          You have {{ filteredNotifications.filter((n) => !n.read).length }} unread
          notification{{
            filteredNotifications.filter((n) => !n.read).length !== 1 ? "s" : ""
          }}
        </p>
      </div>

      <!-- Admin Filters -->
      <div v-if="isAdmin" class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex items-center gap-2 mb-3">
          <Filter class="h-4 w-4 text-gray-500" />
          <span class="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <!-- Toggle All Users -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="showAllUsers"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Users class="h-4 w-4 text-gray-500" />
            <span class="text-sm text-gray-700">Show all users' notifications</span>
          </label>
          
          <!-- Type Filter -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-700">Type:</label>
            <select
              v-model="selectedType"
              class="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option
                v-for="option in notificationTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
        <span class="ml-2 text-gray-600">Loading notifications...</span>
      </div>

      <!-- No Notifications -->
      <div
        v-else-if="filteredNotifications.length === 0"
        class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center"
      >
        <Bell class="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p class="text-gray-500">No notifications yet.</p>
        <p class="text-sm text-gray-400 mt-1">
          You'll be notified when access is granted, revoked, or extended.
        </p>
      </div>

      <!-- Notifications List -->
      <div v-else class="space-y-4">
        <!-- Mark All as Read Button -->
        <div
          v-if="filteredNotifications.some((n) => !n.read)"
          class="flex justify-end mb-4"
        >
          <button
            @click="handleMarkAllAsRead"
            :disabled="isMarkingAll"
            class="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isMarkingAll" class="h-4 w-4 animate-spin" />
            {{ isMarkingAll ? "Marking..." : "Mark all as read" }}
          </button>
        </div>

        <!-- Notifications -->
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          :class="[
            'rounded-lg border p-4 transition-colors',
            notification.read
              ? 'bg-white border-gray-200'
              : 'bg-blue-50 border-blue-200',
          ]"
        >
          <div class="flex items-start gap-4">
            <!-- Type Icon -->
            <div :class="['p-2 rounded-full', getNotificationColor(notification.type)]">
              <component :is="getNotificationIcon(notification.type)" class="h-4 w-4" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2 flex-wrap">
                <h3 class="font-semibold text-gray-900">
                  {{ notification.title }}
                </h3>
                <!-- Show user info for admin viewing all -->
                <span
                  v-if="isAdmin && showAllUsers && notification.user"
                  class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  <User class="h-3 w-3" />
                  {{ notification.user.name || notification.user.email }}
                </span>
                <span class="text-xs text-gray-500">
                  {{
                    new Date(notification.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  }}
                </span>
              </div>
              <p class="mt-1 text-gray-700">{{ notification.message }}</p>
              <div class="mt-2 flex items-center gap-2 flex-wrap">
                <span
                  v-if="notification.type"
                  :class="['inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full', getNotificationColor(notification.type)]"
                >
                  {{ getNotificationTypeLabel(notification.type) }}
                </span>
                <!-- Display data details based on type -->
                <div v-if="notification.data" class="text-xs text-gray-600 space-y-1 mt-2 w-full">
                  <!-- Assignment data -->
                  <template v-if="notification.type === NOTIFICATION_TYPES.ASSIGNMENT">
                    <div v-if="notification.data.systems" class="font-medium">
                      Systems: {{ Array.isArray(notification.data.systems) ? notification.data.systems.join(', ') : notification.data.systems }}
                    </div>
                    <div v-if="notification.data.system_name" class="font-medium">
                      System: {{ notification.data.system_name }}
                    </div>
                    <div v-if="notification.data.expiry_date" class="text-gray-600">
                      Expires: {{ new Date(notification.data.expiry_date).toLocaleDateString() }}
                    </div>
                  </template>
                  <!-- Extension data -->
                  <template v-if="notification.type === NOTIFICATION_TYPES.EXTENSION">
                    <div v-if="notification.data.system_name" class="font-medium">
                      System: {{ notification.data.system_name }}
                    </div>
                    <div v-if="notification.data.new_expiry" class="text-gray-600">
                      New expiry: {{ new Date(notification.data.new_expiry).toLocaleDateString() }}
                    </div>
                  </template>
                  <!-- Revocation data -->
                  <template v-if="notification.type === NOTIFICATION_TYPES.REVOCATION">
                    <div v-if="notification.data.system_name" class="font-medium">
                      System: {{ notification.data.system_name }}
                    </div>
                    <div v-if="notification.data.reason" class="text-gray-600 capitalize">
                      Reason: {{ notification.data.reason.replace('_', ' ') }}
                    </div>
                  </template>
                  <!-- Deletion data -->
                  <template v-if="notification.type === NOTIFICATION_TYPES.DELETION">
                    <div v-if="notification.data.system_name" class="font-medium">
                      System: {{ notification.data.system_name }}
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="!notification.read"
                @click="handleMarkAsRead(notification.id)"
                :disabled="isMarking === notification.id"
                class="px-3 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                <Loader2
                  v-if="isMarking === notification.id"
                  class="h-3 w-3 animate-spin"
                />
                <span v-else>Mark read</span>
              </button>
              <button
                @click="handleDelete(notification.id)"
                :disabled="isDeleting === notification.id"
                class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete notification"
              >
                <Loader2
                  v-if="isDeleting === notification.id"
                  class="h-4 w-4 animate-spin"
                />
                <Trash2 v-else class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

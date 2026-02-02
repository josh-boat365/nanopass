<script setup>
import { ref, onMounted } from "vue";
import { useNotifications } from "@/composables/useNotifications";
import { useToast } from "@/composables/useToast";
import BaseLayout from "@/layouts/AppLayout.vue";
import { Loader2, Trash2 } from "lucide-vue-next";

const {
  notifications,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = useNotifications();

const { success, error: showError } = useToast();
const isMarking = ref(null);
const isDeleting = ref(null);
const isMarkingAll = ref(false);

onMounted(async () => {
  await fetchNotifications();
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
          You have {{ notifications.filter((n) => !n.read).length }} unread
          notification{{
            notifications.filter((n) => !n.read).length !== 1 ? "s" : ""
          }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
        <span class="ml-2 text-gray-600">Loading notifications...</span>
      </div>

      <!-- No Notifications -->
      <div
        v-else-if="notifications.length === 0"
        class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center"
      >
        <p class="text-gray-500">No notifications yet.</p>
      </div>

      <!-- Notifications List -->
      <div v-else class="space-y-4">
        <!-- Mark All as Read Button -->
        <div
          v-if="notifications.some((n) => !n.read)"
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
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'rounded-lg border p-4 transition-colors',
            notification.read
              ? 'bg-white border-gray-200'
              : 'bg-blue-50 border-blue-200',
          ]"
        >
          <div class="flex items-start gap-4">
            <!-- Unread Indicator -->
            <div v-if="!notification.read" class="pt-1">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2">
                <h3 class="font-semibold text-gray-900">
                  {{ notification.title }}
                </h3>
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
              <p v-if="notification.type" class="mt-2 text-xs text-gray-500">
                Type: <span class="capitalize">{{ notification.type }}</span>
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
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

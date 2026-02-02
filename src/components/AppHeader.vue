<script setup>
import { PanelRightOpen, ChevronRight, Bell } from "lucide-vue-next";
import { onMounted, onUnmounted } from "vue";
import { useNotifications } from "@/composables/useNotifications";
import { useRouter } from "vue-router";

const router = useRouter();
const {
  notifications,
  unreadCount,
  fetchNotifications,
  startPolling,
  stopPolling,
} = useNotifications();

onMounted(async () => {
  await fetchNotifications();
  // Start polling every 30 seconds
  startPolling(30000);
});

onUnmounted(() => {
  stopPolling();
});

defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["toggle-sidebar"]);

const navigateTo = (path) => {
  if (path !== "#") {
    router.push(path);
  }
};
</script>

<template>
  <header
    class="flex h-16 items-center justify-between gap-4 border-b bg-white px-4"
  >
    <div class="flex items-center gap-4 flex-1">
      <button
        @click="$emit('toggle-sidebar')"
        class="rounded-md p-2 hover:bg-gray-100"
      >
        <PanelRightOpen class="h-5 w-5" />
      </button>

      <div class="h-4 w-px bg-gray-200"></div>

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm">
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
          <button
            v-if="crumb.path !== '#'"
            @click="navigateTo(crumb.path)"
            :class="[
              'hover:text-gray-900 transition-colors',
              index === breadcrumbs.length - 1
                ? 'text-gray-900 font-medium'
                : 'text-gray-600',
            ]"
          >
            {{ crumb.label }}
          </button>
          <span v-else class="text-gray-600">{{ crumb.label }}</span>
          <ChevronRight
            v-if="index < breadcrumbs.length - 1"
            class="h-4 w-4 text-gray-400"
          />
        </template>
      </nav>
    </div>
    <!-- Notification Bell Icon -->
    <router-link
      to="/notifications"
      class="relative ml-auto flex items-center group"
    >
      <Bell class="h-6 w-6 text-gray-500 hover:text-black transition-colors" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold"
        >{{ unreadCount }}</span
      >
    </router-link>
  </header>
</template>

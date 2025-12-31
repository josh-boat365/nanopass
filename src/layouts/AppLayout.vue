<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Clock, LogOut, X } from "lucide-vue-next";
import AppSidebar from "@/components/AppSideBar.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "../components/AppFooter.vue";
import { useSessionTimeout } from "@/composables/useSessionTimeout";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/composables/useToast";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { showError } = useToast();

// Initialize session timeout
const {
  showTimeoutWarning,
  remainingMinutes,
  extendSession,
  handleSessionExpired,
  forceLogout,
} = useSessionTimeout();

// Controls whether the sidebar is collapsed (icons-only) on desktop
const isCollapsed = ref(false);
// Controls mobile sidebar overlay visibility
const mobileOpen = ref(false);

// Handle logout from modal - uses robust session timeout logout
const handleLogout = async () => {
  console.log("📤 Logging out from session timeout modal...");

  try {
    // Call handleSessionExpired which has built-in error recovery
    await handleSessionExpired();
    // Show logout notification after successful redirect
    setTimeout(() => {
      showError("You have been logged out.");
    }, 150);
  } catch (err) {
    console.error("Error during logout:", err);
    showError("Logout completed.");
  }
};

// Generate breadcrumbs from route
const breadcrumbs = computed(() => {
  const routePath = route.path;
  const breadcrumbMap = {
    "/admin/dashboard": [{ label: "Dashboard", path: "/admin/dashboard" }],
    "/admin/dashboard/auth-trails": [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Access Trails", path: "/admin/dashboard/auth-trails" },
    ],
    "/dashboard/settings": [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Settings", path: "/dashboard/settings" },
    ],
    "/admin/dashboard/create-user": [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "User Management", path: "#" },
      { label: "Users", path: "/admin/dashboard/create-user" },
    ],
    "/admin/dashboard/create-privileges": [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "App Configs", path: "#" },
      { label: "Privileges", path: "/admin/dashboard/create-privileges" },
    ],
    "/admin/dashboard/create-system-passwords-category": [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "App Configs", path: "#" },
      {
        label: "System Categories",
        path: "/admin/dashboard/create-system-passwords-category",
      },
    ],
    "/admin/dashboard/create-system-passwords-policy-category": [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "App Configs", path: "#" },
      {
        label: "Password Policies",
        path: "/admin/dashboard/create-system-passwords-policy-category",
      },
    ],
    "/admin/dashboard/create-system-passwords": [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "App Configs", path: "#" },
      {
        label: "System Setup",
        path: "/admin/dashboard/create-system-passwords",
      },
    ],
    "/user/dashboard": [{ label: "My Dashboard", path: "/user/dashboard" }],
    "/user/assigned-keys": [
      { label: "My Dashboard", path: "/user/dashboard" },
      { label: "My Dashboard2", path: "/user/dashboard2" },
      { label: "Assigned Keys", path: "/user/assigned-keys" },
    ],
    "/user/personal-keys": [
      { label: "My Dashboard", path: "/user/dashboard" },
      { label: "My Dashboard2", path: "/user/dashboard2" },
      { label: "Personal Keys", path: "/user/personal-keys" },
    ],
  };

  return (
    breadcrumbMap[routePath] || [
      { label: "Dashboard", path: "/admin/dashboard" },
    ]
  );
});

const toggleSidebar = () => {
  // if small screen, toggle mobile overlay; else toggle collapse
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    mobileOpen.value = !mobileOpen.value;
  } else {
    isCollapsed.value = !isCollapsed.value;
  }
};
</script>

<template>
  <div class="flex h-screen">
    <!-- Session Timeout Warning Modal -->
    <div
      v-if="showTimeoutWarning"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <!-- Header -->
        <div
          class="border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50"
        >
          <div class="flex items-center gap-3">
            <Clock class="h-5 w-5 text-orange-600" />
            <h2 class="text-lg font-semibold text-gray-900">
              Session Expiring Soon
            </h2>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <p class="text-sm text-gray-600 mb-4">
            Your session will expire in
            <span class="font-bold text-red-600"
              >{{ remainingMinutes }} minute{{
                remainingMinutes !== 1 ? "s" : ""
              }}</span
            >
            due to inactivity.
          </p>
          <p class="text-xs text-gray-500">
            Click "Stay Signed In" to extend your session or you will be
            automatically logged out.
          </p>
        </div>

        <!-- Actions -->
        <div class="border-t px-6 py-4 flex gap-3 bg-gray-50">
          <button
            @click="extendSession"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Clock class="h-4 w-4" />
            Stay Signed In
          </button>
          <button
            @click="handleLogout"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <LogOut class="h-4 w-4" />
            Log Out
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="h-1 bg-gray-100">
          <div
            class="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
            :style="{ width: (remainingMinutes / 5) * 100 + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <AppSidebar :is-collapsed="isCollapsed" :is-mobile-open="mobileOpen" />

    <!-- Mobile backdrop when sidebar open -->
    <div
      v-if="mobileOpen"
      @click="mobileOpen = false"
      class="fixed inset-0 z-30 bg-black/40 md:hidden"
    ></div>

    <div class="flex flex-1 flex-col">
      <!-- Header -->
      <AppHeader
        :is-collapsed="isCollapsed"
        @toggle-sidebar="toggleSidebar"
        :breadcrumbs="breadcrumbs"
      />

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-gray-50 p-4">
        <slot />
      </main>

      <!-- Footer  -->
      <AppFooter />
    </div>
  </div>
</template>

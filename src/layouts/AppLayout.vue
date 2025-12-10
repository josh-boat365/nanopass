<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppSidebar from "@/components/AppSideBar.vue";
import AppHeader from "@/components/AppHeader.vue";

const route = useRoute();
const router = useRouter();

// Controls whether the sidebar is collapsed (icons-only) on desktop
const isCollapsed = ref(false);
// Controls mobile sidebar overlay visibility
const mobileOpen = ref(false);

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
    </div>
  </div>
</template>

<!-- AppSidebar.vue -->

<script setup>
import {
  Frame,
  Settings2,
  LayoutDashboard,
  Users2,
  SettingsIcon,
} from "lucide-vue-next";
import { useRoute } from "vue-router";
import { computed } from "vue";
import NavMain from "@/components/NavMain.vue";
// import NavProjects from '@/components/NavProjects.vue'
import NavUser from "@/components/NavUser.vue";
import AppLogo from "@/components/AppLogo.vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore";

const route = useRoute();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

defineProps({
  isCollapsed: { type: Boolean, default: false },
  isMobileOpen: { type: Boolean, default: false },
});

// Computed property to check if user is admin
const isAdmin = computed(() => userStore.isAdmin);

// All navigation items
const allNavMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    items: [
      {
        title: "Overview",
        url: "/admin/dashboard",
        roles: ["admin"],
      },
      {
        title: "My Dashboard",
        url: "/user/dashboard",
        roles: ["user"],
      },
      //   {
      //     title: "My Dashboard2",
      //     url: "/user/dashboard2",
      //     roles: ["user", "admin"],
      //   },
      {
        title: "Assigned Keys",
        url: "/user/assigned-keys",
        roles: ["user", "admin"],
      },
      {
        title: "Personal Keys",
        url: "/user/personal-keys",
        roles: ["user", "admin"],
      },
      {
        title: "Access Trails",
        url: "/admin/dashboard/auth-trails",
        roles: ["admin"],
      },
    ],
  },
  {
    title: "User Management",
    url: "#",
    icon: Users2,
    roles: ["admin"],
    items: [
      {
        title: "Users",
        url: "/admin/dashboard/create-user",
      },
      {
        title: "Assign Keys to Users",
        url: "/admin/dashboard/assign-systems-to-users",
      },
    ],
  },
  {
    title: "App Configs",
    url: "#",
    icon: Settings2,
    roles: ["admin"],
    items: [
      {
        title: "Create System Passwords Policy",
        url: "/admin/dashboard/create-system-passwords-policy",
      },
      {
        title: "Create System Category",
        url: "/admin/dashboard/create-system-category",
      },
      {
        title: "Create System/App",
        url: "/admin/dashboard/create-system",
      },
      {
        title: "Create Passwords For Systems/Apps",
        url: "/admin/dashboard/create-passwords-for-systems",
      },
    ],
  },
];

// Filter navigation items based on user role
const data = computed(() => {
  const userRole = isAdmin.value ? "admin" : "user";

  return {
    user: {
      name: user.value?.username || "NanoPass User",
      email: user.value?.email || "testuser@nanopass.com",
      avatar: "../assets/icons/codesandbox.svg",
    },
    navMain: allNavMain
      .filter((section) => !section.roles || section.roles.includes(userRole))
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.roles || item.roles.includes(userRole)
        ),
      })),
  };
});
</script>

<template>
  <aside
    :class="[
      // base
      'relative flex flex-col border-r bg-white',
      // animate width only so child content can animate separately
      'transition-[width] duration-300 ease-in-out',
      // width when collapsed or expanded
      isCollapsed ? 'w-16' : 'w-64',
      // layout behavior: hidden on small screens unless mobile open; visible on md+
      isMobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden md:flex',
      // full height for overlay mode
      isMobileOpen ? 'h-full' : 'h-screen',
    ]"
  >
    <!-- Header -->
    <div class="border-b p-4 border-gray-200">
      <button
        :class="[
          'flex items-center gap-3 rounded-md transition-all duration-300',
          isCollapsed ? 'justify-center' : 'w-full',
        ]"
      >
        <div
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-black text-white"
        >
          <AppLogo class="h-4 w-4" />
        </div>
        <div
          v-show="!isCollapsed"
          class="flex-1 text-left text-sm transition-all duration-300"
        >
          <div class="font-medium text-gray-900">NanoPass</div>
        </div>
      </button>
    </div>

    <!-- Content -->
    <div class="relative flex-1 overflow-y-auto">
      <NavMain
        :items="data.navMain"
        :is-collapsed="isCollapsed"
        :current-route="route.path"
      />
      <!-- <NavProjects v-if="!isCollapsed" :projects="data.projects" /> -->
    </div>

    <!-- Footer -->
    <div class="border-t p-2 border-gray-200">
      <NavUser :user="data.user" :is-collapsed="isCollapsed" />
    </div>
  </aside>
</template>

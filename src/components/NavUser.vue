<!-- NavUser.vue -->
<script setup>
import { Bell, ChevronsUpDown, Settings, LogOut } from "lucide-vue-next";
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const userStore = useUserStore();
const { success, error } = useToast();

const props = defineProps({
  user: Object,
  isCollapsed: Boolean,
});

const showDropdown = ref(false);
const dropdownContainer = ref(null);

const closeDropdown = () => {
  showDropdown.value = false;
};

const handleLogout = async () => {
  try {
    await userStore.logout();
    success("Logged out successfully");
    await router.push("/login");
  } catch (err) {
    error("Logout failed. Please try again.");
  }
};

const handleClickOutside = (event) => {
  if (
    dropdownContainer.value &&
    !dropdownContainer.value.contains(event.target)
  ) {
    closeDropdown();
  }
};

// Compute full name from firstName and surname (same as Create.vue)
const getFullName = () => {
  const fullName =
    `${props.user?.firstName || ""} ${props.user?.surname || ""}`.trim();
  return fullName || props.user?.username || props.user?.email || "User";
};

// Get initials from firstName and surname
const getInitials = () => {
  const first = (props.user?.firstName || "").substring(0, 1).toUpperCase();
  const last = (props.user?.surname || "").substring(0, 1).toUpperCase();
  return first + last || "U";
};
// Extract username from email (jnboateng@bestpointgh.com -> jnboateng)
const getUsername = () => {
  const username = props.user?.username;
  if (username && username.includes("@")) {
    return username.split("@")[0];
  }
  return username || "user";
};
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="dropdownContainer" class="relative">
    <button
      @click="showDropdown = !showDropdown"
      :class="[
        'group relative flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-50',
        isCollapsed ? 'justify-center' : '',
      ]"
      :aria-label="getFullName()"
    >
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-semibold"
      >
        {{ getInitials() }}
      </div>
      <div
        v-show="!isCollapsed"
        class="flex-1 text-left text-sm transition-all duration-200"
      >
        <div class="font-medium text-gray-900">{{ getFullName() }}</div>
        <div class="text-xs text-gray-500">{{ props.user.email }}</div>
      </div>
      <ChevronsUpDown v-show="!isCollapsed" class="h-4 w-4 text-gray-500" />

      <!-- Tooltip for collapsed user button -->
      <span
        v-if="isCollapsed"
        role="tooltip"
        class="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus:block"
      >
        {{ getFullName() }}
      </span>
    </button>

    <!-- Dropdown menu -->
    <div
      v-if="showDropdown"
      :class="[
        'absolute z-50 mb-2 w-56 rounded-lg border bg-white shadow-lg',
        isCollapsed ? 'bottom-full left-16' : 'bottom-full left-0',
      ]"
    >
      <div class="flex items-center gap-2 border-b px-3 py-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-semibold"
        >
          {{ getInitials() }}
        </div>
        <div class="flex-1 text-sm">
          <div class="font-semibold text-gray-900">{{ getFullName() }}</div>
          <div class="text-xs text-gray-500">{{ props.user.email }}</div>
        </div>
      </div>

      <!-- <div class="border-b py-1">
                <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                    <Sparkles class="h-4 w-4" />
                    <span>Upgrade to Pro</span>
                </button>
            </div> -->

      <div class="border-b py-1">
        <router-link to="/dashboard/settings" @click="closeDropdown">
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Settings class="h-4 w-4" />
            <span>Settings</span>
          </button>
        </router-link>
        <router-link to="/notifications" @click="closeDropdown">
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Bell class="h-4 w-4" />
            <span>Notifications</span>
          </button>
        </router-link>
      </div>

      <div class="py-1">
        <button
          @click="
            async () => {
              await handleLogout();
              closeDropdown();
            }
          "
          class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <LogOut class="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  </div>
</template>

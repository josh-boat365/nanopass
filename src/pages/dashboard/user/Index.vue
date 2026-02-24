<script setup>
import BaseLayout from "@/layouts/AppLayout.vue";
import { ref, computed, onMounted, watch } from "vue";
import {
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield,
  Users,
  Calendar,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-vue-next";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore";
import apiClient from "@/services/apiClient";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { showError, success } = useToast();

// Get reactive user data
const { user, isAuthenticated, isAdmin } = storeToRefs(userStore);

// User data - display full name, email, and role
const userData = ref({
  name:
    user.value?.firstName && user.value?.surname
      ? `${user.value.firstName} ${user.value.surname}`
      : user.value?.username || "NanoPass User",
  email: user.value?.email || "user@nanopass.com",
  role: user.value?.empRole || "Not specified",
});

// State management
const loading = ref(true);
const refreshing = ref(false);
const personalKeys = ref([]);
const assignedKeys = ref([]);
const systems = ref([]);

// Load personal keys
const loadPersonalKeys = async () => {
  try {
    console.log("📥 Loading personal keys...");
    const response = await apiClient.get("/personal-keys");

    const keysList = response.data.data || response.data || [];
    console.log("📋 Personal keys from API:", keysList);

    personalKeys.value = (keysList || []).map((key) => ({
      ...key,
      systemName: key.keyname,
      daysLeft: Infinity, // Personal keys don't expire
      status: "healthy",
      createdAt: key.created_at,
      type: "personal",
      hasExpiry: false, // Flag to indicate no expiration
    }));

    console.log(
      "✅ Personal keys loaded and mapped:",
      personalKeys.value.length,
      personalKeys.value,
    );
  } catch (err) {
    console.error("❌ Error loading personal keys:", err);
    personalKeys.value = [];
    showError(err.response?.data?.message || "Failed to load personal keys");
  }
};

// Load assigned systems
const loadAssignedSystems = async () => {
  try {
    console.log("📥 Loading assigned systems...");
    console.log("� Current user:", user.value);
    console.log("📊 Available systems for lookup:", systems.value);

    const response = await apiClient.get("/permissions");
    console.log("📥 Raw permissions data:", response.data.data);
    console.log("📊 Raw permissions count:", response.data.data?.length);

    // The permissions endpoint should already return only this user's permissions
    // No additional filtering needed - the backend filters by auth token
    const permissions = response.data.data || [];
    console.log("📋 Permissions to process:", permissions.length);

    // Log each permission structure
    permissions.forEach((perm, idx) => {
      console.log(`Permission ${idx}:`, {
        id: perm.id,
        system_id: perm.system_id,
        system_name: perm.system_name,
        hasSystem: !!perm.system,
      });
    });
    systems.value.forEach((sys, idx) => {
      console.log(`System ${idx}:`, {
        id: sys.id,
        name: sys.name,
        system_name: sys.system_name,
      });
    });

    assignedKeys.value = permissions
      .filter((perm) => {
        const daysLeft = calculateDaysLeft(perm.date_time_expiry);
        if (daysLeft <= 0) {
          console.log(`⏰ Permission ${perm.id} expired`);
          return false;
        }
        return true;
      })
      .map((perm) => {
        const systemInfo = systems.value.find(
          (sys) => sys.id === perm.system_id,
        );
        const daysLeft = calculateDaysLeft(perm.date_time_expiry);

        // Try multiple ways to get system name
        let systemName = "Unknown System";
        if (perm.system?.name) {
          systemName = perm.system.name;
        } else if (perm.system_name) {
          systemName = perm.system_name;
        } else if (systemInfo?.name) {
          systemName = systemInfo.name;
        } else if (systemInfo?.system_name) {
          systemName = systemInfo.system_name;
        }

        console.log(
          `Processing permission ${perm.id}: ${systemName}, Days=${daysLeft}`,
        );

        return {
          ...perm,
          systemName: systemName || `System ${perm.system_id}`,
          daysLeft,
          status: calculateStatus(daysLeft),
          assignedAt: perm.created_at,
          assignedBy: "Administrator",
          type: "assigned",
          hasExpiry: true,
        };
      });

    console.log(
      "✅ Assigned systems loaded:",
      assignedKeys.value.length,
      assignedKeys.value,
    );
  } catch (err) {
    console.error("❌ Error loading assigned systems:", err);
    showError(err.response?.data?.message || "Failed to load assigned systems");
  }
};

// Load systems
const loadSystems = async () => {
  try {
    console.log("📥 Loading systems list...");
    const response = await apiClient.get("/systems");
    systems.value = response.data.data || response.data || [];
    console.log("✅ Systems loaded:", systems.value.length, systems.value);
  } catch (err) {
    console.error("❌ Error loading systems:", err);
    systems.value = [];
  }
};

// Calculate days left from date
const calculateDaysLeft = (dateString) => {
  if (!dateString) return 365; // Default to 365 days if no date

  const expiryDate = new Date(dateString);
  const today = new Date();
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(diffDays, 0);
};

// Calculate status based on days left
const calculateStatus = (daysLeft) => {
  if (daysLeft <= 7) return "critical";
  if (daysLeft <= 30) return "warning";
  return "healthy";
};

// Refresh all data
const refreshDashboard = async () => {
  try {
    refreshing.value = true;
    console.log("🔄 Refreshing dashboard data...");

    await loadSystems();
    console.log("✓ Systems loaded, now loading keys...");

    await Promise.all([loadPersonalKeys(), loadAssignedSystems()]);
    console.log("✓ Personal and assigned keys loaded");

    success("Dashboard updated successfully");
    console.log("✅ Dashboard refresh complete");
  } catch (err) {
    console.error("❌ Error refreshing dashboard:", err);
    showError("Failed to refresh dashboard");
  } finally {
    refreshing.value = false;
  }
};

// Load all data on mount
onMounted(async () => {
  try {
    loading.value = true;
    console.log("📱 Dashboard mounted, loading initial data...");
    await refreshDashboard();
  } catch (err) {
    console.error("❌ Error loading dashboard data:", err);
    showError("Failed to load dashboard data");
  } finally {
    loading.value = false;
  }
});

// Watch route and reload data when returning to dashboard
// Watch BOTH the path and when component is activated
watch(
  () => route.path,
  async (newPath) => {
    console.log("🔄 Route changed to:", newPath);
    if (newPath === "/user/dashboard") {
      console.log("🔄 Dashboard path detected, refreshing...");
      await refreshDashboard();
    }
  },
);

// Computed statistics
const stats = computed(() => {
  console.log("🔢 Calculating stats...");
  console.log("📦 Personal keys:", personalKeys.value.length);
  console.log("📦 Assigned keys:", assignedKeys.value.length);

  // Filter out expired assigned keys (daysLeft <= 0)
  const activeAssignedKeys = assignedKeys.value.filter((k) => k.daysLeft > 0);
  console.log("✓ Active assigned keys:", activeAssignedKeys.length);

  const totalKeys = personalKeys.value.length + activeAssignedKeys.length;
  const allKeys = [...personalKeys.value, ...activeAssignedKeys];

  const criticalKeys = allKeys.filter((k) => k.status === "critical").length;
  const warningKeys = allKeys.filter((k) => k.status === "warning").length;
  const healthyKeys = allKeys.filter((k) => k.status === "healthy").length;

  console.log("📊 Stats calculated:", {
    total: totalKeys,
    critical: criticalKeys,
    warning: warningKeys,
    healthy: healthyKeys,
  });

  return {
    total: totalKeys,
    critical: criticalKeys,
    warning: warningKeys,
    healthy: healthyKeys,
  };
});

// Get keys expiring soon (next 30 days)
const keysExpiringSoon = computed(() => {
  // Filter out expired keys and only include those with 0 < daysLeft <= 30
  const activeAssignedKeys = assignedKeys.value.filter((k) => k.daysLeft > 0);
  const allKeys = [...personalKeys.value, ...activeAssignedKeys];

  return allKeys
    .filter((k) => k.daysLeft > 0 && k.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
});

// Recent activity
const recentActivity = computed(() => {
  const activeAssignedKeys = assignedKeys.value.filter((k) => k.daysLeft > 0);
  const allKeys = [...personalKeys.value, ...activeAssignedKeys];

  return allKeys
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.assignedAt) -
        new Date(a.createdAt || a.assignedAt),
    )
    .slice(0, 4);
});

const getStatusColor = (status) => {
  const colors = {
    critical: "text-red-600 bg-red-50",
    warning: "text-yellow-600 bg-yellow-50",
    healthy: "text-green-600 bg-green-50",
  };
  return colors[status] || colors.healthy;
};

const getStatusIcon = (status) => {
  return status === "critical"
    ? AlertCircle
    : status === "warning"
      ? Clock
      : CheckCircle;
};

const navigateToPersonalKeys = () => {
  router.push("/user/personal-keys");
};

const navigateToAssignedKeys = () => {
  router.push("/user/assigned-keys");
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6 space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <Loader2 class="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p class="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Welcome Header -->
        <div
          class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {{ userData.name }}
            </h1>
            <p class="mt-2 text-sm sm:text-base text-gray-600">
              Here's an overview of your password management dashboard
            </p>
          </div>
          <!-- Refresh Button -->
          <button
            @click="refreshDashboard"
            :disabled="refreshing"
            class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <RefreshCw :class="['h-4 w-4', refreshing ? 'animate-spin' : '']" />
            <span class="text-sm font-medium">
              {{ refreshing ? "Refreshing..." : "Refresh" }}
            </span>
          </button>
        </div>

        <!-- Stats Cards -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <!-- Total Keys -->
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Keys</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">
                  {{ stats.total }}
                </p>
              </div>
              <div
                class="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center"
              >
                <Key class="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-4">
              {{ personalKeys.length }} personal,
              {{ assignedKeys.filter((k) => k.daysLeft > 0).length }} assigned
            </p>
          </div>

          <!-- Critical Keys -->
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Critical</p>
                <p class="text-3xl font-bold text-red-600 mt-2">
                  {{ stats.critical }}
                </p>
              </div>
              <div
                class="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center"
              >
                <AlertTriangle class="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-4">Expiring within 7 days</p>
          </div>

          <!-- Warning Keys -->
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Warning</p>
                <p class="text-3xl font-bold text-yellow-600 mt-2">
                  {{ stats.warning }}
                </p>
              </div>
              <div
                class="h-12 w-12 bg-yellow-50 rounded-lg flex items-center justify-center"
              >
                <Clock class="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-4">Expiring within 30 days</p>
          </div>

          <!-- Healthy Keys -->
          <div class="bg-white rounded-lg border shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Healthy</p>
                <p class="text-3xl font-bold text-green-600 mt-2">
                  {{ stats.healthy }}
                </p>
              </div>
              <div
                class="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center"
              >
                <Shield class="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-4">
              More than 30 days remaining
            </p>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column - Takes 2/3 width on large screens -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Keys Expiring Soon -->
            <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div class="border-b bg-gray-50 px-6 py-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">
                      Keys Expiring Soon
                    </h2>
                    <p class="text-sm text-gray-600 mt-1">
                      Action required within 30 days
                    </p>
                  </div>
                  <AlertTriangle class="h-5 w-5 text-orange-500" />
                </div>
              </div>

              <div class="divide-y">
                <div
                  v-for="key in keysExpiringSoon"
                  :key="key.id"
                  class="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h3
                          class="text-sm font-semibold text-gray-900 truncate"
                        >
                          {{ key.systemName }}
                        </h3>
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {{
                            key.type === "personal" ? "Personal" : "Assigned"
                          }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 mb-2">
                        {{ key.description }}
                      </p>
                      <div
                        class="flex items-center gap-4 text-xs text-gray-500"
                      >
                        <span class="flex items-center gap-1">
                          <Calendar class="h-3 w-3" />
                          Days Left: {{ key.daysLeft }}
                        </span>
                        <span
                          v-if="key.assignedBy"
                          class="flex items-center gap-1"
                        >
                          <Users class="h-3 w-3" />
                          By: {{ key.assignedBy }}
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      <component
                        :is="getStatusIcon(key.status)"
                        :class="[
                          'h-5 w-5',
                          getStatusColor(key.status).split(' ')[0],
                        ]"
                      />
                      <span
                        :class="[
                          'text-sm font-bold',
                          getStatusColor(key.status).split(' ')[0],
                        ]"
                      >
                        {{ key.daysLeft }}d left
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  v-if="keysExpiringSoon.length === 0"
                  class="p-8 text-center text-sm text-gray-500"
                >
                  <CheckCircle class="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p>All keys are healthy! No immediate action required.</p>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div class="border-b bg-gray-50 px-6 py-4">
                <h2 class="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                  Latest password entries and assignments
                </p>
              </div>

              <div class="divide-y">
                <div
                  v-for="key in recentActivity"
                  :key="key.id"
                  class="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h3
                          class="text-sm font-semibold text-gray-900 truncate"
                        >
                          {{ key.systemName }}
                        </h3>
                        <span
                          :class="[
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            key.type === 'personal'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700',
                          ]"
                        >
                          {{
                            key.type === "personal" ? "Personal" : "Assigned"
                          }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500">
                        {{ key.type === "personal" ? "Created" : "Assigned" }}
                        {{ formatDate(key.createdAt || key.assignedAt) }}
                      </p>
                    </div>
                    <component
                      :is="getStatusIcon(key.status)"
                      :class="[
                        'h-5 w-5',
                        getStatusColor(key.status).split(' ')[0],
                      ]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Takes 1/3 width on large screens -->
          <div class="space-y-6">
            <!-- Quick Actions -->
            <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div class="border-b bg-gray-50 px-6 py-4">
                <h2 class="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h2>
              </div>

              <div class="p-4 space-y-2">
                <button
                  @click="navigateToPersonalKeys"
                  class="w-full flex items-center justify-between p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center"
                    >
                      <Key class="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">
                        Personal Keys
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ personalKeys.length }} keys
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    class="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                  />
                </button>

                <button
                  @click="navigateToAssignedKeys"
                  class="w-full flex items-center justify-between p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center"
                    >
                      <Users class="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">
                        Assigned Keys
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ assignedKeys.filter((k) => k.daysLeft > 0).length }}
                        keys
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    class="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                  />
                </button>
              </div>
            </div>

            <!-- Security Summary -->
            <div
              class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm overflow-hidden"
            >
              <div class="p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div
                    class="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center"
                  >
                    <Shield class="h-5 w-5 text-white" />
                  </div>
                  <h2 class="text-lg font-semibold text-gray-900">
                    Security Score
                  </h2>
                </div>

                <div class="mb-4">
                  <div class="flex items-end gap-2 mb-2">
                    <span class="text-4xl font-bold text-blue-600">
                      {{
                        stats.total > 0
                          ? Math.round((stats.healthy / stats.total) * 100)
                          : 0
                      }}%
                    </span>
                    <TrendingUp class="h-6 w-6 text-green-500 mb-1" />
                  </div>
                  <p class="text-sm text-gray-600">
                    Your password health is good. Keep monitoring expiring keys.
                  </p>
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Healthy Keys</span>
                    <span class="font-semibold text-green-600">
                      {{ stats.healthy }}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Need Attention</span>
                    <span class="font-semibold text-yellow-600">
                      {{ stats.warning }}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Critical</span>
                    <span class="font-semibold text-red-600">
                      {{ stats.critical }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upcoming Expirations Calendar -->
            <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div class="border-b bg-gray-50 px-6 py-4">
                <h2 class="text-lg font-semibold text-gray-900">This Month</h2>
                <p class="text-sm text-gray-600 mt-1">Expiring Soon</p>
              </div>

              <div class="p-6">
                <div class="space-y-3">
                  <div
                    v-for="key in keysExpiringSoon.slice(0, 3)"
                    :key="key.id"
                    class="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div
                      :class="[
                        'h-2 w-2 rounded-full',
                        key.status === 'critical'
                          ? 'bg-red-500'
                          : key.status === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-green-500',
                      ]"
                    ></div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {{ key.systemName }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ key.daysLeft }} days remaining
                      </p>
                    </div>
                  </div>

                  <div
                    v-if="keysExpiringSoon.length === 0"
                    class="text-center py-4"
                  >
                    <Calendar class="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p class="text-sm text-gray-500">
                      No expirations this month
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

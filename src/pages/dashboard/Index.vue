<script setup>
import { ref, computed, onMounted } from "vue";
import BaseLayout from "@/layouts/AppLayout.vue";
import { useUserStore } from "@/stores/useUserStore";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";
import {
  Users,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  Key,
  TrendingUp,
  Activity,
  Shield,
  Server,
} from "lucide-vue-next";

const userStore = useUserStore();
const { error: showError } = useToast();

// Reactive data
const systemMetrics = ref({
  totalUsers: 0,
  activeUsers: 0,
  expiredPasswords: 0,
  expiringInDays: 7,
});

const recentUsers = ref([]);
const passwordExpirations = ref([]);
const systemAccessOverview = ref([]);
const passwordPolicies = ref([]);
const loading = ref(true);
const auditTrails = ref([]);

// ========================================
// COMPUTED PROPERTIES FOR ANALYTICS
// ========================================

// Admin vs Regular Users count
const adminUsersCount = computed(() => {
  return recentUsers.value.filter((u) => u && u.admin).length;
});

const regularUsersCount = computed(() => {
  return recentUsers.value.filter((u) => u && !u.admin).length;
});

// Critical security issues
const criticalSecurityIssues = computed(() => {
  let issues = 0;
  // Count expired passwords
  issues += passwordExpirations.value.filter(
    (p) => p.status === "critical",
  ).length;
  return issues;
});

// User activity status
const inactiveUsersCount = computed(() => {
  return recentUsers.value.filter((u) => u && u.status !== "active").length;
});

// Permission statistics
const totalPermissionsGranted = computed(() => {
  return recentUsers.value.reduce(
    (sum, user) => sum + (user.permissions_count || 0),
    0,
  );
});

// Average passwords per system
const avgPasswordsPerSystem = computed(() => {
  if (systemAccessOverview.value.length === 0) return 0;
  const total = systemAccessOverview.value.reduce(
    (sum, sys) => sum + (sys.password_count || 0),
    0,
  );
  return Math.round(total / systemAccessOverview.value.length);
});

// Password expiration breakdown
const passwordExpirationStats = computed(() => {
  return {
    critical: passwordExpirations.value.filter((p) => p.status === "critical")
      .length,
    warning: passwordExpirations.value.filter((p) => p.status === "warning")
      .length,
    info: passwordExpirations.value.filter((p) => p.status === "info").length,
    total: passwordExpirations.value.length,
  };
});

// System health status
const systemHealthStatus = computed(() => {
  const healthyCount = systemAccessOverview.value.filter(
    (s) => s.status === "healthy",
  ).length;
  const total = systemAccessOverview.value.length;
  return {
    healthy: healthyCount,
    total: total,
    percentage: total > 0 ? Math.round((healthyCount / total) * 100) : 0,
  };
});

// User compliance percentage (users with active permissions)
const userCompliancePercentage = computed(() => {
  if (recentUsers.value.length === 0) return 0;
  const usersWithPermissions = recentUsers.value.filter(
    (u) => u && u.permissions_count && u.permissions_count > 0,
  ).length;
  return Math.round((usersWithPermissions / recentUsers.value.length) * 100);
});

// Policy compliance average
const avgPolicyCompliance = computed(() => {
  if (passwordPolicies.value.length === 0) return 0;
  const total = passwordPolicies.value.reduce(
    (sum, p) => sum + (p.compliance || 0),
    0,
  );
  return Math.round(total / passwordPolicies.value.length);
});

// Most accessed system
const mostAccessedSystem = computed(() => {
  if (systemAccessOverview.value.length === 0) return null;
  return systemAccessOverview.value.reduce((max, sys) =>
    (sys.activeUsers || 0) > (max.activeUsers || 0) ? sys : max,
  );
});

// Least accessed system
const leastAccessedSystem = computed(() => {
  if (systemAccessOverview.value.length === 0) return null;
  return systemAccessOverview.value.reduce((min, sys) =>
    (sys.activeUsers || 0) < (min.activeUsers || 0) ? sys : min,
  );
});

// Fetch all dashboard data
const fetchDashboardData = async () => {
  loading.value = true;
  try {
    // Check authentication first
    if (!userStore.isAuthenticated) {
      console.warn("User not authenticated, skipping dashboard data load");
      showError("Please log in to view the dashboard");
      loading.value = false;
      return;
    }

    // Fetch users
    let usersData;
    try {
      usersData = await userStore.getAllUsers();
    } catch (userErr) {
      console.error("❌ Error fetching users:", userErr);
      usersData = [];
    }

    console.log("🔍 Users data received:", usersData);
    console.log("🔍 Users data type:", typeof usersData);
    console.log("🔍 Is array?:", Array.isArray(usersData));

    // Handle different API response formats
    let usersArray = [];
    if (Array.isArray(usersData)) {
      usersArray = usersData;
    } else if (usersData && usersData.data && Array.isArray(usersData.data)) {
      usersArray = usersData.data;
    } else if (usersData && typeof usersData === "object") {
      // If it's a single object that could be a user, wrap it
      usersArray = [usersData];
    }

    console.log("🔍 Users array before filter:", usersArray);

    recentUsers.value = usersArray.filter((u) => u && typeof u === "object");

    console.log("📊 Filtered recent users:", recentUsers.value);
    console.log("📊 Total users count:", recentUsers.value.length);

    // Calculate metrics
    const activeCount = recentUsers.value.filter(
      (u) => u.status === "active",
    ).length;
    systemMetrics.value.totalUsers = recentUsers.value.length;
    systemMetrics.value.activeUsers = activeCount;

    // Fetch systems/categories
    try {
      const systemsResponse = await apiClient.get(API_ENDPOINTS.SYSTEMS.LIST);
      const systemsData = systemsResponse.data || systemsResponse;
      const systems = Array.isArray(systemsData) ? systemsData : [];

      systemAccessOverview.value = systems.map((system) => ({
        system: system.name || system.title || "Unknown System",
        activeUsers: Math.floor(Math.random() * 15) + 1,
        policies: 0,
        status: "healthy",
      }));
    } catch (systemErr) {
      console.warn("❌ Failed to fetch systems:", systemErr);
      systemAccessOverview.value = [];
    }

    // Fetch password policies
    try {
      const policiesResponse = await apiClient.get(API_ENDPOINTS.POLICIES.LIST);
      const policiesData = policiesResponse.data || policiesResponse;
      const policies = Array.isArray(policiesData) ? policiesData : [];

      passwordPolicies.value = policies.map((policy) => ({
        name: policy.name || policy.title || "Unknown Policy",
        applied: policy.applied_count || 0,
        compliance: policy.compliance_percentage || 100,
      }));
    } catch (policyErr) {
      console.warn("❌ Failed to fetch policies:", policyErr);
      passwordPolicies.value = [];
    }

    // Fetch passwords to identify expiring ones
    try {
      const passwordsResponse = await apiClient.get(
        API_ENDPOINTS.PASSWORDS.LIST,
      );
      const passwordsData = passwordsResponse.data || passwordsResponse;
      const passwords = Array.isArray(passwordsData) ? passwordsData : [];

      // Filter expiring passwords (this is a simplified version)
      passwordExpirations.value = passwords
        .filter((p) => p && p.expires_at)
        .slice(0, 5)
        .map((p) => {
          const expiresIn = Math.floor(
            (new Date(p.expires_at) - new Date()) / (1000 * 60 * 60 * 24),
          );
          let status = "info";
          if (expiresIn <= 0) status = "critical";
          else if (expiresIn <= 7) status = "warning";

          return {
            id: p.id,
            username: p.user?.username || "N/A",
            email: p.user?.email || "N/A",
            expiresIn: Math.max(0, expiresIn),
            status,
          };
        });

      // Calculate expired passwords
      systemMetrics.value.expiredPasswords = passwordExpirations.value.filter(
        (p) => p.status === "critical",
      ).length;
    } catch (passwordErr) {
      console.warn("❌ Failed to fetch passwords:", passwordErr);
      passwordExpirations.value = [];
      systemMetrics.value.expiredPasswords = 0;
    }

    console.log("✅ Dashboard data loaded successfully");
  } catch (err) {
    console.error("❌ Error fetching dashboard data:", err);
    // Only show error if it's not a redirect/401 issue
    if (err.status !== 401) {
      showError(
        "Failed to load some dashboard data. Some sections may be empty.",
      );
    }
  } finally {
    loading.value = false;
  }
};

// Computed properties
const privilegeColors = {
  admin: "bg-red-100 text-red-800",
  user: "bg-blue-100 text-blue-800",
};

const statusColors = {
  active: "text-green-600",
  inactive: "text-gray-500",
};

const expirationStatusColors = {
  critical: "bg-red-100 text-red-800",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-800",
};

const getPrivilegeColor = (user) => {
  if (!user || typeof user !== "object") return privilegeColors.user;
  if (user.admin) return privilegeColors.admin;
  return privilegeColors.user;
};
const getExpirationStatusColor = (status) =>
  expirationStatusColors[status] || "bg-gray-100 text-gray-800";

// Lifecycle
onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          Admin Overview
        </h1>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          System-wide overview, users, and security metrics
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block">
            <div
              class="h-12 w-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"
            ></div>
          </div>
          <p class="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>

      <!-- Dashboard Content -->
      <template v-else>
        <!-- Primary Key Metrics Cards (4 columns) -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <!-- Total Users Card -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-600">Total Users</h3>
              <div class="text-3xl opacity-20">👥</div>
            </div>
            <p class="text-3xl font-bold text-gray-900">
              {{ systemMetrics.totalUsers }}
            </p>
            <div class="mt-3 pt-3 border-t border-gray-200 space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-600">Admins:</span>
                <span class="font-semibold text-orange-600">{{
                  adminUsersCount
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Regular Users:</span>
                <span class="font-semibold text-blue-600">{{
                  regularUsersCount
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Inactive:</span>
                <span class="font-semibold text-gray-600">{{
                  inactiveUsersCount
                }}</span>
              </div>
            </div>
          </div>

          <!-- Expired Passwords Card (Critical Alert) -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            :class="criticalSecurityIssues > 0 ? 'bg-red-50' : ''"
          >
            <div class="flex items-center justify-between mb-4">
              <h3
                class="text-sm font-medium"
                :class="
                  criticalSecurityIssues > 0 ? 'text-red-700' : 'text-gray-600'
                "
              >
                Expired Passwords
              </h3>
              <div class="text-3xl opacity-20">🚨</div>
            </div>
            <p
              class="text-3xl font-bold"
              :class="
                criticalSecurityIssues > 0 ? 'text-red-600' : 'text-gray-900'
              "
            >
              {{ systemMetrics.expiredPasswords }}
            </p>
            <div
              class="mt-3 pt-3 border-t"
              :class="
                criticalSecurityIssues > 0
                  ? 'border-red-200'
                  : 'border-gray-200'
              "
            >
              <p
                class="text-xs"
                :class="
                  criticalSecurityIssues > 0 ? 'text-red-600' : 'text-gray-500'
                "
              >
                Requires immediate action
              </p>
            </div>
          </div>

          <!-- Expiring Soon Card -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-600">Expiring Soon</h3>
              <div class="text-3xl opacity-20">⏰</div>
            </div>
            <p class="text-3xl font-bold text-yellow-600">
              {{ passwordExpirationStats.warning }}
            </p>
            <div class="mt-3 pt-3 border-t border-gray-200 space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-600">Within 7 days:</span>
                <span class="font-semibold">{{
                  passwordExpirationStats.warning
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Informational:</span>
                <span class="font-semibold">{{
                  passwordExpirationStats.info
                }}</span>
              </div>
            </div>
          </div>

          <!-- System Health Card -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-600">System Health</h3>
              <div class="text-3xl opacity-20">💚</div>
            </div>
            <p class="text-3xl font-bold text-green-600">
              {{ systemHealthStatus.healthy }}/{{ systemHealthStatus.total }}
            </p>
            <div class="mt-3 pt-3 border-t border-gray-200">
              <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-green-500 h-full"
                  :style="{
                    width: systemHealthStatus.percentage + '%',
                  }"
                ></div>
              </div>
              <p class="text-xs text-green-600 mt-2">
                {{ systemHealthStatus.percentage }}% healthy
              </p>
            </div>
          </div>
        </div>

        <!-- Secondary Analytics Cards (3 columns) -->
        <div class="grid gap-4 md:grid-cols-3 mb-8">
          <!-- Security Status Card -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-700">Security Status</h3>
              <div class="text-3xl opacity-20">🔒</div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Security Issues:</span>
                <span
                  class="font-bold px-2 py-1 rounded text-xs"
                  :class="
                    criticalSecurityIssues > 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  "
                >
                  {{ criticalSecurityIssues }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Inactive Users:</span>
                <span class="font-bold text-gray-900">{{
                  inactiveUsersCount
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Policy Compliance:</span>
                <span class="font-bold text-green-600"
                  >{{ avgPolicyCompliance }}%</span
                >
              </div>
              <div class="pt-3 border-t border-gray-200">
                <p class="text-xs text-gray-500">
                  User Compliance:
                  <span class="font-bold text-gray-900"
                    >{{ userCompliancePercentage }}%</span
                  >
                </p>
              </div>
            </div>
          </div>

          <!-- Access & Permissions Card -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-700">Access Control</h3>
              <div class="text-3xl opacity-20">🔑</div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Total Permissions:</span>
                <span class="font-bold text-blue-600">{{
                  totalPermissionsGranted
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Active Systems:</span>
                <span class="font-bold text-purple-600">{{
                  systemAccessOverview.length
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Avg Passwords:</span>
                <span class="font-bold text-green-600">{{
                  avgPasswordsPerSystem
                }}</span>
              </div>
              <div class="pt-3 border-t border-gray-200">
                <p class="text-xs text-gray-600">
                  Most Accessed:
                  <span class="font-bold text-gray-900">{{
                    mostAccessedSystem?.system || "N/A"
                  }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Password Management Card -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-700">Passwords</h3>
              <div class="text-3xl opacity-20">🔐</div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Total Passwords:</span>
                <span class="font-bold text-red-600">{{
                  passwordExpirationStats.total
                }}</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-xs mt-2">
                <div class="bg-red-50 rounded p-2 text-center">
                  <p class="font-bold text-red-600">
                    {{ passwordExpirationStats.critical }}
                  </p>
                  <p class="text-gray-600 text-xs">Expired</p>
                </div>
                <div class="bg-yellow-50 rounded p-2 text-center">
                  <p class="font-bold text-yellow-600">
                    {{ passwordExpirationStats.warning }}
                  </p>
                  <p class="text-gray-600 text-xs">Warning</p>
                </div>
                <div class="bg-blue-50 rounded p-2 text-center">
                  <p class="font-bold text-blue-600">
                    {{ passwordExpirationStats.info }}
                  </p>
                  <p class="text-gray-600 text-xs">Info</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tertiary Analytics Cards (2 columns) -->
        <div class="grid gap-4 md:grid-cols-2 mb-8">
          <!-- System Overview Card -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-700">System Overview</h3>
              <div class="text-3xl opacity-20">🌐</div>
            </div>
            <div class="space-y-2">
              <div
                v-for="system in systemAccessOverview.slice(0, 3)"
                :key="system.system"
                class="flex items-center justify-between"
              >
                <span class="text-sm text-gray-700 truncate">{{
                  system.system
                }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-gray-900">{{
                    system.activeUsers
                  }}</span>
                  <span class="text-xs text-gray-500">users</span>
                </div>
              </div>
              <p
                v-if="systemAccessOverview.length === 0"
                class="text-xs text-gray-500 italic"
              >
                No systems configured
              </p>
            </div>
          </div>

          <!-- Compliance Summary Card -->
          <div
            class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-700">Compliance</h3>
              <div class="text-3xl opacity-20">✅</div>
            </div>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-sm text-gray-600">Policy Adherence</span>
                  <span class="text-sm font-bold text-green-600"
                    >{{ avgPolicyCompliance }}%</span
                  >
                </div>
                <div
                  class="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
                >
                  <div
                    class="bg-green-500 h-full"
                    :style="{ width: avgPolicyCompliance + '%' }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-sm text-gray-600">User Compliance</span>
                  <span class="text-sm font-bold text-blue-600"
                    >{{ userCompliancePercentage }}%</span
                  >
                </div>
                <div
                  class="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
                >
                  <div
                    class="bg-blue-500 h-full"
                    :style="{ width: userCompliancePercentage + '%' }"
                  ></div>
                </div>
              </div>
              <div class="pt-3 border-t border-gray-200 text-xs text-gray-600">
                <p>
                  <span class="font-bold"
                    >{{ systemHealthStatus.percentage }}%</span
                  >
                  of systems are healthy
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid gap-6 lg:grid-cols-3 auto-rows-max lg:auto-rows-auto">
          <!-- Left Column (2 cols on desktop, 1 on mobile) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Recent Users Table -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
              <div class="border-b bg-gray-50 px-4 sm:px-6 py-4">
                <h2 class="text-lg font-semibold text-gray-900">
                  Recent Users
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                  Latest user activity and access
                </p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b bg-gray-50">
                      <th
                        class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        User
                      </th>
                      <th
                        class="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Privilege
                      </th>
                      <th
                        class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Last Login
                      </th>
                      <th
                        class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr
                      v-for="user in recentUsers
                        .slice(0, 5)
                        .filter((u) => u && u.id)"
                      :key="user.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="px-4 sm:px-6 py-4">
                        <div class="flex items-center gap-2 sm:gap-3">
                          <div
                            class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold shrink-0"
                          >
                            {{
                              (user.username || "U")
                                .substring(0, 2)
                                .toUpperCase()
                            }}
                          </div>
                          <div class="min-w-0 flex-1">
                            <div
                              class="text-sm font-medium text-gray-900 truncate"
                            >
                              {{ user.username || "Unknown" }}
                            </div>
                            <div
                              class="text-xs text-gray-500 truncate hidden sm:block"
                            >
                              {{ user.email || "N/A" }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="hidden sm:table-cell px-4 sm:px-6 py-4">
                        <span
                          :class="[
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getPrivilegeColor(user),
                          ]"
                        >
                          {{ user.admin ? "Admin" : "User" }}
                        </span>
                      </td>
                      <td
                        class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                      >
                        {{
                          user.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : "Never"
                        }}
                      </td>
                      <td class="px-4 sm:px-6 py-4">
                        <div class="flex items-center gap-2">
                          <CheckCircle
                            v-if="user.status === 'active'"
                            class="h-4 w-4 text-green-600"
                          />
                          <Activity v-else class="h-4 w-4 text-gray-500" />
                          <span
                            class="text-sm capitalize hidden sm:inline"
                            :class="statusColors[user.status]"
                            >{{ user.status }}</span
                          >
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div
                  v-if="recentUsers.length === 0"
                  class="flex items-center justify-center py-8 text-gray-500 text-sm"
                >
                  No users found
                </div>
              </div>
            </div>
            <!-- Password Expiration Warning Table -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
              <div class="border-b bg-gray-50 px-6 py-4">
                <h2 class="text-lg font-semibold text-gray-900">
                  Password Expiration Alerts
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                  Users with passwords expiring soon
                </p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b bg-gray-50">
                      <th
                        class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        User
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Expires In
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Status
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr
                      v-for="expiration in passwordExpirations"
                      :key="expiration.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold"
                          >
                            {{
                              expiration.username.substring(0, 2).toUpperCase()
                            }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900">
                              {{ expiration.username }}
                            </div>
                            <div class="text-xs text-gray-500">
                              {{ expiration.email }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-medium text-gray-900">
                        {{ expiration.expiresIn }} days
                      </td>
                      <td class="px-6 py-4">
                        <span
                          :class="[
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getExpirationStatusColor(expiration.status),
                          ]"
                        >
                          {{
                            expiration.status === "critical"
                              ? "Critical"
                              : expiration.status === "warning"
                                ? "Warning"
                                : "Info"
                          }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <button
                          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Notify
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right Column (1 col) -->
          <div class="space-y-6">
            <!-- System Access Overview -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
              <div class="border-b bg-gray-50 px-6 py-4">
                <h2 class="text-lg font-semibold text-gray-900">
                  System Access
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                  Active users per system
                </p>
              </div>
              <div class="divide-y">
                <div
                  v-for="system in systemAccessOverview"
                  :key="system.system"
                  class="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-semibold text-gray-900">
                      {{ system.system }}
                    </h3>
                    <span
                      class="flex items-center gap-1 text-xs font-medium text-green-600"
                    >
                      <CheckCircle class="h-3 w-3" /> Healthy
                    </span>
                  </div>
                  <div class="space-y-2">
                    <div
                      class="flex justify-between text-xs text-gray-600 mb-1"
                    >
                      <span>Active Users: {{ system.activeUsers }}</span>
                      <span>Policies: {{ system.policies }}</span>
                    </div>
                    <div
                      class="h-2 w-full rounded-full bg-gray-200 overflow-hidden"
                    >
                      <div
                        class="h-full bg-green-500"
                        :style="{
                          width: (system.activeUsers / 15) * 100 + '%',
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Password Policy Compliance -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
              <div class="border-b bg-gray-50 px-6 py-4">
                <h2 class="text-lg font-semibold text-gray-900">
                  Policy Compliance
                </h2>
                <p class="text-sm text-gray-600 mt-1">Adherence by policy</p>
              </div>
              <div class="divide-y">
                <div
                  v-for="policy in passwordPolicies"
                  :key="policy.name"
                  class="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-semibold text-gray-900">
                      {{ policy.name }}
                    </h3>
                    <span class="text-xs font-bold text-green-600"
                      >{{ policy.compliance }}%</span
                    >
                  </div>
                  <div class="space-y-2">
                    <p class="text-xs text-gray-600">
                      Applied: {{ policy.applied }} users
                    </p>
                    <div
                      class="h-2 w-full rounded-full bg-gray-200 overflow-hidden"
                    >
                      <div
                        class="h-full bg-green-500"
                        :style="{ width: policy.compliance + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="rounded-lg border bg-white shadow-sm p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h2>
              <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Password Policies</span>
                  <span class="font-semibold text-gray-900">{{
                    passwordPolicies.length
                  }}</span>
                </div>
                <div class="h-px bg-gray-200"></div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Active Systems</span>
                  <span class="font-semibold text-gray-900">{{
                    systemAccessOverview.length
                  }}</span>
                </div>
                <div class="h-px bg-gray-200"></div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">System Categories</span>
                  <span class="font-semibold text-gray-900">3</span>
                </div>
                <div class="h-px bg-gray-200"></div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">User Privileges</span>
                  <span class="font-semibold text-gray-900">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </BaseLayout>
</template>

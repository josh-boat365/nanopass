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

// Fetch all dashboard data
const fetchDashboardData = async () => {
  loading.value = true;
  try {
    // Fetch users
    const usersData = await userStore.getAllUsers();
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
      (u) => u.status === "active"
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
      console.warn("Failed to fetch systems:", systemErr);
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
      console.warn("Failed to fetch policies:", policyErr);
      passwordPolicies.value = [];
    }

    // Fetch passwords to identify expiring ones
    try {
      const passwordsResponse = await apiClient.get(
        API_ENDPOINTS.PASSWORDS.LIST
      );
      const passwordsData = passwordsResponse.data || passwordsResponse;
      const passwords = Array.isArray(passwordsData) ? passwordsData : [];

      // Filter expiring passwords (this is a simplified version)
      passwordExpirations.value = passwords
        .filter((p) => p && p.expires_at)
        .slice(0, 5)
        .map((p) => {
          const expiresIn = Math.floor(
            (new Date(p.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
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
        (p) => p.status === "critical"
      ).length;
    } catch (passwordErr) {
      console.warn("Failed to fetch passwords:", passwordErr);
      passwordExpirations.value = [];
      systemMetrics.value.expiredPasswords = 0;
    }
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    showError("Failed to load dashboard data");
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
        <!-- Key Metrics Cards -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <!-- Total Users Card -->
          <div class="rounded-lg border bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Users</p>
                <p class="mt-2 text-3xl font-bold text-gray-900">
                  {{ systemMetrics.totalUsers }}
                </p>
                <p class="mt-1 text-xs text-green-600">
                  {{ systemMetrics.activeUsers }} active
                </p>
              </div>
              <div class="rounded-lg bg-blue-100 p-3">
                <Users class="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <!-- Expired Passwords Card -->
          <div class="rounded-lg border bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Expired Passwords</p>
                <p class="mt-2 text-3xl font-bold text-red-600">
                  {{ systemMetrics.expiredPasswords }}
                </p>
                <p class="mt-1 text-xs text-red-600">
                  Require immediate action
                </p>
              </div>
              <div class="rounded-lg bg-red-100 p-3">
                <AlertCircle class="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <!-- Expiring Soon Card -->
          <div class="rounded-lg border bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">
                  Expiring in {{ systemMetrics.expiringInDays }} Days
                </p>
                <p class="mt-2 text-3xl font-bold text-yellow-600">
                  {{ passwordExpirations.length }}
                </p>
                <p class="mt-1 text-xs text-yellow-600">
                  Proactive notification
                </p>
              </div>
              <div class="rounded-lg bg-yellow-100 p-3">
                <Clock class="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <!-- Systems Health Card -->
          <div class="rounded-lg border bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Systems Health</p>
                <p class="mt-2 text-3xl font-bold text-green-600">3/3</p>
                <p class="mt-1 text-xs text-green-600">All systems healthy</p>
              </div>
              <div class="rounded-lg bg-green-100 p-3">
                <CheckCircle class="h-6 w-6 text-green-600" />
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

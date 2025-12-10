<script setup>
import { ref, computed } from "vue";
import BaseLayout from "@/layouts/AppLayout.vue";
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

// Sample data
const systemMetrics = ref({
  totalUsers: 24,
  activeUsers: 18,
  expiredPasswords: 3,
  expiringInDays: 7,
});

const recentUsers = ref([
  {
    id: 1,
    username: "john_doe",
    email: "john@nanopass.com",
    privilege: "Admin",
    lastLogin: "2 hours ago",
    status: "active",
  },
  {
    id: 2,
    username: "jane_smith",
    email: "jane@nanopass.com",
    privilege: "Editor",
    lastLogin: "30 minutes ago",
    status: "active",
  },
  {
    id: 3,
    username: "mike_johnson",
    email: "mike@nanopass.com",
    privilege: "Viewer",
    lastLogin: "1 day ago",
    status: "active",
  },
  {
    id: 4,
    username: "sarah_williams",
    email: "sarah@nanopass.com",
    privilege: "Editor",
    lastLogin: "3 days ago",
    status: "inactive",
  },
  {
    id: 5,
    username: "robert_brown",
    email: "robert@nanopass.com",
    privilege: "Admin",
    lastLogin: "Never",
    status: "inactive",
  },
]);

const passwordExpirations = ref([
  {
    id: 1,
    username: "alex_davis",
    email: "alex@nanopass.com",
    expiresIn: 2,
    status: "critical",
  },
  {
    id: 2,
    username: "emma_wilson",
    email: "emma@nanopass.com",
    expiresIn: 5,
    status: "warning",
  },
  {
    id: 3,
    username: "charles_miller",
    email: "charles@nanopass.com",
    expiresIn: 8,
    status: "warning",
  },
  {
    id: 4,
    username: "lucy_taylor",
    email: "lucy@nanopass.com",
    expiresIn: 15,
    status: "info",
  },
]);

const systemAccessOverview = ref([
  {
    system: "Main Production",
    activeUsers: 12,
    policies: 3,
    status: "healthy",
  },
  {
    system: "Staging Environment",
    activeUsers: 8,
    policies: 2,
    status: "healthy",
  },
  { system: "Development", activeUsers: 5, policies: 1, status: "healthy" },
]);

const passwordPolicies = ref([
  { name: "Basic Password", applied: 8, compliance: 100 },
  { name: "Strong Password", applied: 14, compliance: 92 },
  { name: "Enterprise", applied: 2, compliance: 100 },
]);

// Computed properties
const privilegeColors = {
  Admin: "bg-red-100 text-red-800",
  Editor: "bg-yellow-100 text-yellow-800",
  Viewer: "bg-green-100 text-green-800",
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

const getPrivilegeColor = (privilege) =>
  privilegeColors[privilege] || "bg-gray-100 text-gray-800";
const getExpirationStatusColor = (status) =>
  expirationStatusColors[status] || "bg-gray-100 text-gray-800";
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          Overview of your system, users, and security metrics
        </p>
      </div>
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
              <p class="mt-1 text-xs text-red-600">Require immediate action</p>
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
              <p class="mt-1 text-xs text-yellow-600">Proactive notification</p>
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
              <h2 class="text-lg font-semibold text-gray-900">Recent Users</h2>
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
                    v-for="user in recentUsers.slice(0, 5)"
                    :key="user.id"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-4 sm:px-6 py-4">
                      <div class="flex items-center gap-2 sm:gap-3">
                        <div
                          class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold shrink-0"
                        >
                          {{ user.username.substring(0, 2).toUpperCase() }}
                        </div>
                        <div class="min-w-0 flex-1">
                          <div
                            class="text-sm font-medium text-gray-900 truncate"
                          >
                            {{ user.username }}
                          </div>
                          <div
                            class="text-xs text-gray-500 truncate hidden sm:block"
                          >
                            {{ user.email }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="hidden sm:table-cell px-4 sm:px-6 py-4">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getPrivilegeColor(user.privilege),
                        ]"
                      >
                        {{ user.privilege }}
                      </span>
                    </td>
                    <td
                      class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                    >
                      {{ user.lastLogin }}
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
              <h2 class="text-lg font-semibold text-gray-900">System Access</h2>
              <p class="text-sm text-gray-600 mt-1">Active users per system</p>
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
                  <div class="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Active Users: {{ system.activeUsers }}</span>
                    <span>Policies: {{ system.policies }}</span>
                  </div>
                  <div
                    class="h-2 w-full rounded-full bg-gray-200 overflow-hidden"
                  >
                    <div
                      class="h-full bg-green-500"
                      :style="{ width: (system.activeUsers / 15) * 100 + '%' }"
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
    </div>
  </BaseLayout>
</template>

<script setup>
import BaseLayout from "@/layouts/AppLayout.vue";
import { ref, computed } from "vue";
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
} from "lucide-vue-next";
import { useRouter } from "vue-router";
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/useUserStore';

const router = useRouter();
const userStore = useUserStore();




// Get reactive user data
const { user, isAuthenticated, isAdmin } = storeToRefs(userStore)
console.log("User Store:", user);

// User data
const userData = ref({
  name: user.value?.username || "NanoPass User",
  email: user.value?.email || "testuser@nanopass.com",
});

// Check authentication on mount
// onMounted(() => {
//     if (!isAuthenticated.value) {
//         router.push('/login')
//     }
// });

// Personal keys data
const personalKeys = ref([
  {
    id: 1,
    systemName: "GitHub Account",
    description: "Personal GitHub repository access",
    password: "MyGitH@b2024!",
    duration: 180,
    daysLeft: 120,
    status: "healthy",
    createdAt: "2024-08-10",
  },
  {
    id: 2,
    systemName: "AWS Console",
    description: "AWS management console login",
    password: "AwsC0ns0le#Secure",
    duration: 90,
    daysLeft: 25,
    status: "warning",
    createdAt: "2024-09-15",
  },
  {
    id: 3,
    systemName: "Email Account",
    description: "Personal email access credentials",
    password: "Em@il123Pass",
    duration: 365,
    daysLeft: 200,
    status: "healthy",
    createdAt: "2024-06-01",
  },
  {
    id: 4,
    systemName: "LinkedIn Profile",
    description: "LinkedIn professional account",
    password: "Link3dIn!2024",
    duration: 180,
    daysLeft: 5,
    status: "critical",
    createdAt: "2024-06-20",
  },
]);

// Assigned keys data (keys assigned to the user by admin/organization)
const assignedKeys = ref([
  {
    id: 1,
    systemName: "Production Database",
    description: "Main production PostgreSQL database",
    assignedBy: "IT Admin",
    duration: 90,
    daysLeft: 15,
    status: "warning",
    assignedAt: "2024-09-18",
    expiresAt: "2024-12-31",
  },
  {
    id: 2,
    systemName: "Jenkins CI/CD",
    description: "Continuous integration server access",
    assignedBy: "DevOps Team",
    duration: 180,
    daysLeft: 2,
    status: "critical",
    assignedAt: "2024-06-20",
    expiresAt: "2024-12-18",
  },
  {
    id: 3,
    systemName: "Jira Admin Panel",
    description: "Project management admin access",
    assignedBy: "Project Manager",
    duration: 365,
    daysLeft: 150,
    status: "healthy",
    assignedAt: "2024-06-01",
    expiresAt: "2025-05-15",
  },
  {
    id: 4,
    systemName: "AWS IAM Role",
    description: "AWS infrastructure management",
    assignedBy: "Cloud Team",
    duration: 90,
    daysLeft: 45,
    status: "healthy",
    assignedAt: "2024-11-01",
    expiresAt: "2025-01-30",
  },
  {
    id: 5,
    systemName: "Slack Workspace Admin",
    description: "Company Slack administrative access",
    assignedBy: "HR Department",
    duration: 180,
    daysLeft: 8,
    status: "critical",
    assignedAt: "2024-06-20",
    expiresAt: "2024-12-24",
  },
]);

// Computed statistics
const stats = computed(() => {
  const totalKeys = personalKeys.value.length + assignedKeys.value.length;
  const criticalKeys = [
    ...personalKeys.value,
    ...assignedKeys.value,
  ].filter((k) => k.status === "critical").length;
  const warningKeys = [
    ...personalKeys.value,
    ...assignedKeys.value,
  ].filter((k) => k.status === "warning").length;
  const healthyKeys = [
    ...personalKeys.value,
    ...assignedKeys.value,
  ].filter((k) => k.status === "healthy").length;

  return {
    total: totalKeys,
    critical: criticalKeys,
    warning: warningKeys,
    healthy: healthyKeys,
  };
});

// Get keys expiring soon (next 30 days)
const keysExpiringSoon = computed(() => {
  const allKeys = [
    ...personalKeys.value.map((k) => ({ ...k, type: "personal" })),
    ...assignedKeys.value.map((k) => ({ ...k, type: "assigned" })),
  ];

  return allKeys
    .filter((k) => k.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
});

// Recent activity
const recentActivity = computed(() => {
  const allKeys = [
    ...personalKeys.value.map((k) => ({ ...k, type: "personal" })),
    ...assignedKeys.value.map((k) => ({ ...k, type: "assigned" })),
  ];

  return allKeys
    .sort((a, b) => new Date(b.createdAt || b.assignedAt) - new Date(a.createdAt || a.assignedAt))
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
      <!-- Welcome Header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome back, {{ userData.name }}
        </h1>
        <span></span>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          Here's an overview of your password management dashboard
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <!-- Total Keys -->
        <div class="bg-white rounded-lg border shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Keys</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ stats.total }}
              </p>
            </div>
            <div class="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Key class="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-4">
            {{ personalKeys.length }} personal, {{ assignedKeys.length }} assigned
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
            <div class="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle class="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-4">
            Expiring within 7 days
          </p>
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
            <div class="h-12 w-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock class="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-4">
            Expiring within 30 days
          </p>
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
            <div class="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
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
                      <h3 class="text-sm font-semibold text-gray-900 truncate">
                        {{ key.systemName }}
                      </h3>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {{ key.type === "personal" ? "Personal" : "Assigned" }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">
                      {{ key.description }}
                    </p>
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                      <span class="flex items-center gap-1">
                        <Calendar class="h-3 w-3" />
                        Duration: {{ key.duration }}d
                      </span>
                      <span v-if="key.assignedBy" class="flex items-center gap-1">
                        <Users class="h-3 w-3" />
                        By: {{ key.assignedBy }}
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <component
                      :is="getStatusIcon(key.status)"
                      :class="['h-5 w-5', getStatusColor(key.status).split(' ')[0]]"
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
                      <h3 class="text-sm font-semibold text-gray-900 truncate">
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
                        {{ key.type === "personal" ? "Personal" : "Assigned" }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500">
                      {{ key.type === "personal" ? "Created" : "Assigned" }}
                      {{ formatDate(key.createdAt || key.assignedAt) }}
                    </p>
                  </div>
                  <component
                    :is="getStatusIcon(key.status)"
                    :class="['h-5 w-5', getStatusColor(key.status).split(' ')[0]]"
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
                  <div class="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
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
                <ChevronRight class="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </button>

              <button
                @click="navigateToAssignedKeys"
                class="w-full flex items-center justify-between p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Users class="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-gray-900">
                      Assigned Keys
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ assignedKeys.length }} keys
                    </p>
                  </div>
                </div>
                <ChevronRight class="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
          </div>

          <!-- Security Summary -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm overflow-hidden">
            <div class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield class="h-5 w-5 text-white" />
                </div>
                <h2 class="text-lg font-semibold text-gray-900">
                  Security Score
                </h2>
              </div>

              <div class="mb-4">
                <div class="flex items-end gap-2 mb-2">
                  <span class="text-4xl font-bold text-blue-600">
                    {{ Math.round((stats.healthy / stats.total) * 100) }}%
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
              <h2 class="text-lg font-semibold text-gray-900">
                This Month
              </h2>
              <p class="text-sm text-gray-600 mt-1">
                December 2025
              </p>
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
  </BaseLayout>
</template>
<script setup>
import BaseLayout from "@/layouts/AppLayout.vue";
import { ref, computed } from "vue";
import {
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  Shield,
  Users,
  Calendar,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  X,
  Lock,
} from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();

// User data
const userData = ref({
  name: "John Doe",
  email: "john.doe@company.com",
  role: "Senior Developer",
});

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
    type: "personal",
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
    type: "personal",
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
    type: "personal",
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
    type: "personal",
  },
]);

// Assigned keys data
const assignedKeys = ref([
  {
    id: 1,
    systemName: "Production Database",
    description: "Main production PostgreSQL database",
    password: "DbPr0d#2024!",
    assignedBy: "IT Admin",
    duration: 90,
    daysLeft: 15,
    status: "warning",
    assignedAt: "2024-09-18",
    type: "assigned",
  },
  {
    id: 2,
    systemName: "Jenkins CI/CD",
    description: "Continuous integration server access",
    password: "J3nk1ns!Secure",
    assignedBy: "DevOps Team",
    duration: 180,
    daysLeft: 2,
    status: "critical",
    assignedAt: "2024-06-20",
    type: "assigned",
  },
  {
    id: 3,
    systemName: "Jira Admin Panel",
    description: "Project management admin access",
    password: "J1r@Admin#24",
    assignedBy: "Project Manager",
    duration: 365,
    daysLeft: 150,
    status: "healthy",
    assignedAt: "2024-06-01",
    type: "assigned",
  },
  {
    id: 4,
    systemName: "AWS IAM Role",
    description: "AWS infrastructure management",
    password: "AwsI@M!2024",
    assignedBy: "Cloud Team",
    duration: 90,
    daysLeft: 45,
    status: "healthy",
    assignedAt: "2024-11-01",
    type: "assigned",
  },
  {
    id: 5,
    systemName: "Slack Workspace Admin",
    description: "Company Slack administrative access",
    password: "Sl@ckAdm1n!",
    assignedBy: "HR Department",
    duration: 180,
    daysLeft: 8,
    status: "critical",
    assignedAt: "2024-06-20",
    type: "assigned",
  },
]);

const showPasswordModal = ref(false);
const selectedPassword = ref(null);
const accountPassword = ref("");
const passwordError = ref("");
const revealedPassword = ref(null);
const showPassword = ref(false);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 15;
const activeTab = ref("all"); // 'all', 'personal', 'assigned'

const statusColors = {
  critical: "text-red-600",
  warning: "text-yellow-600",
  healthy: "text-green-600",
};

const statusBgColors = {
  critical: "bg-red-50",
  warning: "bg-yellow-50",
  healthy: "bg-green-50",
};

// Computed: Combined and filtered keys
const allKeys = computed(() => {
  // Filter out expired assigned keys
  const activeAssignedKeys = assignedKeys.value.filter((k) => k.daysLeft > 0);

  let keys = [];

  if (activeTab.value === "all") {
    keys = [...personalKeys.value, ...activeAssignedKeys];
  } else if (activeTab.value === "personal") {
    keys = [...personalKeys.value];
  } else if (activeTab.value === "assigned") {
    keys = [...activeAssignedKeys];
  }

  if (!searchQuery.value) {
    return keys;
  }

  const query = searchQuery.value.toLowerCase();
  return keys.filter(
    (key) =>
      key.systemName.toLowerCase().includes(query) ||
      (key.description && key.description.toLowerCase().includes(query)),
  );
});

// Computed statistics
const stats = computed(() => {
  // Filter out expired assigned keys (daysLeft <= 0)
  const activeAssignedKeys = assignedKeys.value.filter((k) => k.daysLeft > 0);

  const total = personalKeys.value.length + activeAssignedKeys.length;
  const allCombined = [...personalKeys.value, ...activeAssignedKeys];

  const critical = allCombined.filter((k) => k.status === "critical").length;
  const warning = allCombined.filter((k) => k.status === "warning").length;
  const healthy = allCombined.filter((k) => k.status === "healthy").length;

  return {
    total,
    personal: personalKeys.value.length,
    assigned: activeAssignedKeys.length,
    critical,
    warning,
    healthy,
  };
});

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(allKeys.value.length / itemsPerPage);
});

// Computed: Paginated keys
const paginatedKeys = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return allKeys.value.slice(start, end);
});

// Computed: Pagination info
const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage.value * itemsPerPage, allKeys.value.length);
  return `${start}-${end} of ${allKeys.value.length}`;
});

const maskPassword = (password) => {
  return "•".repeat(12);
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleTabChange = (tab) => {
  activeTab.value = tab;
  currentPage.value = 1;
};

const handleViewPassword = (password) => {
  selectedPassword.value = password;
  showPasswordModal.value = true;
  accountPassword.value = "";
  passwordError.value = "";
  revealedPassword.value = null;
  showPassword.value = false;
};

const handleVerifyPassword = () => {
  if (accountPassword.value === "demo123") {
    passwordError.value = "";
    revealedPassword.value = selectedPassword.value;
  } else {
    passwordError.value = "Incorrect account password. Please try again.";
  }
};

const handleCloseModal = () => {
  showPasswordModal.value = false;
  selectedPassword.value = null;
  accountPassword.value = "";
  passwordError.value = "";
  revealedPassword.value = null;
  showPassword.value = false;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const getTypeColor = (type) => {
  return type === "personal"
    ? "bg-blue-100 text-blue-700 border-blue-200"
    : "bg-purple-100 text-purple-700 border-purple-200";
};

const getTypeLabel = (type) => {
  return type === "personal" ? "Personal" : "Assigned";
};
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          Overview of your password management
        </p>
      </div>

      <!-- Stats Cards -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6"
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
              class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <Key class="h-6 w-6 text-gray-700" />
            </div>
          </div>
          <div class="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-full bg-blue-500"></div>
              {{ stats.personal }} Personal
            </span>
            <span class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-full bg-purple-500"></div>
              {{ stats.assigned }} Assigned
            </span>
          </div>
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
          <p class="text-xs text-gray-500 mt-4">More than 30 days remaining</p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="space-y-6">
        <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
          <!-- Header with Tabs and Search -->
          <div class="border-b bg-gray-50 px-4 sm:px-6 py-4">
            <div class="flex flex-col gap-4">
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">All Keys</h2>
                  <p class="text-sm text-gray-600 mt-1">
                    Total: {{ allKeys.length }} keys
                  </p>
                </div>

                <!-- Search Bar -->
                <div class="relative w-full sm:w-64">
                  <Search
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                  />
                  <input
                    v-model="searchQuery"
                    @input="handleSearch"
                    type="text"
                    placeholder="Search keys..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Filter Tabs -->
              <div class="flex gap-2 border-b -mb-4">
                <button
                  @click="handleTabChange('all')"
                  :class="[
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'all'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  ]"
                >
                  All Keys ({{ stats.total }})
                </button>
                <button
                  @click="handleTabChange('personal')"
                  :class="[
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'personal'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  ]"
                >
                  Personal ({{ stats.personal }})
                </button>
                <button
                  @click="handleTabChange('assigned')"
                  :class="[
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'assigned'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  ]"
                >
                  Assigned ({{ stats.assigned }})
                </button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-gray-50">
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Type
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    System Name
                  </th>
                  <th
                    class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Description
                  </th>
                  <th
                    class="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Password
                  </th>
                  <th
                    class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Duration
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Time Left
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="key in paginatedKeys"
                  :key="`${key.type}-${key.id}`"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 rounded text-xs font-medium border',
                        getTypeColor(key.type),
                      ]"
                    >
                      {{ getTypeLabel(key.type) }}
                    </span>
                  </td>
                  <td
                    class="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900"
                  >
                    {{ key.systemName }}
                  </td>
                  <td
                    class="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                  >
                    {{ key.description }}
                  </td>
                  <td class="hidden sm:table-cell px-4 sm:px-6 py-4">
                    <span class="text-sm font-mono text-gray-600">{{
                      maskPassword(key.password)
                    }}</span>
                  </td>
                  <td
                    class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                  >
                    {{ key.duration }}d
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <div class="flex items-center gap-2">
                      <AlertCircle
                        v-if="key.status === 'critical'"
                        class="h-4 w-4"
                        :class="statusColors[key.status]"
                      />
                      <Clock
                        v-else-if="key.status === 'warning'"
                        class="h-4 w-4"
                        :class="statusColors[key.status]"
                      />
                      <CheckCircle
                        v-else
                        class="h-4 w-4"
                        :class="statusColors[key.status]"
                      />
                      <span
                        :class="[
                          'text-sm font-medium',
                          statusColors[key.status],
                        ]"
                      >
                        {{ key.daysLeft }}d
                      </span>
                    </div>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <button
                      @click="handleViewPassword(key)"
                      class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <Eye class="h-4 w-4" />
                      <span class="hidden sm:inline">View</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="paginatedKeys.length === 0">
                  <td
                    colspan="7"
                    class="px-4 sm:px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No keys found matching your search.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="border-t px-4 sm:px-6 py-4 bg-gray-50"
          >
            <div
              class="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div class="text-sm text-gray-600">
                Showing {{ paginationInfo }}
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  :class="[
                    'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    currentPage === 1
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50',
                  ]"
                >
                  <ChevronLeft class="h-4 w-4" />
                  <span class="hidden sm:inline ml-1">Previous</span>
                </button>

                <div class="flex items-center gap-1">
                  <template v-for="page in totalPages" :key="page">
                    <button
                      v-if="
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      "
                      @click="goToPage(page)"
                      :class="[
                        'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        page === currentPage
                          ? 'bg-black text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50',
                      ]"
                    >
                      {{ page }}
                    </button>
                    <span
                      v-else-if="
                        page === currentPage - 2 || page === currentPage + 2
                      "
                      class="px-2 text-gray-500"
                    >
                      ...
                    </span>
                  </template>
                </div>

                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  :class="[
                    'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    currentPage === totalPages
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50',
                  ]"
                >
                  <span class="hidden sm:inline mr-1">Next</span>
                  <ChevronRight class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Password Modal -->
    <div
      v-if="showPasswordModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="handleCloseModal"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Verify Account Password
          </h2>
          <button
            @click="handleCloseModal"
            class="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="px-6 py-4">
          <template v-if="!revealedPassword">
            <div class="mb-4">
              <p class="text-sm text-gray-600 mb-4">
                Please enter your account password to view the details for:
              </p>
              <div class="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ selectedPassword?.systemName }}
                  </p>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                      getTypeColor(selectedPassword?.type),
                    ]"
                  >
                    {{ getTypeLabel(selectedPassword?.type) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Account Password
              </label>
              <input
                type="password"
                v-model="accountPassword"
                @keypress.enter="handleVerifyPassword"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter your account password"
              />
              <p v-if="passwordError" class="mt-2 text-sm text-red-600">
                {{ passwordError }}
              </p>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p class="text-xs text-blue-800">
                Demo password:
                <span class="font-mono font-semibold">demo123</span>
              </p>
            </div>

            <div class="border-t pt-4 flex gap-3">
              <button
                @click="handleCloseModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleVerifyPassword"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
              >
                Verify
              </button>
            </div>
          </template>

          <template v-else>
            <div class="space-y-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >System Name</label
                >
                <div class="flex items-center gap-2">
                  <p class="text-sm text-gray-900 font-medium">
                    {{ revealedPassword.systemName }}
                  </p>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                      getTypeColor(revealedPassword.type),
                    ]"
                  >
                    {{ getTypeLabel(revealedPassword.type) }}
                  </span>
                </div>
              </div>

              <div v-if="revealedPassword.description">
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Description</label
                >
                <p class="text-sm text-gray-600">
                  {{ revealedPassword.description }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Password</label
                >
                <div
                  class="flex items-center gap-2 bg-gray-50 p-3 rounded-md border border-gray-200"
                >
                  <Lock class="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <code
                    class="text-sm font-mono text-gray-900 flex-1 break-all"
                    >{{
                      showPassword
                        ? revealedPassword.password
                        : maskPassword(revealedPassword.password)
                    }}</code
                  >
                  <button
                    @click="togglePasswordVisibility"
                    class="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                    type="button"
                  >
                    <EyeOff v-if="showPassword" class="h-4 w-4" />
                    <Eye v-else class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Duration</label
                  >
                  <p class="text-sm text-gray-900">
                    {{ revealedPassword.duration }} days
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Time Left</label
                  >
                  <p
                    :class="[
                      'text-sm font-medium',
                      statusColors[revealedPassword.status],
                    ]"
                  >
                    {{ revealedPassword.daysLeft }} days
                  </p>
                </div>
              </div>

              <div
                v-if="revealedPassword.type === 'assigned'"
                class="grid grid-cols-2 gap-4"
              >
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Assigned By</label
                  >
                  <p class="text-sm text-gray-900">
                    {{ revealedPassword.assignedBy }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Assigned Date</label
                  >
                  <p class="text-sm text-gray-900">
                    {{ revealedPassword.assignedAt }}
                  </p>
                </div>
              </div>

              <div v-else>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Created Date</label
                >
                <p class="text-sm text-gray-900">
                  {{ revealedPassword.createdAt }}
                </p>
              </div>

              <div
                :class="[
                  'p-3 rounded-md border',
                  statusBgColors[revealedPassword.status],
                ]"
              >
                <div class="flex items-start gap-2">
                  <AlertTriangle
                    v-if="revealedPassword.status === 'critical'"
                    class="h-5 w-5 flex-shrink-0"
                    :class="statusColors[revealedPassword.status]"
                  />
                  <Clock
                    v-else-if="revealedPassword.status === 'warning'"
                    class="h-5 w-5 flex-shrink-0"
                    :class="statusColors[revealedPassword.status]"
                  />
                  <CheckCircle
                    v-else
                    class="h-5 w-5 flex-shrink-0"
                    :class="statusColors[revealedPassword.status]"
                  />
                  <div>
                    <p
                      :class="[
                        'text-sm font-medium',
                        statusColors[revealedPassword.status],
                      ]"
                    >
                      {{
                        revealedPassword.status === "critical"
                          ? "Critical: Password expires soon!"
                          : revealedPassword.status === "warning"
                            ? "Warning: Password expiring within 30 days"
                            : "Healthy: Password is current"
                      }}
                    </p>
                    <p class="text-xs text-gray-600 mt-1">
                      {{
                        revealedPassword.status === "critical"
                          ? "Please update your password immediately to maintain access."
                          : revealedPassword.status === "warning"
                            ? "Consider updating your password soon."
                            : "Your password is in good standing."
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="border-t pt-4">
              <button
                @click="handleCloseModal"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

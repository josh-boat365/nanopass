<script setup>
import BaseLayout from "@/layouts/AppLayout.vue";
import { ref, computed, onMounted } from "vue";
import {
  Eye,
  EyeOff,
  Lock,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-vue-next";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";

const { success, error: showError } = useToast();

const showPasswordModal = ref(false);
const selectedPassword = ref(null);
const accountPassword = ref("");
const passwordError = ref("");
const revealedPassword = ref(null);
const showPassword = ref(false);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 15;
const loading = ref(false);
const verifyingPassword = ref(false);

// Assigned keys data from API
const assignedKeys = ref([]);
const permissions = ref([]);
const systems = ref([]);

const statusColors = {
  critical: "text-red-600",
  warning: "text-yellow-600",
  healthy: "text-green-600",
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getSystemName = (systemId) => {
  const system = systems.value.find((s) => s.id === systemId);
  return system ? system.system_name : "Unknown System";
};

const calculateDaysLeft = (expiryDate) => {
  if (!expiryDate) return 0;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const getStatus = (daysLeft) => {
  if (daysLeft <= 7) return "critical";
  if (daysLeft <= 30) return "warning";
  return "healthy";
};

const maskPassword = (password) => {
  return "•".repeat(12);
};

// ========================================
// API FUNCTIONS
// ========================================

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.allSettled([loadPermissions(), loadSystems()]);
  } catch (err) {
    console.error("Error loading data:", err);
    showError("Failed to load assigned keys");
  } finally {
    loading.value = false;
  }
};

const loadPermissions = async () => {
  try {
    console.log("📥 Loading permissions...");
    const endpoint = API_ENDPOINTS.PERMISSIONS?.LIST || "/permissions";
    const response = await apiClient.get(endpoint);
    permissions.value = response.data.data || response.data || [];
    console.log("✅ Permissions loaded:", permissions.value.length);
  } catch (err) {
    console.error("❌ Error loading permissions:", err);
    permissions.value = [];
  }
};

const loadSystems = async () => {
  try {
    console.log("📥 Loading systems...");
    const response = await apiClient.get(API_ENDPOINTS.SYSTEMS.LIST);
    systems.value = response.data.data || response.data || [];
    console.log("✅ Systems loaded:", systems.value.length);
  } catch (err) {
    console.error("❌ Error loading systems:", err);
    systems.value = [];
  }
};

// ========================================
// COMPUTED PROPERTIES
// ========================================

// Format assigned keys from permissions
const formattedKeys = computed(() => {
  return permissions.value.map((perm) => {
    const daysLeft = calculateDaysLeft(perm.date_time_expiry);
    return {
      id: perm.id,
      system_id: perm.system_id,
      systemName: getSystemName(perm.system_id),
      date_time_expiry: perm.date_time_expiry,
      daysLeft,
      status: getStatus(daysLeft),
    };
  });
});

// const statusColors = {
//   critical: "text-red-600",
//   warning: "text-yellow-600",
//   healthy: "text-green-600",
// };

// Computed: Filtered keys based on search
const filteredKeys = computed(() => {
  if (!searchQuery.value) {
    return formattedKeys.value;
  }
  const query = searchQuery.value.toLowerCase();
  return formattedKeys.value.filter((key) =>
    key.systemName.toLowerCase().includes(query)
  );
});

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredKeys.value.length / itemsPerPage);
});

// Computed: Paginated keys
const paginatedKeys = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredKeys.value.slice(start, end);
});

// Computed: Pagination info
const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage,
    filteredKeys.value.length
  );
  return `${start}-${end} of ${filteredKeys.value.length}`;
});

// Watch search query to reset to page 1
const handleSearch = () => {
  currentPage.value = 1;
};

const handleViewPassword = (password) => {
  selectedPassword.value = password;
  showPasswordModal.value = true;
  accountPassword.value = "";
  passwordError.value = "";
  revealedPassword.value = null;
};

const handleVerifyPassword = async () => {
  if (!accountPassword.value.trim()) {
    passwordError.value = "Please enter your password";
    return;
  }

  verifyingPassword.value = true;
  passwordError.value = "";

  try {
    // Call API to verify password
    const endpoint = API_ENDPOINTS.AUTH?.VERIFY_PASSWORD || "/verify-password";
    const response = await apiClient.post(endpoint, {
      password: accountPassword.value,
    });

    // Check if password verification was successful
    if (
      response.data?.success === true &&
      response.data?.data?.password_match === true
    ) {
      // Password verified successfully
      console.log(
        "✅ Password verified for user:",
        response.data.data.username
      );

      // Get the actual system password
      try {
        const systemId = selectedPassword.value.system_id;
        const passwordEndpoint = API_ENDPOINTS.SYSTEMS.GET_PASSWORD(systemId);
        const passwordResponse = await apiClient.get(passwordEndpoint);

        // Merge the system password with selectedPassword
        revealedPassword.value = {
          ...selectedPassword.value,
          password:
            passwordResponse.data?.data?.password ||
            "Unable to retrieve password",
        };

        success("Password verified successfully!");
        accountPassword.value = "";
      } catch (pwdErr) {
        console.error("Error fetching system password:", pwdErr);
        passwordError.value =
          "Verified but unable to retrieve system password.";
      }
    } else {
      // Password verification failed
      passwordError.value =
        response.data?.message || "Invalid password. Please try again.";
    }
  } catch (err) {
    console.error("Password verification failed:", err);
    passwordError.value =
      err.response?.data?.message || "Invalid password. Please try again.";
  } finally {
    verifyingPassword.value = false;
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
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          Assigned Keys
        </h1>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          View and manage system passwords assigned to you
        </p>
      </div>

      <!-- Main Content -->
      <div class="space-y-6">
        <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
          <!-- Header with Search -->
          <div class="border-b bg-gray-50 px-4 sm:px-6 py-4">
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  System Access
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                  Total: {{ filteredKeys.length }} systems
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
                  placeholder="Search by system name..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-600">Loading assigned systems...</span>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-gray-50">
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    System Name
                  </th>
                  <th
                    class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Expiry Date
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
                  v-for="pwd in paginatedKeys"
                  :key="pwd.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td
                    class="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900"
                  >
                    {{ pwd.systemName }}
                  </td>
                  <td
                    class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                  >
                    {{
                      new Date(pwd.date_time_expiry).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )
                    }}
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <div class="flex items-center gap-2">
                      <AlertCircle
                        v-if="pwd.status === 'critical'"
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <Clock
                        v-else-if="pwd.status === 'warning'"
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <CheckCircle
                        v-else
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <span
                        :class="[
                          'text-sm font-medium',
                          statusColors[pwd.status],
                        ]"
                      >
                        {{ pwd.daysLeft }}d
                      </span>
                    </div>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <button
                      @click="handleViewPassword(pwd)"
                      class="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <Eye class="h-4 w-4" />
                      <span class="hidden sm:inline">View</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="paginatedKeys.length === 0">
                  <td
                    colspan="4"
                    class="px-4 sm:px-6 py-8 text-center text-sm text-gray-500"
                  >
                    {{ loading ? "Loading..." : "No assigned systems found." }}
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Verify Account Password
          </h2>
          <button
            @click="handleCloseModal"
            class="text-gray-500 hover:text-gray-700"
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
                <p class="text-sm font-medium text-gray-900">
                  {{ selectedPassword?.systemName }}
                </p>
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
                :disabled="verifyingPassword"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your account password"
              />
              <p v-if="passwordError" class="mt-2 text-sm text-red-600">
                {{ passwordError }}
              </p>
            </div>

            <div class="border-t pt-4 flex gap-3">
              <button
                @click="handleCloseModal"
                :disabled="verifyingPassword"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                @click="handleVerifyPassword"
                :disabled="verifyingPassword"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <Loader2
                  v-if="verifyingPassword"
                  class="h-4 w-4 animate-spin"
                />
                {{ verifyingPassword ? "Verifying..." : "Verify" }}
              </button>
            </div>
          </template>

          <template v-else>
            <div class="space-y-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >System Name</label
                >
                <p class="text-sm text-gray-900 font-medium">
                  {{ revealedPassword.systemName }}
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
                  <code class="text-sm font-mono text-gray-900 flex-1">{{
                    showPassword
                      ? revealedPassword.password
                      : maskPassword(revealedPassword.password)
                  }}</code>
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
            </div>

            <div class="border-t pt-4">
              <button
                @click="handleCloseModal"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
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

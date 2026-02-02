<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import BaseLayout from "@/layouts/AppLayout.vue";
import {
  Search,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  History,
  CheckCircle,
  XCircle,
} from "lucide-vue-next";
import { usePermissionExpiry } from "@/composables/usePermissionExpiry";
import { useToast } from "@/composables/useToast";

const { fetchRevocationHistory } = usePermissionExpiry();
const { success, error: showError } = useToast();

// State management
const revocationHistory = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const itemsPerPage = 20;

// Filters
const searchQuery = ref("");
const filterReason = ref("all");
const filterStartDate = ref("");
const filterEndDate = ref("");
const pagination = reactive({
  total: 0,
  page: 1,
  per_page: 20,
  last_page: 1,
});

// Filtered data with all filters applied
const filteredHistory = computed(() => {
  let results = revocationHistory.value;

  // Filter by search query (user email, system name)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    results = results.filter(
      (record) =>
        (record.user?.email || "").toLowerCase().includes(query) ||
        (record.system?.system_name || "").toLowerCase().includes(query),
    );
  }

  // Filter by reason
  if (filterReason.value !== "all") {
    results = results.filter(
      (record) => record.revocation_reason === filterReason.value,
    );
  }

  // Filter by date range
  if (filterStartDate.value) {
    const startDate = new Date(filterStartDate.value);
    results = results.filter(
      (record) => new Date(record.revoked_at) >= startDate,
    );
  }

  if (filterEndDate.value) {
    const endDate = new Date(filterEndDate.value);
    endDate.setHours(23, 59, 59, 999);
    results = results.filter(
      (record) => new Date(record.revoked_at) <= endDate,
    );
  }

  return results;
});

// Paginated results
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredHistory.value.slice(start, end);
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredHistory.value.length / itemsPerPage);
});

// Statistics
const totalRevocations = computed(() => {
  return revocationHistory.value.length;
});

const revocationsByReason = computed(() => {
  const reasons = {
    automatic_expiry: 0,
    manual: 0,
    admin_action: 0,
  };

  revocationHistory.value.forEach((record) => {
    if (record.revocation_reason in reasons) {
      reasons[record.revocation_reason]++;
    }
  });

  return reasons;
});

const last24HoursCount = computed(() => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return revocationHistory.value.filter(
    (record) => new Date(record.revoked_at) >= yesterday,
  ).length;
});

const last7DaysCount = computed(() => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return revocationHistory.value.filter(
    (record) => new Date(record.revoked_at) >= weekAgo,
  ).length;
});

const totalUsersAffected = computed(() => {
  const users = new Set(revocationHistory.value.map((r) => r.user?.email));
  return users.size;
});

// Color mappings for reasons
const reasonColors = {
  automatic_expiry: "bg-blue-100 text-blue-800 border-l-4 border-blue-400",
  manual: "bg-purple-100 text-purple-800 border-l-4 border-purple-400",
  admin_action: "bg-red-100 text-red-800 border-l-4 border-red-400",
};

const reasonBadgeColors = {
  automatic_expiry: "bg-blue-100 text-blue-800",
  manual: "bg-purple-100 text-purple-800",
  admin_action: "bg-red-100 text-red-800",
};

const getReasonColor = (reason) => {
  return reasonColors[reason] || "bg-gray-100 text-gray-800";
};

const getReasonBadgeColor = (reason) => {
  return reasonBadgeColors[reason] || "bg-gray-100 text-gray-800";
};

const formatReason = (reason) => {
  const reasons = {
    automatic_expiry: "Automatic Expiry",
    manual: "Manual Revocation",
    admin_action: "Admin Action",
  };
  return reasons[reason] || reason;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
};

// API calls
const loadRevocationHistory = async () => {
  loading.value = true;
  try {
    const response = await fetchRevocationHistory({
      per_page: 1000, // Load all for client-side filtering
    });

    revocationHistory.value = response.data || [];
    if (response.pagination) {
      pagination.total = response.pagination.total || 0;
      pagination.page = 1;
      pagination.last_page = response.pagination.last_page || 1;
    }

    if (revocationHistory.value.length === 0) {
      console.log("ℹ️ No revocation history found");
    }
  } catch (err) {
    console.error("Error loading revocation history:", err);
    // Set empty data on error instead of showing error toast
    revocationHistory.value = [];
    // Don't show error to user - handle gracefully
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = "";
  filterReason.value = "all";
  filterStartDate.value = "";
  filterEndDate.value = "";
  currentPage.value = 1;
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const exportToCSV = () => {
  const headers = [
    "User Email",
    "System",
    "Permission Start",
    "Permission Expiry",
    "Revoked At",
    "Reason",
    "Revoked By",
  ];
  const rows = filteredHistory.value.map((record) => [
    record.user?.email || "—",
    record.system?.system_name || "—",
    formatDate(record.date_time_start),
    formatDate(record.date_time_expiry),
    formatDate(record.revoked_at),
    formatReason(record.revocation_reason),
    record.revokedBy?.email || "System",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `revocation-history-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);

  success("✅ Exported to CSV");
};

// Load on mount
onMounted(() => {
  // Wrap in try-catch to prevent setup errors
  loadRevocationHistory().catch((err) => {
    console.error("Failed to load revocation history on mount:", err);
  });
});
</script>

<template>
  <BaseLayout>
    <div class="min-h-screen bg-gray-50">
      <div class="p-2 sm:p-4 md:p-6">
        <!-- Page Header -->
        <div class="mb-6 sm:mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Revocation History</h1>
          <p class="mt-2 text-gray-600">
            Track all permission revocations and access removals across the
            platform
          </p>
        </div>

        <!-- Summary Cards -->
        <div class="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          <!-- Primary Stats Row -->
          <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <!-- Total Revocations Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">
                    Total Revocations
                  </p>
                  <p class="mt-2 text-3xl font-bold text-gray-900">
                    {{ totalRevocations }}
                  </p>
                  <p class="mt-2 text-xs text-gray-500">
                    {{ last24HoursCount }} in last 24 hours
                  </p>
                </div>
                <div class="text-4xl opacity-10">🔐</div>
              </div>
            </div>

            <!-- Auto Expiry Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Auto Expiry</p>
                  <p class="mt-2 text-3xl font-bold text-blue-600">
                    {{ revocationsByReason.automatic_expiry }}
                  </p>
                  <p class="mt-2 text-xs text-gray-500">
                    Automatic revocations
                  </p>
                </div>
                <div class="text-4xl opacity-10">⏰</div>
              </div>
            </div>

            <!-- Manual Revocation Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">
                    Manual Revoked
                  </p>
                  <p class="mt-2 text-3xl font-bold text-purple-600">
                    {{ revocationsByReason.manual }}
                  </p>
                  <p class="mt-2 text-xs text-gray-500">
                    Admin-initiated revocations
                  </p>
                </div>
                <div class="text-4xl opacity-10">👤</div>
              </div>
            </div>

            <!-- Admin Action Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              :class="revocationsByReason.admin_action > 0 ? 'bg-red-50' : ''"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p
                    class="text-sm font-medium"
                    :class="
                      revocationsByReason.admin_action > 0
                        ? 'text-red-700'
                        : 'text-gray-600'
                    "
                  >
                    Admin Actions
                  </p>
                  <p
                    class="mt-2 text-3xl font-bold"
                    :class="
                      revocationsByReason.admin_action > 0
                        ? 'text-red-600'
                        : 'text-gray-900'
                    "
                  >
                    {{ revocationsByReason.admin_action }}
                  </p>
                  <p
                    class="mt-2 text-xs"
                    :class="
                      revocationsByReason.admin_action > 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                    "
                  >
                    Force revocations
                  </p>
                </div>
                <div class="text-4xl opacity-10">⚠️</div>
              </div>
            </div>
          </div>

          <!-- Secondary Stats Row -->
          <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <!-- Users Affected Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">
                    Users Affected
                  </p>
                  <p class="mt-2 text-3xl font-bold text-indigo-600">
                    {{ totalUsersAffected }}
                  </p>
                </div>
                <div class="text-4xl opacity-10">👥</div>
              </div>
            </div>

            <!-- Last 7 Days Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Last 7 Days</p>
                  <p class="mt-2 text-3xl font-bold text-green-600">
                    {{ last7DaysCount }}
                  </p>
                </div>
                <div class="text-4xl opacity-10">📅</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters Section -->
        <div class="mb-6 bg-white rounded-lg border shadow-sm p-6">
          <div class="flex items-center gap-2 mb-4">
            <Search class="h-5 w-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">Filters</h2>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Search User or System
              </label>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Email or system name"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <!-- Reason Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Revocation Reason
              </label>
              <select
                v-model="filterReason"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Reasons</option>
                <option value="automatic_expiry">Automatic Expiry</option>
                <option value="manual">Manual Revocation</option>
                <option value="admin_action">Admin Action</option>
              </select>
            </div>

            <!-- Start Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                v-model="filterStartDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <!-- End Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                v-model="filterEndDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <!-- Clear Filters -->
            <div class="flex items-end">
              <button
                @click="clearFilters"
                class="w-full px-3 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-sm hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                🔄 Clear
              </button>
            </div>
          </div>

          <!-- Filter Stats -->
          <div class="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span class="font-medium text-gray-900">{{
                filteredHistory.length
              }}</span>
              records found
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-lg border shadow-sm p-12">
          <div class="flex flex-col items-center justify-center gap-4">
            <Loader2 class="h-8 w-8 text-blue-600 animate-spin" />
            <p class="text-gray-600">Loading revocation history...</p>
          </div>
        </div>

        <!-- Results Table -->
        <div v-else-if="filteredHistory.length > 0" class="space-y-6">
          <!-- Table -->
          <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b bg-gray-50">
                    <th
                      class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      User Email
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      System
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      Permission Period
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      Revoked At
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      Reason
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      Revoked By
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    v-for="record in paginatedHistory"
                    :key="record.id"
                    class="hover:bg-gray-50 transition-colors"
                    :class="getReasonColor(record.revocation_reason)"
                  >
                    <td class="px-6 py-4 text-sm text-gray-900">
                      <div class="font-medium">{{ record.user?.email }}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      {{ record.system?.system_name || "—" }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      <div class="text-xs">
                        {{ formatDate(record.date_time_start) }}
                      </div>
                      <div class="text-xs">
                        → {{ formatDate(record.date_time_expiry) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      {{ formatDate(record.revoked_at) }}
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getReasonBadgeColor(record.revocation_reason),
                        ]"
                      >
                        {{ formatReason(record.revocation_reason) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {{ record.revokedBy?.email || "System" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="flex items-center justify-between bg-white rounded-lg border shadow-sm p-6"
          >
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft class="h-4 w-4" />
              Previous
            </button>

            <div class="text-sm text-gray-600">
              Page
              <span class="font-semibold text-gray-900">{{ currentPage }}</span>
              of
              <span class="font-semibold text-gray-900">{{ totalPages }}</span>
            </div>

            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>

          <!-- Export -->
          <div class="flex justify-end">
            <button
              @click="exportToCSV"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download class="h-4 w-4" />
              Export to CSV
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="bg-white rounded-lg border shadow-sm p-12">
          <div class="text-center">
            <History class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              No revocations found
            </h3>
            <p class="text-gray-600 mb-6">
              No permission revocations match your filters
            </p>
            <button
              @click="clearFilters"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import BaseLayout from "@/layouts/AppLayout.vue";
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  Shield,
  Eye,
  Smartphone,
  Loader2,
  ChevronDown,
} from "lucide-vue-next";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";
import { useUserStore } from "@/stores/useUserStore";
import * as XLSX from "xlsx";

const { success, error: showError } = useToast();
const userStore = useUserStore();

// State management
const searchQuery = ref("");
const filterAction = ref("all");
const filterStartDate = ref("");
const filterEndDate = ref("");
const loading = ref(false);

// Audit trail data
const auditTrails = ref([]);
const filteredTrails = computed(() => {
  let results = auditTrails.value;

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    results = results.filter(
      (trail) =>
        (trail.user?.username || "").toLowerCase().includes(query) ||
        (trail.user?.email || "").toLowerCase().includes(query) ||
        (trail.action || "").toLowerCase().includes(query) ||
        (trail.model_name || "").toLowerCase().includes(query) ||
        (trail.ip_address || "").toLowerCase().includes(query)
    );
  }

  // Filter by action
  if (filterAction.value !== "all") {
    results = results.filter((trail) => trail.action === filterAction.value);
  }

  // Filter by date range
  if (filterStartDate.value) {
    const startDate = new Date(filterStartDate.value);
    results = results.filter(
      (trail) => new Date(trail.created_at) >= startDate
    );
  }

  if (filterEndDate.value) {
    const endDate = new Date(filterEndDate.value);
    endDate.setHours(23, 59, 59, 999);
    results = results.filter((trail) => new Date(trail.created_at) <= endDate);
  }

  return results;
});

// Action types available
const actionTypes = [
  "password_created",
  "password_accessed",
  "password_updated",
  "password_deleted",
  "permission_granted",
  "permission_revoked",
  "permission_updated",
  "user_login",
  "user_logout",
];

// Color mappings for actions
const actionColors = {
  password_created: "bg-blue-100 text-blue-800",
  password_accessed: "bg-purple-100 text-purple-800",
  password_updated: "bg-yellow-100 text-yellow-800",
  password_deleted: "bg-red-100 text-red-800",
  permission_granted: "bg-green-100 text-green-800",
  permission_revoked: "bg-red-100 text-red-800",
  permission_updated: "bg-orange-100 text-orange-800",
  user_login: "bg-indigo-100 text-indigo-800",
  user_logout: "bg-pink-100 text-pink-800",
};

// Fetch audit trails from backend
const fetchAuditTrails = async () => {
  loading.value = true;
  try {
    console.log("📥 Fetching audit trails...");
    console.log("🔐 Is admin?:", userStore.isAdmin);

    // Use /audit-trails endpoint
    const endpoint = API_ENDPOINTS.AUDIT_TRAILS.LIST;

    console.log("🔗 Using endpoint:", endpoint);

    const response = await apiClient.get(endpoint);
    console.log("📦 Response:", response);

    let trailsData = response.data;
    if (trailsData.data && Array.isArray(trailsData.data)) {
      trailsData = trailsData.data;
    } else if (!Array.isArray(trailsData)) {
      console.warn("⚠️ Response is not an array, treating as empty");
      trailsData = [];
    }

    auditTrails.value = trailsData;
    console.log("✅ Audit trails loaded:", auditTrails.value.length);
  } catch (err) {
    console.error("❌ Error fetching audit trails:", err);
    console.error("❌ Error status:", err.response?.status);
    console.error("❌ Error message:", err.message);

    // If 404, provide helpful message and load sample data
    if (err.response?.status === 404) {
      showError(
        "Audit Trail API endpoint not yet implemented on backend. Using demo data instead."
      );
      // Load sample/demo data for development
      auditTrails.value = getSampleAuditTrails();
    } else {
      showError("Failed to load audit trails: " + err.message);
      // Use empty array as fallback
      auditTrails.value = [];
    }
  } finally {
    loading.value = false;
  }
};

// Generate sample audit trail data for development/demo
const getSampleAuditTrails = () => {
  const now = new Date();
  return [
    {
      id: 1,
      user: { id: 1, username: "admin", email: "admin@nanopass.local" },
      action: "password_created",
      model_type: "Password",
      model_name: "Production Database",
      description: "Created password: Production Database",
      ip_address: "192.168.1.100",
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
      created_at: new Date(now.getTime() - 1 * 60000).toISOString(),
    },
    {
      id: 2,
      user: { id: 2, username: "john_doe", email: "john@example.com" },
      action: "password_accessed",
      model_type: "Password",
      model_name: "Staging Server",
      description: "Accessed password: Staging Server",
      ip_address: "192.168.1.105",
      user_agent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
      created_at: new Date(now.getTime() - 5 * 60000).toISOString(),
    },
    {
      id: 3,
      user: { id: 1, username: "admin", email: "admin@nanopass.local" },
      action: "permission_granted",
      model_type: "Permission",
      model_name: "john_doe - Production Systems",
      description: "Granted access to john_doe for Production Systems",
      ip_address: "192.168.1.100",
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36",
      created_at: new Date(now.getTime() - 10 * 60000).toISOString(),
    },
    {
      id: 4,
      user: { id: 3, username: "jane_smith", email: "jane@example.com" },
      action: "password_updated",
      model_type: "Password",
      model_name: "Admin Account",
      description: "Updated password: Admin Account",
      ip_address: "192.168.1.110",
      user_agent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36",
      created_at: new Date(now.getTime() - 15 * 60000).toISOString(),
    },
    {
      id: 5,
      user: { id: 1, username: "admin", email: "admin@nanopass.local" },
      action: "permission_revoked",
      model_type: "Permission",
      model_name: "temp_user - All Systems",
      description: "Revoked access from temp_user",
      ip_address: "192.168.1.100",
      user_agent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
      created_at: new Date(now.getTime() - 20 * 60000).toISOString(),
    },
  ];
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Format JSON for display
const formatJSON = (obj) => {
  if (!obj) return "N/A";
  return JSON.stringify(obj, null, 2);
};

// Get display name for model type
const getModelTypeName = (modelType) => {
  if (!modelType) return "N/A";
  return modelType.split("\\").pop() || modelType;
};

// Extract OS from user agent
const getOperatingSystem = (userAgent) => {
  if (!userAgent) return "Unknown";

  // Detect OS from user agent
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS X"))
    return "macOS";
  if (userAgent.includes("X11") && userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  if (userAgent.includes("Android")) return "Android";

  return "Other";
};

// Extract browser from user agent
const getBrowser = (userAgent) => {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Chrome") && !userAgent.includes("Chromium"))
    return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";

  return "Other";
};

// Format changes from audit trail for display
const formatChanges = (trail) => {
  if (!trail) return "N/A";

  // If there's a model_name or description, show that first
  if (trail.model_name) return trail.model_name;
  if (trail.description) return trail.description;

  // Otherwise, format based on the changes object
  const changes = trail.changes || {};

  // If no changes, return based on model type
  if (!changes || Object.keys(changes).length === 0) {
    return (
      getModelTypeName(trail.model_type) +
      (trail.model_id ? ` #${trail.model_id}` : "")
    );
  }

  // Format changes object into readable summary
  const changeEntries = Object.entries(changes);
  if (changeEntries.length === 0) {
    return (
      getModelTypeName(trail.model_type) +
      (trail.model_id ? ` #${trail.model_id}` : "")
    );
  }

  // Build summary from changes
  const summaries = changeEntries.slice(0, 2).map(([key, value]) => {
    if (Array.isArray(value) && value.length === 2) {
      // Old value -> New value format
      const oldVal = value[0] || "(empty)";
      const newVal = value[1] || "(empty)";
      return `${key}: ${oldVal} → ${newVal}`;
    }
    return `${key}: ${JSON.stringify(value)}`;
  });

  const summary = summaries.join("; ");
  return changeEntries.length > 2 ? summary + "..." : summary;
};

// Export to Excel with real data
const exportToExcel = () => {
  try {
    if (filteredTrails.value.length === 0) {
      showError("No data to export");
      return;
    }

    const exportData = filteredTrails.value.map((trail) => {
      return {
        Timestamp: formatDate(trail.created_at),
        Username: trail.user?.username || "N/A",
        Email: trail.user?.email || "N/A",
        Activity: trail.action || "N/A",
        Type: getModelTypeName(trail.model_type),
        Privilege: trail.user?.admin || trail.user?.is_admin ? "Admin" : "User",
        "IP Address": trail.ip_address || "N/A",
        "Operating System": getOperatingSystem(trail.user_agent),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Trails");

    // Set column widths
    worksheet["!cols"] = [
      { wch: 20 }, // Timestamp
      { wch: 15 }, // Username
      { wch: 25 }, // Email
      { wch: 18 }, // Activity
      { wch: 15 }, // Type
      { wch: 12 }, // Privilege
      { wch: 15 }, // IP Address
      { wch: 15 }, // Operating System
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `audit-trails-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
    success(`Exported ${filteredTrails.value.length} records to ${filename}`);
  } catch (err) {
    console.error("Error exporting to Excel:", err);
    showError("Failed to export data");
  }
};

// Initialize on component mount
onMounted(() => {
  fetchAuditTrails();
});
</script>

<template>
  <BaseLayout>
    <div class="p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Audit Trails</h1>
        <p class="mt-2 text-gray-600">
          {{
            userStore.isAdmin
              ? "Track all system activities and user actions"
              : "View your activity history"
          }}
        </p>
      </div>

      <!-- Summary Cards -->
      <div class="grid gap-4 md:grid-cols-3 mb-8">
        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <p class="text-sm text-gray-600">Total Activities</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">
            {{ auditTrails.length }}
          </p>
          <p class="mt-1 text-xs text-gray-500">All recorded events</p>
        </div>

        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <p class="text-sm text-gray-600">Recent 24 Hours</p>
          <p class="mt-2 text-3xl font-bold text-blue-600">
            {{
              auditTrails.filter((t) => {
                const date = new Date(t.created_at);
                const now = new Date();
                return (now - date) / (1000 * 60 * 60) <= 24;
              }).length
            }}
          </p>
          <p class="mt-1 text-xs text-gray-500">Last day activities</p>
        </div>

        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <p class="text-sm text-gray-600">Filtered Results</p>
          <p class="mt-2 text-3xl font-bold text-purple-600">
            {{ filteredTrails.length }}
          </p>
          <p class="mt-1 text-xs text-gray-500">Current filter</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-gray-400 mr-2" />
        <span class="text-gray-600">Loading audit trails...</span>
      </div>

      <!-- Filters and Search -->
      <div v-else class="mb-6 space-y-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end flex-wrap">
          <!-- Search -->
          <div class="flex-1 min-w-64">
            <label class="block text-sm font-medium text-gray-900 mb-2"
              >Search</label
            >
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by username, email, action, or IP..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <!-- Action Filter -->
          <div class="min-w-fit">
            <label class="block text-sm font-medium text-gray-900 mb-2"
              >Action</label
            >
            <select
              v-model="filterAction"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option
                v-for="action in actionTypes"
                :key="action"
                :value="action"
              >
                {{ action }}
              </option>
            </select>
          </div>

          <!-- Start Date Filter -->
          <div class="min-w-fit">
            <label class="block text-sm font-medium text-gray-900 mb-2"
              >From</label
            >
            <input
              v-model="filterStartDate"
              type="date"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- End Date Filter -->
          <div class="min-w-fit">
            <label class="block text-sm font-medium text-gray-900 mb-2"
              >To</label
            >
            <input
              v-model="filterEndDate"
              type="date"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Export Button -->
          <button
            @click="exportToExcel"
            :disabled="filteredTrails.length === 0"
            class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download class="h-4 w-4" />
            Export Excel
          </button>
        </div>

        <!-- Results Count -->
        <div class="text-sm text-gray-600">
          Showing {{ filteredTrails.length }} of
          {{ auditTrails.length }} activities
        </div>
      </div>

      <!-- Audit Trails Table -->
      <div
        v-if="!loading"
        class="rounded-lg border bg-white shadow-sm overflow-hidden"
      >
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
                  Activity
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Privilege
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  IP Address
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Operating System
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <template v-for="trail in filteredTrails" :key="trail.id">
                <tr class="hover:bg-gray-50 transition-colors">
                  <!-- User Column -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-900"
                      >
                        {{
                          (trail.user?.username || "U")
                            .substring(0, 2)
                            .toUpperCase()
                        }}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {{ trail.user?.username || "N/A" }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ trail.user?.email || "N/A" }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Activity Column (Action + Model Type as pills) -->
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          actionColors[trail.action] ||
                            'bg-gray-100 text-gray-800',
                        ]"
                      >
                        {{ trail.action }}
                      </span>
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                      >
                        {{ getModelTypeName(trail.model_type) }}
                      </span>
                    </div>
                  </td>

                  <!-- Privilege Column -->
                  <td class="px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        trail.user?.admin || trail.user?.is_admin
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800',
                      ]"
                    >
                      {{
                        trail.user?.admin || trail.user?.is_admin
                          ? "Admin"
                          : "User"
                      }}
                    </span>
                  </td>

                  <!-- IP Address Column -->
                  <td class="px-6 py-4 text-sm text-gray-600 font-mono">
                    {{ trail.ip_address || "N/A" }}
                  </td>

                  <!-- Operating System/Browser Column -->
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {{ getOperatingSystem(trail.user_agent) }}
                      </span>
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {{ getBrowser(trail.user_agent) }}
                      </span>
                    </div>
                  </td>
                  <!-- Timestamp Column -->
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ formatDate(trail.created_at) }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTrails.length === 0" class="px-6 py-12 text-center">
          <p class="text-gray-500 text-sm">
            No audit activities found. Try adjusting your filters.
          </p>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

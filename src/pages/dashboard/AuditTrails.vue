<script setup>
import { ref, onMounted, computed, watch } from "vue";
import BaseLayout from "@/layouts/AppLayout.vue";
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-vue-next";
import { useToast } from "@/composables/useToast";
import { useUserStore } from "@/stores/useUserStore";
import { useAuditTrails } from "@/composables/useAuditTrails";
import * as XLSX from "xlsx";

const { success, error: showError } = useToast();
const userStore = useUserStore();
const {
  auditTrails,
  loading,
  pagination,
  filters,
  fetchAuditTrails,
  logKeyCopied,
  logAdminReview,
  exportAuditTrails,
  setFilter,
  setFilters,
  resetFilters,
  setPage,
  setPerPage,
} = useAuditTrails();

// Local UI state
const searchQuery = ref("");
const filterCategory = ref("all");
const filterStatus = ref("all");
const filterStartDate = ref("");
const filterEndDate = ref("");
const filterActionType = ref("all");
const filterAffectedUser = ref("");
const filterAffectedSystem = ref("");
const showAdvancedFilters = ref(false);
const refreshing = ref(false);
const itemsPerPageOptions = [10, 25, 50, 100];

// Paginated trails (from API pagination)
const paginatedTrails = computed(() => {
  return auditTrails.value;
});

// Total pages from API
const totalPages = computed(() => {
  return pagination.value.last_page || 1;
});

// Current page from API
const currentPage = computed(() => {
  return pagination.value.current_page || 1;
});

// Total items from API
const totalItems = computed(() => {
  return pagination.value.total || 0;
});

// Items per page from API
const itemsPerPage = computed(() => {
  return pagination.value.per_page || 20;
});

// Pagination info display
const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    totalItems.value,
  );
  return `${start}-${end} of ${totalItems.value}`;
});

// Unique categories from audit trails (from data received)
const uniqueCategories = computed(() => {
  const categories = new Set(
    auditTrails.value
      .map((trail) => trail.action_category)
      .filter((cat) => cat),
  );
  return Array.from(categories).sort();
});

// Unique action types
const uniqueActionTypes = computed(() => {
  const actions = new Set(
    auditTrails.value.map((trail) => trail.action_type).filter((act) => act),
  );
  return Array.from(actions).sort();
});

// ========================================
// DETAILED ANALYTICS COMPUTED PROPERTIES
// ========================================

// Last 24 hours activity
const last24HoursCount = computed(() => {
  const now = new Date();
  return auditTrails.value.filter((t) => {
    const date = new Date(t.created_at);
    return (now - date) / (1000 * 60 * 60) <= 24;
  }).length;
});

// Last 7 days activity
const last7DaysCount = computed(() => {
  const now = new Date();
  return auditTrails.value.filter((t) => {
    const date = new Date(t.created_at);
    return (now - date) / (1000 * 60 * 60 * 24) <= 7;
  }).length;
});

// Activity breakdown by category
const activityByCategory = computed(() => {
  const breakdown = {};
  auditTrails.value.forEach((trail) => {
    const category = trail.action_category || "OTHER";
    breakdown[category] = (breakdown[category] || 0) + 1;
  });
  return breakdown;
});

// Activity breakdown by action type
const activityByActionType = computed(() => {
  const breakdown = {};
  auditTrails.value.forEach((trail) => {
    const action = trail.action_type || trail.action || "UNKNOWN";
    breakdown[action] = (breakdown[action] || 0) + 1;
  });
  return breakdown;
});

// Success vs Failed breakdown
const successFailureStats = computed(() => {
  const stats = {
    SUCCESS: 0,
    FAILED: 0,
    PENDING: 0,
    UNKNOWN: 0,
  };
  auditTrails.value.forEach((trail) => {
    const status = trail.status || "UNKNOWN";
    if (status in stats) {
      stats[status]++;
    } else {
      stats.UNKNOWN++;
    }
  });
  return stats;
});

// Top 5 most active users
const topActiveUsers = computed(() => {
  const userActivity = {};
  auditTrails.value.forEach((trail) => {
    const username = trail.user?.username || "Unknown";
    userActivity[username] = (userActivity[username] || 0) + 1;
  });
  return Object.entries(userActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([username, count]) => ({ username, count }));
});

// Critical security events (failed attempts, deletions, admin changes)
const securityEvents = computed(() => {
  return auditTrails.value.filter((t) => {
    const action = t.action?.toUpperCase() || "";
    const status = t.status || "";
    return (
      action.includes("DELETE") ||
      action.includes("ADMIN") ||
      status === "FAILED" ||
      action.includes("REVOKE") ||
      action.includes("PERMISSION")
    );
  }).length;
});

// Password access events (reveals and copies)
const passwordAccessEvents = computed(() => {
  return auditTrails.value.filter((t) => {
    const action = t.action?.toUpperCase() || "";
    return (
      action.includes("PASSWORD") &&
      (action.includes("REVEAL") || action.includes("COPY"))
    );
  }).length;
});

// System changes (creates, updates, deletes)
const systemChanges = computed(() => {
  return auditTrails.value.filter((t) => {
    const action = t.action?.toUpperCase() || "";
    return (
      action.includes("CREATE") ||
      action.includes("UPDATE") ||
      action.includes("DELETE")
    );
  }).length;
});

// Most accessed systems
const mostAccessedSystems = computed(() => {
  const systemAccess = {};
  auditTrails.value.forEach((trail) => {
    const systemName =
      trail.new_values?.system_name ||
      trail.old_values?.system_name ||
      trail.description;
    if (systemName) {
      systemAccess[systemName] = (systemAccess[systemName] || 0) + 1;
    }
  });
  return Object.entries(systemAccess)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([systemName, count]) => ({ systemName, count }));
});

// Failed operations count
const failedOperationsCount = computed(() => {
  return auditTrails.value.filter((t) => t.status === "FAILED").length;
});

// Success rate percentage
const successRatePercentage = computed(() => {
  if (auditTrails.value.length === 0) return 0;
  const successful = auditTrails.value.filter(
    (t) => t.status === "SUCCESS",
  ).length;
  return Math.round((successful / auditTrails.value.length) * 100);
});

// Current selection month/year
const currentMonthCount = computed(() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return auditTrails.value.filter((t) => {
    const date = new Date(t.created_at);
    return (
      date.getFullYear() === currentYear && date.getMonth() === currentMonth
    );
  }).length;
});

// Color mappings for categories
const categoryColors = {
  USER: "bg-blue-100 text-blue-800",
  SYSTEM: "bg-purple-100 text-purple-800",
  PASSWORD: "bg-red-100 text-red-800",
  PERMISSION: "bg-green-100 text-green-800",
  PERSONAL_KEY: "bg-yellow-100 text-yellow-800",
  ADMIN: "bg-orange-100 text-orange-800",
  POLICY: "bg-pink-100 text-pink-800",
  DEPARTMENT: "bg-indigo-100 text-indigo-800",
  CATEGORY: "bg-teal-100 text-teal-800",
  DESCRIPTION: "bg-cyan-100 text-cyan-800",
  OTHER: "bg-gray-100 text-gray-800",
  UNKNOWN: "bg-gray-100 text-gray-800",
};

const getCategoryColor = (category) => {
  return categoryColors[category] || categoryColors.OTHER;
};

// Determine the proper category based on action and model_type
const getCategoryFromAction = (trail) => {
  // If action_category is properly set and not "OTHER", use it
  if (trail.action_category && trail.action_category !== "OTHER") {
    return trail.action_category;
  }

  const action = trail.action || "";
  const modelType = trail.model_type || "";

  // Check based on action name
  if (action.includes("PERMISSION")) return "PERMISSION";
  if (action.includes("PASSWORD")) return "PASSWORD";
  if (action.includes("PERSONAL_KEY")) return "PERSONAL_KEY";
  if (action.includes("POLICY")) return "POLICY";
  if (action.includes("ADMIN")) return "ADMIN";

  // Check based on model type
  if (modelType.includes("Permission")) return "PERMISSION";
  if (modelType.includes("Password")) return "PASSWORD";
  if (modelType.includes("PersonalKey")) return "PERSONAL_KEY";
  if (modelType.includes("User")) return "USER";
  if (modelType.includes("System")) return "SYSTEM";
  if (modelType.includes("Category")) return "CATEGORY";
  if (modelType.includes("Department")) return "DEPARTMENT";
  if (modelType.includes("Policy")) return "POLICY";
  if (modelType.includes("Description")) return "DESCRIPTION";

  return trail.action_category || "OTHER";
};

// Get model name from model_type
const getModelName = (modelType) => {
  if (!modelType) return "Resource";
  const parts = modelType.split("\\");
  return parts[parts.length - 1] || "Resource";
};

// Format action descriptions for non-technical users
const getHumanReadableAction = (trail) => {
  const action = trail.action || "";
  const oldValues = trail.old_values || {};
  const newValues = trail.new_values || {};

  // Permission actions (PERMISSION_ASSIGN, PERMISSION_REVOKE)
  if (action.includes("PERMISSION")) {
    const targetUser =
      newValues.target_user_username ||
      newValues.user_username ||
      trail.affected_user?.username ||
      "a user";
    const systemName = newValues.system_name || "a system";

    if (action.includes("ASSIGN")) {
      return `Permission Assigned: ${targetUser} → ${systemName || "system"}`;
    } else if (action.includes("REVOKE")) {
      return `Permission Revoked: ${targetUser} ← ${systemName || "system"}`;
    }
    return `Permission Updated for ${targetUser}`;
  }

  // Password actions
  if (action.includes("PASSWORD") || trail.model_type?.includes("Password")) {
    const system =
      newValues.system_name ||
      oldValues.system_name ||
      newValues.title ||
      "system";
    const actionType = action.split("_").pop();

    if (actionType === "CREATE") {
      return `Password Created: ${system}`;
    } else if (actionType === "UPDATE") {
      return `Password Updated: ${system}`;
    } else if (actionType === "DELETE") {
      return `Password Deleted: ${system}`;
    } else if (actionType.includes("REVEAL") || actionType.includes("ACCESS")) {
      return `Password Revealed: ${system}`;
    } else if (actionType.includes("COPY")) {
      return `Password Copied: ${system}`;
    }
    return `Password ${actionType}: ${system}`;
  }

  // Personal key actions
  if (
    action.includes("PERSONAL_KEY") ||
    trail.model_type?.includes("PersonalKey")
  ) {
    const keyName = newValues.key_name || oldValues.key_name || "key";
    if (action.includes("REVEAL") || action.includes("VIEW")) {
      return `Personal Key Revealed: ${keyName}`;
    } else if (action.includes("COPY")) {
      return `Personal Key Copied: ${keyName}`;
    }
    const actionType = action.split("_").pop();
    return `Personal Key ${actionType}: ${keyName}`;
  }

  // User actions (CREATE, UPDATE, DELETE)
  if (trail.model_type?.includes("User")) {
    const username =
      newValues.target_user_username ||
      newValues.user_username ||
      oldValues.username ||
      "user";
    const actionType =
      action === "CREATE"
        ? "CREATE"
        : action === "UPDATE"
          ? "UPDATE"
          : "DELETE";

    if (actionType === "CREATE") {
      return `User Created: ${username}`;
    } else if (actionType === "UPDATE") {
      return `User Updated: ${username}`;
    } else if (actionType === "DELETE") {
      return `User Deleted: ${username}`;
    }
  }

  // System actions
  if (trail.model_type?.includes("System")) {
    const systemName =
      newValues.system_name || oldValues.system_name || "system";
    const actionType = action;

    if (actionType === "CREATE") {
      return `System Created: ${systemName}`;
    } else if (actionType === "UPDATE") {
      return `System Updated: ${systemName}`;
    } else if (actionType === "DELETE") {
      return `System Deleted: ${systemName}`;
    }
  }

  // Category actions
  if (trail.model_type?.includes("Category")) {
    const categoryName = newValues.name || oldValues.name || "category";
    const actionType = action;

    if (actionType === "CREATE") {
      return `Category Created: ${categoryName}`;
    } else if (actionType === "UPDATE") {
      return `Category Updated: ${categoryName}`;
    } else if (actionType === "DELETE") {
      return `Category Deleted: ${categoryName}`;
    }
  }

  // Generic fallback
  if (trail.description && trail.description !== "OTHER UNKNOWN") {
    return trail.description;
  }

  // Ultimate fallback - parse action and model name
  const modelName = getModelName(trail.model_type);
  const actionType = action.replace(/_/g, " ");
  return `${actionType} ${modelName}`;
};

// Get status display and color
const getStatusDisplay = (status) => {
  const statuses = {
    SUCCESS: { label: "Success", color: "bg-green-100 text-green-800" },
    FAILED: { label: "Failed", color: "bg-red-100 text-red-800" },
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  };
  return (
    statuses[status] || {
      label: status || "Unknown",
      color: "bg-gray-100 text-gray-800",
    }
  );
};

// Extract OS from user agent
const getOperatingSystem = (userAgent) => {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("iPhone")) return "iOS";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPad")) return "iPadOS";

  return "Unknown OS";
};

// Extract browser from user agent
const getBrowser = (userAgent) => {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";
  if (userAgent.includes("Trident")) return "Internet Explorer";

  return "Unknown Browser";
};

// Format the previous changes for display
const getPreviousChangeSummary = (trail) => {
  const oldValues = trail.old_values;
  if (!oldValues || Object.keys(oldValues).length === 0) {
    return "No previous state";
  }

  const summaries = [];
  const action = trail.action_type || trail.action || "";
  const fieldsToSkip = [
    "id",
    "user_id",
    "admin_id",
    "system_id",
    "permission_id",
    "created_at",
    "updated_at",
    "target_user_id",
  ];

  if (action.includes("PERMISSION")) {
    if (oldValues.date_time_expiry) {
      summaries.push(`Expires: ${formatDate(oldValues.date_time_expiry)}`);
    }
    if (oldValues.user_username) {
      summaries.push(`User: ${oldValues.user_username}`);
    }
  } else if (action.includes("PASSWORD")) {
    if (oldValues.system_name) {
      summaries.push(`System: ${oldValues.system_name}`);
    }
  } else if (action.includes("USER")) {
    if (oldValues.username) {
      summaries.push(`Username: ${oldValues.username}`);
    }
    if (oldValues.email) {
      summaries.push(`Email: ${oldValues.email}`);
    }
    if (oldValues.is_admin !== undefined) {
      summaries.push(`Admin: ${oldValues.is_admin ? "Yes" : "No"}`);
    }
  } else {
    // Generic fallback for actions not explicitly handled above
    Object.entries(oldValues).forEach(([key, value]) => {
      if (
        !fieldsToSkip.includes(key) &&
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        let displayValue = value;

        // Check if value is a date string (ISO format or similar)
        if (typeof value === "string" && /\d{4}-\d{2}-\d{2}/.test(value)) {
          displayValue = formatDate(value);
        } else if (typeof value === "boolean") {
          displayValue = value ? "Yes" : "No";
        }

        summaries.push(`${label}: ${displayValue}`);
      }
    });
  }

  return summaries.length > 0 ? summaries.join(" • ") : "No changes";
};

// Format the current changes for display
const getCurrentChangeSummary = (trail) => {
  const newValues = trail.new_values;
  if (!newValues || Object.keys(newValues).length === 0) {
    return "No current state";
  }

  const summaries = [];
  const action = trail.action_type || trail.action || "";
  const fieldsToSkip = [
    "id",
    "user_id",
    "admin_id",
    "system_id",
    "permission_id",
    "created_at",
    "updated_at",
    "target_user_id",
  ];

  if (action.includes("PERMISSION")) {
    if (newValues.date_time_expiry) {
      summaries.push(`Expires: ${formatDate(newValues.date_time_expiry)}`);
    }
    if (newValues.user_username) {
      summaries.push(`User: ${newValues.user_username}`);
    }
  } else if (action.includes("PASSWORD")) {
    if (newValues.system_name) {
      summaries.push(`System: ${newValues.system_name}`);
    }
  } else if (action.includes("USER")) {
    if (newValues.username) {
      summaries.push(`Username: ${newValues.username}`);
    }
    if (newValues.email) {
      summaries.push(`Email: ${newValues.email}`);
    }
    if (newValues.is_admin !== undefined) {
      summaries.push(`Admin: ${newValues.is_admin ? "Yes" : "No"}`);
    }
  } else {
    // Generic fallback for actions not explicitly handled above
    Object.entries(newValues).forEach(([key, value]) => {
      if (
        !fieldsToSkip.includes(key) &&
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        let displayValue = value;

        // Check if value is a date string (ISO format or similar)
        if (typeof value === "string" && /\d{4}-\d{2}-\d{2}/.test(value)) {
          displayValue = formatDate(value);
        } else if (typeof value === "boolean") {
          displayValue = value ? "Yes" : "No";
        }

        summaries.push(`${label}: ${displayValue}`);
      }
    });
  }

  return summaries.length > 0 ? summaries.join(" • ") : "No changes";
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} - ${month} - ${year}, ${hours}:${minutes}${ampm}`;
};

// Export to Excel (client-side fallback)
const exportToExcel = () => {
  try {
    if (auditTrails.value.length === 0) {
      showError("No data to export");
      return;
    }

    const exportData = auditTrails.value.map((trail) => ({
      Timestamp: formatDate(trail.created_at),
      User: `${trail.user?.username || "N/A"} (${trail.user?.email || "N/A"})`,
      "User Type": trail.user?.admin ? "Admin" : "User",
      Action: getHumanReadableAction(trail),
      Category: trail.action_category || "N/A",
      Status: getStatusDisplay(trail.status).label,
      "IP Address": trail.ip_address || "N/A",
      Description: trail.description || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Trails");
    XLSX.writeFile(
      workbook,
      `audit-trails-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    success("Audit trails exported successfully");
  } catch (err) {
    console.error("Export failed:", err);
    showError("Failed to export audit trails");
  }
};

// Fetch audit trails from backend
// ========================================
// FILTER MANAGEMENT & API CALLS
// ========================================

/**
 * Apply filters and fetch data from API
 */
const applyFilters = async () => {
  try {
    refreshing.value = true;
    console.log("🔄 Applying filters and fetching data...");

    // Build filter object
    const newFilters = {
      search: searchQuery.value || null,
      category: filterCategory.value !== "all" ? filterCategory.value : null,
      action_type:
        filterActionType.value !== "all" ? filterActionType.value : null,
      status: filterStatus.value !== "all" ? filterStatus.value : null,
      from_date: filterStartDate.value || null,
      to_date: filterEndDate.value || null,
      affected_user_id: filterAffectedUser.value
        ? parseInt(filterAffectedUser.value)
        : null,
      affected_system_id: filterAffectedSystem.value
        ? parseInt(filterAffectedSystem.value)
        : null,
      per_page: pagination.value.per_page,
      page: 1,
    };

    setFilters(newFilters);
    await fetchAuditTrails();
    success("Filters applied");
  } catch (err) {
    console.error("❌ Error applying filters:", err);
    showError("Failed to fetch audit trails");
  } finally {
    refreshing.value = false;
  }
};

/**
 * Clear all filters
 */
const clearFilters = async () => {
  try {
    searchQuery.value = "";
    filterCategory.value = "all";
    filterStatus.value = "all";
    filterStartDate.value = "";
    filterEndDate.value = "";
    filterActionType.value = "all";
    filterAffectedUser.value = "";
    filterAffectedSystem.value = "";

    resetFilters();
    await fetchAuditTrails();
    success("Filters cleared");
  } catch (err) {
    console.error("❌ Error clearing filters:", err);
    showError("Failed to clear filters");
  }
};

/**
 * Change page
 */
const goToPage = async (page) => {
  try {
    setPage(page);
    await fetchAuditTrails();
  } catch (err) {
    console.error("❌ Error changing page:", err);
    showError("Failed to load page");
  }
};

/**
 * Change items per page
 */
const changeItemsPerPage = async (perPage) => {
  try {
    setPerPage(perPage);
    setPage(1); // Reset to first page when changing per_page
    await fetchAuditTrails();
  } catch (err) {
    console.error("❌ Error changing items per page:", err);
    showError("Failed to change items per page");
  }
};

/**
 * Previous page
 */
const prevPage = async () => {
  if (currentPage.value > 1) {
    await goToPage(currentPage.value - 1);
  }
};

/**
 * Next page
 */
const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    await goToPage(currentPage.value + 1);
  }
};

/**
 * Export current filtered data to CSV
 */
const handleExport = async () => {
  try {
    console.log("📤 Exporting audit trails...");
    await exportAuditTrails();
    success("Export started");
  } catch (err) {
    console.error("❌ Error exporting:", err);
    showError("Failed to export audit trails");
  }
};

/**
 * Refresh current view
 */
const refreshAuditTrails = async () => {
  try {
    refreshing.value = true;
    console.log("🔄 Refreshing audit trails...");
    await fetchAuditTrails();
    success("Data refreshed");
  } catch (err) {
    console.error("❌ Error refreshing:", err);
    showError("Failed to refresh data");
  } finally {
    refreshing.value = false;
  }
};

// Watch for filter changes and refetch
watch([() => filters.value.page], async () => {
  if (filters.value.page !== 1) {
    await fetchAuditTrails();
  }
});

// Initialize on component mount
onMounted(async () => {
  try {
    await fetchAuditTrails();
  } catch (err) {
    console.error("❌ Error loading initial audit trails:", err);
    showError("Failed to load audit trails");
  }
});
</script>

<template>
  <BaseLayout>
    <div class="min-h-screen bg-gray-50">
      <div class="p-2 sm:p-4 md:p-6">
        <!-- Page Header -->
        <div class="mb-6 sm:mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Audit Trails</h1>
          <p class="mt-2 text-gray-600">
            {{
              userStore.isAdmin
                ? "Track all system activities and user actions across the platform"
                : "View your personal activity history"
            }}
          </p>
        </div>

        <!-- Summary Cards -->
        <div class="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          <!-- Primary Stats Row -->
          <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <!-- Total Activities Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">
                    Total Activities
                  </p>
                  <p class="mt-2 text-3xl font-bold text-gray-900">
                    {{ auditTrails.length }}
                  </p>
                  <p class="mt-2 text-xs text-gray-500">
                    {{ currentMonthCount }} this month
                  </p>
                </div>
                <div class="text-4xl opacity-10">📊</div>
              </div>
            </div>

            <!-- Success Rate Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Success Rate</p>
                  <p class="mt-2 text-3xl font-bold text-green-600">
                    {{ successRatePercentage }}%
                  </p>
                  <p class="mt-2 text-xs text-gray-500">
                    {{ successFailureStats.SUCCESS }} successful operations
                  </p>
                </div>
                <div class="text-4xl opacity-10">✅</div>
              </div>
            </div>

            <!-- Recent Activity Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Last 24 Hours</p>
                  <p class="mt-2 text-3xl font-bold text-blue-600">
                    {{ last24HoursCount }}
                  </p>
                  <p class="mt-2 text-xs text-gray-500">
                    {{ last7DaysCount }} in last 7 days
                  </p>
                </div>
                <div class="text-4xl opacity-10">⏰</div>
              </div>
            </div>

            <!-- Security Events Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              :class="securityEvents > 0 ? 'bg-red-50' : ''"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p
                    class="text-sm font-medium"
                    :class="
                      securityEvents > 0 ? 'text-red-700' : 'text-gray-600'
                    "
                  >
                    Security Events
                  </p>
                  <p
                    class="mt-2 text-3xl font-bold"
                    :class="
                      securityEvents > 0 ? 'text-red-600' : 'text-gray-900'
                    "
                  >
                    {{ securityEvents }}
                  </p>
                  <p
                    class="mt-2 text-xs"
                    :class="
                      securityEvents > 0 ? 'text-red-600' : 'text-gray-500'
                    "
                  >
                    {{ failedOperationsCount }} failed operations
                  </p>
                </div>
                <div class="text-4xl opacity-10">🔒</div>
              </div>
            </div>
          </div>

          <!-- Secondary Stats Row -->
          <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <!-- Password Access Events Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-700">
                  Password Access
                </h3>
                <div class="text-3xl opacity-20">🔑</div>
              </div>
              <p class="text-2xl font-bold text-purple-600">
                {{ passwordAccessEvents }}
              </p>
              <p class="mt-2 text-xs text-gray-500">Reveals & Copies</p>
              <div class="mt-3 pt-3 border-t border-gray-200 space-y-1">
                <p class="text-xs text-gray-600">Categories:</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-if="activityByCategory.PASSWORD"
                    class="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded"
                  >
                    PASSWORD ({{ activityByCategory.PASSWORD }})
                  </span>
                </div>
              </div>
            </div>

            <!-- Top Users Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-700">
                  Most Active Users
                </h3>
                <div class="text-3xl opacity-20">👥</div>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(user, idx) in topActiveUsers"
                  :key="idx"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-gray-700 truncate">{{
                    user.username
                  }}</span>
                  <span class="font-bold text-gray-900 ml-2">{{
                    user.count
                  }}</span>
                </div>
                <p
                  v-if="topActiveUsers.length === 0"
                  class="text-xs text-gray-500 italic"
                >
                  No users yet
                </p>
              </div>
            </div>

            <!-- System Changes Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-700">
                  System Changes
                </h3>
                <div class="text-3xl opacity-20">⚙️</div>
              </div>
              <p class="text-2xl font-bold text-indigo-600">
                {{ systemChanges }}
              </p>
              <p class="mt-2 text-xs text-gray-500">Create, Update, Delete</p>
              <div class="mt-3 pt-3 border-t border-gray-200">
                <p class="text-xs text-gray-600 mb-1">Breakdown:</p>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span>Creates:</span>
                    <span class="font-semibold">{{
                      activityByActionType.CREATE || 0
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Updates:</span>
                    <span class="font-semibold">{{
                      activityByActionType.UPDATE || 0
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Deletes:</span>
                    <span class="font-semibold text-red-600">{{
                      activityByActionType.DELETE || 0
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tertiary Stats Row -->
          <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
            <!-- Most Accessed Systems Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-700">
                  Most Accessed Systems
                </h3>
                <div class="text-3xl opacity-20">🌐</div>
              </div>
              <div class="space-y-3">
                <div
                  v-for="(system, idx) in mostAccessedSystems"
                  :key="idx"
                  class="flex items-center justify-between"
                >
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ system.systemName }}
                    </p>
                  </div>
                  <div
                    class="ml-3 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {{ system.count }}
                  </div>
                </div>
                <p
                  v-if="mostAccessedSystems.length === 0"
                  class="text-xs text-gray-500 italic"
                >
                  No system access yet
                </p>
              </div>
            </div>

            <!-- Category Breakdown Card -->
            <div
              class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-700">
                  Activity by Category
                </h3>
                <div class="text-3xl opacity-20">📂</div>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(count, category) in activityByCategory"
                  :key="category"
                  class="flex items-center justify-between"
                >
                  <div class="flex items-center gap-2">
                    <span
                      :class="getCategoryColor(category)"
                      class="inline-block text-xs font-semibold px-2 py-1 rounded"
                    >
                      {{ category }}
                    </span>
                  </div>
                  <span class="font-bold text-gray-900">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-gray-400 mr-2" />
          <span class="text-gray-600">Loading audit trails...</span>
        </div>

        <!-- Filters and Table -->
        <div v-else class="space-y-4 sm:space-y-6">
          <!-- Filters Section -->
          <div class="rounded-lg border bg-white p-2 sm:p-4 md:p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
            >
              <!-- Search -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div class="relative">
                  <Search
                    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Username, email, IP..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Category Filter -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  v-model="filterCategory"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option
                    v-for="category in uniqueCategories"
                    :key="category"
                    :value="category"
                  >
                    {{ category }}
                  </option>
                </select>
              </div>

              <!-- Status Filter -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  v-model="filterStatus"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <!-- Export Button -->
              <div class="flex items-end">
                <button
                  @click="exportToExcel"
                  :disabled="auditTrails.length === 0"
                  class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download class="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <!-- Date Range Filters -->
            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-4"
            >
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  v-model="filterStartDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  v-model="filterEndDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <!-- Results count (only show when not using pagination) -->
          <div class="text-sm text-gray-600" v-if="totalPages <= 1">
            Showing {{ paginatedTrails.length }} of {{ totalItems }} activities
          </div>

          <!-- Table -->
          <div class="rounded-lg border bg-white shadow-sm overflow-x-auto">
            <div class="min-w-[320px] md:overflow-x-auto">
              <table class="w-full min-w-[900px] md:min-w-0 text-xs sm:text-sm">
                <thead>
                  <tr class="border-b bg-gray-50">
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      User
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      Action
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      Status
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      Previous State
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      Current State
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      IP Address
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      Device
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-if="paginatedTrails.length === 0"
                    class="hover:bg-gray-50"
                  >
                    <td colspan="8" class="px-2 sm:px-4 py-8 text-center">
                      <div class="flex flex-col items-center justify-center">
                        <AlertCircle class="h-8 w-8 text-gray-300 mb-2" />
                        <p class="text-gray-600">No audit trails found</p>
                      </div>
                    </td>
                  </tr>

                  <tr
                    v-for="trail in paginatedTrails"
                    :key="trail.id"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <!-- User Column -->
                    <td class="px-2 sm:px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div
                          class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-900 shrink-0"
                        >
                          {{
                            (trail.user?.username || "U")
                              .substring(0, 2)
                              .toUpperCase()
                          }}
                        </div>
                        <div class="min-w-0">
                          <div class="text-sm font-medium text-gray-900">
                            {{ trail.user?.username || "N/A" }}
                          </div>
                          <div class="text-xs text-gray-500 truncate">
                            {{ trail.user?.email || "N/A" }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Action Column -->
                    <td class="px-2 sm:px-4 py-3">
                      <div class="flex flex-col gap-2">
                        <div class="text-sm text-gray-900 font-medium max-w-xs">
                          {{ getHumanReadableAction(trail) }}
                        </div>
                        <span
                          :class="[
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit',
                            getCategoryColor(getCategoryFromAction(trail)),
                          ]"
                        >
                          {{ getCategoryFromAction(trail) }}
                        </span>
                      </div>
                    </td>

                    <!-- Status Column -->
                    <td class="px-2 sm:px-4 py-3">
                      <span
                        :class="[
                          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                          getStatusDisplay(trail.status).color,
                        ]"
                      >
                        {{ getStatusDisplay(trail.status).label }}
                      </span>
                    </td>

                    <!-- Previous State Column -->
                    <td class="px-2 sm:px-4 py-3">
                      <div
                        class="bg-gray-100 rounded-md p-3 text-xs text-gray-700 max-w-xs"
                      >
                        {{ getPreviousChangeSummary(trail) }}
                      </div>
                    </td>

                    <!-- Current State Column -->
                    <td class="px-2 sm:px-4 py-3">
                      <div
                        class="bg-green-100 rounded-md p-3 text-xs text-green-700 max-w-xs"
                      >
                        {{ getCurrentChangeSummary(trail) }}
                      </div>
                    </td>

                    <!-- IP Address Column -->
                    <td
                      class="px-2 sm:px-4 py-3 text-xs font-mono text-gray-600"
                    >
                      {{ trail.ip_address || "N/A" }}
                    </td>

                    <!-- Device Column (OS + Browser) -->
                    <td class="px-2 sm:px-4 py-3 text-xs">
                      <div class="space-y-0.5">
                        <div class="text-gray-900 font-medium">
                          {{ getOperatingSystem(trail.user_agent) }}
                        </div>
                        <div class="text-gray-500">
                          {{ getBrowser(trail.user_agent) }}
                        </div>
                      </div>
                    </td>

                    <!-- Timestamp Column -->
                    <td
                      class="px-2 sm:px-4 py-3 text-xs text-gray-600 whitespace-nowrap"
                    >
                      {{ formatDate(trail.created_at) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="border-t px-4 sm:px-6 py-4 bg-gray-50"
          >
            <div
              class="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  :value="itemsPerPage"
                  @change="changeItemsPerPage(Number($event.target.value))"
                  class="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option
                    v-for="option in itemsPerPageOptions"
                    :key="option"
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>
                <span>records</span>
              </div>

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
  </BaseLayout>
</template>

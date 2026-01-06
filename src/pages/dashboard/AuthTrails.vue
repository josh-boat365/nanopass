<script setup>
import { ref, onMounted, computed, watch } from "vue";
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
  ChevronLeft,
  ChevronRight,
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
const filterActionType = ref("all");
const filterCategory = ref("all");
const filterStatus = ref("all");
const filterAffectedUser = ref("all");
const filterAffectedSystem = ref("all");
const filterStartDate = ref("");
const filterEndDate = ref("");
const loading = ref(false);
const expandedRows = ref(new Set());
const currentPage = ref(1);
const itemsPerPage = 20;

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

  // Filter by category
  if (filterCategory.value !== "all") {
    results = results.filter(
      (trail) => trail.action_category === filterCategory.value
    );
  }

  // Filter by status
  if (filterStatus.value !== "all") {
    results = results.filter((trail) => trail.status === filterStatus.value);
  }

  // Filter by action type
  if (filterActionType.value !== "all") {
    results = results.filter(
      (trail) => trail.action_type === filterActionType.value
    );
  }

  // Filter by affected user
  if (filterAffectedUser.value !== "all") {
    results = results.filter(
      (trail) => trail.affected_user?.username === filterAffectedUser.value
    );
  }

  // Filter by affected system
  if (filterAffectedSystem.value !== "all") {
    results = results.filter(
      (trail) =>
        trail.affected_system?.system_name === filterAffectedSystem.value
    );
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

// Paginated trails
const paginatedTrails = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredTrails.value.slice(start, end);
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredTrails.value.length / itemsPerPage);
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
  "personal_key_revealed",
  "assigned_key_revealed",
  "key_access_failed",
  "personal_key_copied",
  "assigned_key_copied",
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
  personal_key_revealed: "bg-teal-100 text-teal-800",
  assigned_key_revealed: "bg-cyan-100 text-cyan-800",
  key_access_failed: "bg-red-100 text-red-800",
  personal_key_copied: "bg-emerald-100 text-emerald-800",
  assigned_key_copied: "bg-lime-100 text-lime-800",
};

// Get unique action types from audit trails
const uniqueActionTypes = computed(() => {
  const types = new Set(
    auditTrails.value
      .map((trail) => trail.action_type)
      .filter((type) => type && type !== "UNKNOWN")
  );
  return Array.from(types).sort();
});

// Get unique affected users from audit trails
const uniqueAffectedUsers = computed(() => {
  const users = new Set(
    auditTrails.value
      .map((trail) => trail.affected_user?.username)
      .filter((user) => user)
  );
  return Array.from(users).sort();
});

// Get unique affected systems from audit trails
const uniqueAffectedSystems = computed(() => {
  const systems = new Set(
    auditTrails.value
      .map((trail) => trail.affected_system?.system_name)
      .filter((system) => system)
  );
  return Array.from(systems).sort();
});

// Color mapping for action categories
const categoryColors = {
  USER: "bg-blue-100 text-blue-800",
  SYSTEM: "bg-purple-100 text-purple-800",
  PASSWORD: "bg-red-100 text-red-800",
  PERMISSION: "bg-green-100 text-green-800",
  PERSONAL_KEY: "bg-yellow-100 text-yellow-800",
  ADMIN: "bg-orange-100 text-orange-800",
  POLICY: "bg-indigo-100 text-indigo-800",
  OTHER: "bg-gray-100 text-gray-800",
};

// Get category badge color
const getCategoryBadgeColor = (category) => {
  return categoryColors[category] || "bg-gray-100 text-gray-800";
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
const getWhatChanged = (trail) => {
  if (!trail) return "N/A";

  const action = (trail.action || "").toUpperCase();
  const newValues = trail.new_values || {};
  const oldValues = trail.old_values || {};

  // Permission-related actions
  if (action.includes("PERMISSION")) {
    if (action === "PERMISSION_ASSIGN" || action === "PERMISSION_CREATE") {
      const systemName =
        newValues.system_name || newValues.system_id || "Unknown";
      const targetUser =
        newValues.target_user_username || newValues.user_username || "Unknown";
      return `Assigned ${systemName} to ${targetUser}`;
    }
    if (action === "PERMISSION_REVOKE") {
      const systemName =
        oldValues.system_name || oldValues.system_id || "Unknown";
      const targetUser =
        oldValues.target_user_username || oldValues.user_username || "Unknown";
      return `Revoked ${systemName} from ${targetUser}`;
    }
    if (action === "PERMISSION_UPDATE") {
      const systemName =
        newValues.system_name || oldValues.system_name || "Unknown";
      const oldDate = oldValues.date_time_expiry;
      const newDate = newValues.date_time_expiry;
      if (oldDate !== newDate) {
        return `Updated expiry for ${systemName}`;
      }
      return `Updated ${systemName} permission`;
    }
  }

  // Key/Password-related actions
  if (action.includes("KEY") || action.includes("PASSWORD")) {
    const keyName = newValues.key_name || oldValues.key_name || "Unknown Key";

    if (action === "ASSIGNED_KEY_REVEALED" || action === "PASSWORD_REVEALED") {
      const systemName = newValues.system_name || "";
      return systemName
        ? `Revealed ${systemName} password`
        : `Revealed ${keyName}`;
    }
    if (action === "PERSONAL_KEY_REVEALED") {
      return `Revealed personal key: ${keyName}`;
    }
    if (action === "ASSIGNED_KEY_COPIED" || action === "PASSWORD_COPIED") {
      const systemName = newValues.system_name || "";
      return systemName ? `Copied ${systemName} password` : `Copied ${keyName}`;
    }
    if (action === "PERSONAL_KEY_COPIED") {
      return `Copied personal key: ${keyName}`;
    }
    if (action === "KEY_ACCESS_FAILED" || action === "PASSWORD_ACCESS_FAILED") {
      return `Failed to access: ${keyName}`;
    }
    if (action === "PASSWORD_CREATED") {
      const systemName = newValues.system_name || "Unknown";
      return `Created password for ${systemName}`;
    }
    if (action === "PASSWORD_UPDATED") {
      const systemName =
        newValues.system_name || oldValues.system_name || "Unknown";
      return `Updated ${systemName} password`;
    }
    if (action === "PASSWORD_DELETED") {
      const systemName = oldValues.system_name || "Unknown";
      return `Deleted password for ${systemName}`;
    }
  }

  // System-related actions
  if (action.includes("SYSTEM")) {
    const systemName =
      newValues.system_name || oldValues.system_name || "Unknown System";
    if (action === "SYSTEM_CREATED") {
      return `Created system: ${systemName}`;
    }
    if (action === "SYSTEM_UPDATED") {
      return `Updated system: ${systemName}`;
    }
    if (action === "SYSTEM_DELETED") {
      return `Deleted system: ${systemName}`;
    }
  }

  // User-related actions
  if (action.includes("USER")) {
    const username =
      newValues.user_username || oldValues.user_username || "Unknown";
    if (action === "USER_CREATED") {
      return `Created user: ${username}`;
    }
    if (action === "USER_UPDATED") {
      return `Updated user: ${username}`;
    }
    if (action === "USER_DELETED") {
      return `Deleted user: ${username}`;
    }
    if (action === "USER_LOGIN") {
      return `${username} logged in`;
    }
    if (action === "USER_LOGOUT") {
      return `${username} logged out`;
    }
  }

  // Fallback
  return (
    trail.description || `${getModelTypeName(trail.model_type)} - ${action}`
  );
};

// Format changes for display (user-friendly, no JSON)
const getFormattedChanges = (trail) => {
  if (!trail) return { old: [], new: [] };

  const oldValues = trail.old_values || {};
  const newValues = trail.new_values || {};
  const action = (trail.action || "").toUpperCase();

  const changes = { old: [], new: [] };

  // Key fields to display based on action type
  const fieldsToDisplay = {
    PERMISSION: [
      "system_name",
      "system_id",
      "user_username",
      "date_time_expiry",
      "status",
    ],
    PASSWORD: ["system_name", "system_id", "username", "status", "updated_at"],
    KEY: [
      "key_name",
      "key_type",
      "system_name",
      "status",
      "revealed_at",
      "accessed_at",
    ],
    SYSTEM: ["system_name", "system_url", "system_type", "status"],
    USER: ["username", "email", "is_admin", "status"],
  };

  // Determine which fields to show
  let fields = [];
  if (action.includes("PERMISSION")) {
    fields = fieldsToDisplay.PERMISSION;
  } else if (action.includes("PASSWORD")) {
    fields = fieldsToDisplay.PASSWORD;
  } else if (action.includes("KEY")) {
    fields = fieldsToDisplay.KEY;
  } else if (action.includes("SYSTEM")) {
    fields = fieldsToDisplay.SYSTEM;
  } else if (action.includes("USER")) {
    fields = fieldsToDisplay.USER;
  }

  // Extract relevant fields
  fields.forEach((field) => {
    if (oldValues[field] !== undefined) {
      changes.old.push({
        label: formatFieldLabel(field),
        value: formatFieldValue(field, oldValues[field]),
      });
    }
    if (newValues[field] !== undefined) {
      changes.new.push({
        label: formatFieldLabel(field),
        value: formatFieldValue(field, newValues[field]),
      });
    }
  });

  return changes;
};

// Format field label for display
const formatFieldLabel = (field) => {
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Format field value for display
const formatFieldValue = (field, value) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field.includes("date") || field.includes("time"))
    return formatDate(value);
  if (field.includes("_at")) return formatDate(value);
  return String(value);
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

// Get changes made data - dynamically extract all non-null fields, excluding IDs
const getChangesMade = (trail) => {
  if (!trail) return { previous: {}, current: {} };
  const oldValues = trail.old_values || {};
  const newValues = trail.new_values || {};

  const result = { previous: {}, current: {} };

  // Fields to exclude (IDs and internal fields)
  const excludeFields = new Set(["id", "updated_at", "created_at"]);

  // Extract all non-null, non-object previous values, excluding IDs
  Object.entries(oldValues).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      typeof value !== "object" &&
      !key.endsWith("_id") &&
      !excludeFields.has(key)
    ) {
      result.previous[key] = value;
    }
  });

  // Extract all non-null, non-object current values, excluding IDs
  Object.entries(newValues).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      typeof value !== "object" &&
      !key.endsWith("_id") &&
      !excludeFields.has(key)
    ) {
      result.current[key] = value;
    }
  });

  return result;
};

// Format action name for display - uses action_type if valid, falls back to action
const formatActionName = (action, actionType) => {
  if (!action && !actionType) return "N/A";
  // Use action_type only if it's valid and not "UNKNOWN", otherwise use action
  const displayAction =
    actionType && actionType !== "UNKNOWN" ? actionType : action;
  return displayAction
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Extract target user from trail
const getTargetUser = (trail) => {
  if (!trail) return "";
  // Prefer affected_user object first
  if (trail.affected_user?.username) {
    return trail.affected_user.username;
  }
  const newValues = trail.new_values || {};
  const oldValues = trail.old_values || {};
  return (
    newValues.target_user_username ||
    newValues.username ||
    oldValues.user_username ||
    newValues.user_username ||
    ""
  );
};

// Extract system name from trail
const getSystemName = (trail) => {
  if (!trail) return "";
  // Prefer affected_system object first
  if (trail.affected_system?.system_name) {
    return trail.affected_system.system_name;
  }
  const newValues = trail.new_values || {};
  const oldValues = trail.old_values || {};
  // Try system_name first, then fall back to title (for system records)
  return (
    newValues.system_name || newValues.title || oldValues.system_name || ""
  );
};

// Extract key name from trail
const getKeyName = (trail) => {
  if (!trail) return "";
  const newValues = trail.new_values || {};
  return newValues.key_name || "";
};

// Get permission/system related details
const getPermissionDetails = (trail) => {
  if (!trail) return {};
  const newValues = trail.new_values || {};
  const action = (trail.action || "").toUpperCase();

  const details = {
    permission_id: newValues.permission_id || "",
    expiry: "",
    reason: "",
  };

  if (newValues.date_time_expiry) {
    const expiryDate = new Date(newValues.date_time_expiry);
    details.expiry = expiryDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (action.includes("FAILED") && newValues.failure_reason) {
    details.reason = newValues.failure_reason
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  return details;
};

// Format field names for display
const formatFieldName = (key) => {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Format values for display
const formatValue = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

// Format change field for display (with special handling for dates)
const formatChangeField = (key, value) => {
  if (value === null || value === undefined) return "N/A";
  // Date fields
  if (
    key.includes("date") ||
    key.includes("time") ||
    key.includes("_at") ||
    key.includes("expiry")
  ) {
    return formatDate(value);
  }
  // Boolean fields
  if (typeof value === "boolean") return value ? "Yes" : "No";
  // Fallback to string
  return String(value);
};

// Get display name for change field with flexible mapping
const getChangeFieldLabel = (key) => {
  const labels = {
    updated_at: "Updated",
    created_at: "Created",
    username: "Username",
    system_name: "System",
    title: "Title",
    name: "Name",
    is_active: "Active",
    description: "Description",
    category_id: "Category",
    policy_id: "Policy",
    system_id: "System ID",
    user_id: "User ID",
    permission_id: "Permission ID",
    email: "Email",
    admin: "Admin",
    status: "Status",
    key_name: "Key Name",
    key_type: "Key Type",
    access_type: "Access Type",
  };
  return labels[key] || formatFieldName(key);
};

// Get status badge color
const getStatusColor = (status) => {
  const colors = {
    SUCCESS: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

// Get status display text
const getStatusText = (status) => {
  return status || "Unknown";
};

// Toggle row expansion for details
const toggleRowExpand = (trailId) => {
  if (expandedRows.value.has(trailId)) {
    expandedRows.value.delete(trailId);
  } else {
    expandedRows.value.add(trailId);
  }
};

// Check if row is expanded
const isRowExpanded = (trailId) => {
  return expandedRows.value.has(trailId);
};

// Reset pagination when filters change
watch(
  [
    searchQuery,
    filterAction,
    filterActionType,
    filterCategory,
    filterStatus,
    filterAffectedUser,
    filterAffectedSystem,
    filterStartDate,
    filterEndDate,
  ],
  () => {
    currentPage.value = 1;
  }
);

// Initialize on component mount
onMounted(() => {
  fetchAuditTrails();
});
</script>

<template>
  <BaseLayout>
    <div class="">
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
          <div class="flex flex-col gap-3 sm:gap-4">
            <!-- Search -->
            <div class="w-full">
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

            <!-- Filters Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <!-- Action Filter -->
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >Action</label
                >
                <select
                  v-model="filterAction"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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

              <!-- Category Filter -->
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >Category</label
                >
                <select
                  v-model="filterCategory"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="USER">User</option>
                  <option value="SYSTEM">System</option>
                  <option value="PASSWORD">Password</option>
                  <option value="PERMISSION">Permission</option>
                  <option value="PERSONAL_KEY">Personal Key</option>
                  <option value="ADMIN">Admin</option>
                  <option value="POLICY">Policy</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <!-- Status Filter -->
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >Status</label
                >
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

              <!-- Action Type Filter -->
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >Action Type</label
                >
                <select
                  v-model="filterActionType"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Action Types</option>
                  <option
                    v-for="type in uniqueActionTypes"
                    :key="type"
                    :value="type"
                  >
                    {{ formatActionName(type, type) }}
                  </option>
                </select>
              </div>

              <!-- Affected User Filter -->
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >Affected User</label
                >
                <select
                  v-model="filterAffectedUser"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option
                    v-for="user in uniqueAffectedUsers"
                    :key="user"
                    :value="user"
                  >
                    {{ user }}
                  </option>
                </select>
              </div>

              <!-- Affected System Filter -->
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >Affected System</label
                >
                <select
                  v-model="filterAffectedSystem"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Systems</option>
                  <option
                    v-for="system in uniqueAffectedSystems"
                    :key="system"
                    :value="system"
                  >
                    {{ system }}
                  </option>
                </select>
              </div>

              <!-- Start Date Filter -->
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >From</label
                >
                <input
                  v-model="filterStartDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <!-- End Date Filter -->
              <div class="w-full">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >To</label
                >
                <input
                  v-model="filterEndDate"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <!-- Export Button -->
              <div class="w-full flex items-end">
                <button
                  @click="exportToExcel"
                  :disabled="filteredTrails.length === 0"
                  class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download class="h-4 w-4" />
                  <span class="hidden sm:inline">Export Excel</span>
                  <span class="sm:hidden">Export</span>
                </button>
              </div>
            </div>
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
          <!-- Desktop Table View (lg and above) -->
          <div class="hidden lg:block">
            <table class="w-full">
              <thead>
                <tr class="border-b bg-gray-50">
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-8"
                  ></th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Admin User
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Action
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Description
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Affected User
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Affected System
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Target / Resource
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Status
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Previous Change
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Current Change
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    IP Address
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Device
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <template v-for="trail in paginatedTrails" :key="trail.id">
                  <tr class="hover:bg-gray-50 transition-colors">
                    <!-- Expand Button -->
                    <td class="px-2 py-2 text-center">
                      <button
                        @click="toggleRowExpand(trail.id)"
                        class="inline-flex items-center justify-center p-1 rounded hover:bg-gray-200 transition-colors"
                        :title="isRowExpanded(trail.id) ? 'Collapse' : 'Expand'"
                      >
                        <ChevronDown
                          class="h-4 w-4"
                          :class="{
                            'rotate-0': isRowExpanded(trail.id),
                            'rotate-270': !isRowExpanded(trail.id),
                          }"
                        />
                      </button>
                    </td>

                    <!-- User Column -->
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div
                          class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-900 shrink-0"
                        >
                          {{
                            (trail.user?.username || "U")
                              .substring(0, 2)
                              .toUpperCase()
                          }}
                        </div>
                        <div class="min-w-0">
                          <div
                            class="text-xs font-medium text-gray-900 truncate"
                          >
                            {{ trail.user?.username || "N/A" }}
                          </div>
                          <div class="text-xs text-gray-500 truncate">
                            {{ trail.user?.email || "N/A" }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Action Column -->
                    <td class="px-3 py-2">
                      <div class="flex flex-col gap-1">
                        <span
                          class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 w-fit"
                        >
                          {{
                            formatActionName(trail.action, trail.action_type)
                          }}
                        </span>
                        <span
                          v-if="trail.action_category"
                          :class="[
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit',
                            getCategoryBadgeColor(trail.action_category),
                          ]"
                        >
                          {{ trail.action_category }}
                        </span>
                      </div>
                    </td>

                    <!-- Description Column -->
                    <td class="px-3 py-2 text-xs text-gray-700 max-w-xs">
                      <div class="truncate" :title="trail.description || 'N/A'">
                        {{ trail.description || "N/A" }}
                      </div>
                    </td>

                    <!-- Affected User Column -->
                    <td class="px-3 py-2 text-xs">
                      <div
                        v-if="trail.affected_user?.username"
                        class="text-gray-900 font-medium"
                      >
                        {{ trail.affected_user.username }}
                      </div>
                      <div
                        v-else-if="trail.affected_user?.email"
                        class="text-gray-600 text-xs"
                      >
                        {{ trail.affected_user.email }}
                      </div>
                      <div v-else class="text-gray-400">—</div>
                    </td>

                    <!-- Affected System Column -->
                    <td class="px-3 py-2 text-xs text-gray-900">
                      <div
                        v-if="trail.affected_system?.system_name"
                        class="font-medium"
                      >
                        {{ trail.affected_system.system_name }}
                      </div>
                      <div v-else class="text-gray-400">—</div>
                    </td>

                    <!-- Target / Resource Column -->
                    <td class="px-3 py-2 text-xs text-gray-700">
                      <div class="space-y-1">
                        <div v-if="getTargetUser(trail)" class="font-medium">
                          {{ getTargetUser(trail) }}
                        </div>
                        <div v-if="getSystemName(trail)" class="font-medium">
                          {{ getSystemName(trail) }}
                        </div>
                        <div v-if="getKeyName(trail)" class="font-medium">
                          {{ getKeyName(trail) }}
                        </div>
                      </div>
                    </td>

                    <!-- Status Column -->
                    <td class="px-3 py-2">
                      <span
                        :class="[
                          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                          getStatusColor(trail.status),
                        ]"
                      >
                        {{ getStatusText(trail.status) }}
                      </span>
                    </td>

                    <!-- Previous Change Column -->
                    <td class="px-3 py-2 text-xs">
                      <div
                        v-if="
                          Object.keys(getChangesMade(trail).previous).length > 0
                        "
                        class="bg-red-50 p-2 rounded"
                      >
                        <div class="space-y-0.5 text-gray-700">
                          <div
                            v-for="(value, key) in getChangesMade(trail)
                              .previous"
                            :key="`prev-${key}`"
                            class="text-xs"
                          >
                            <span class="font-medium"
                              >{{ getChangeFieldLabel(key) }}:</span
                            >
                            {{ formatChangeField(key, value) }}
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-gray-400 text-xs">—</div>
                    </td>

                    <!-- Current Change Column -->
                    <td class="px-3 py-2 text-xs">
                      <div
                        v-if="
                          Object.keys(getChangesMade(trail).current).length > 0
                        "
                        class="bg-green-50 p-2 rounded"
                      >
                        <div class="space-y-0.5 text-gray-700">
                          <div
                            v-for="(value, key) in getChangesMade(trail)
                              .current"
                            :key="`curr-${key}`"
                            class="text-xs"
                          >
                            <span class="font-medium"
                              >{{ getChangeFieldLabel(key) }}:</span
                            >
                            {{ formatChangeField(key, value) }}
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-gray-400 text-xs">—</div>
                    </td>

                    <!-- IP Address Column -->
                    <td class="px-3 py-2 text-xs text-gray-600 font-mono">
                      {{ trail.ip_address || "N/A" }}
                    </td>

                    <!-- Device Column (OS + Browser) -->
                    <td class="px-3 py-2 text-xs">
                      <div class="space-y-0.5">
                        <div class="text-gray-900">
                          {{ getOperatingSystem(trail.user_agent) }}
                        </div>
                        <div class="text-gray-500">
                          {{ getBrowser(trail.user_agent) }}
                        </div>
                      </div>
                    </td>

                    <!-- Timestamp Column -->
                    <td
                      class="px-3 py-2 text-xs text-gray-900 whitespace-nowrap"
                    >
                      {{ formatDate(trail.created_at) }}
                    </td>
                  </tr>

                  <!-- Expanded Details Row -->
                  <tr
                    v-if="isRowExpanded(trail.id)"
                    class="bg-gray-50 border-b"
                  >
                    <td colspan="11" class="px-6 py-4">
                      <div class="grid grid-cols-2 gap-6">
                        <!-- Left Column: Basic Info -->
                        <div>
                          <h4 class="text-sm font-semibold text-gray-900 mb-3">
                            Activity Details
                          </h4>
                          <div class="space-y-2">
                            <div>
                              <p class="text-xs text-gray-600">Action Type</p>
                              <p class="text-sm font-medium text-gray-900">
                                {{ trail.action_type || "N/A" }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-gray-600">Category</p>
                              <span
                                v-if="trail.action_category"
                                :class="[
                                  'inline-block px-2 py-1 rounded text-xs font-medium',
                                  getCategoryBadgeColor(trail.action_category),
                                ]"
                              >
                                {{ trail.action_category }}
                              </span>
                              <span v-else class="text-sm text-gray-600"
                                >N/A</span
                              >
                            </div>
                            <div>
                              <p class="text-xs text-gray-600">Status</p>
                              <span
                                :class="[
                                  'inline-block px-2 py-1 rounded text-xs font-medium',
                                  getStatusColor(trail.status),
                                ]"
                              >
                                {{ getStatusText(trail.status) }}
                              </span>
                            </div>
                            <div>
                              <p class="text-xs text-gray-600">IP Address</p>
                              <p class="text-sm font-mono text-gray-900">
                                {{ trail.ip_address || "N/A" }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Right Column: Description and Details -->
                        <div>
                          <h4 class="text-sm font-semibold text-gray-900 mb-3">
                            Additional Info
                          </h4>
                          <div class="space-y-2">
                            <div>
                              <p class="text-xs text-gray-600">Description</p>
                              <p class="text-sm text-gray-900">
                                {{ trail.description || "N/A" }}
                              </p>
                            </div>
                            <div v-if="trail.details">
                              <p class="text-xs text-gray-600">
                                Details (JSON)
                              </p>
                              <details class="text-xs">
                                <summary
                                  class="cursor-pointer text-blue-600 hover:text-blue-800"
                                >
                                  View Details
                                </summary>
                                <pre
                                  class="mt-2 p-2 bg-white rounded border border-gray-200 overflow-auto max-h-48 text-xs text-gray-700"
                                  >{{
                                    JSON.stringify(trail.details, null, 2)
                                  }}</pre
                                >
                              </details>
                            </div>
                            <div>
                              <p class="text-xs text-gray-600">User Agent</p>
                              <p
                                class="text-xs text-gray-900 truncate"
                                :title="trail.user_agent || 'N/A'"
                              >
                                {{ trail.user_agent || "N/A" }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div
            v-if="filteredTrails.length > 0"
            class="flex items-center justify-between px-6 py-4 border-t bg-white"
          >
            <div class="text-sm text-gray-600">
              Page {{ currentPage }} of {{ totalPages }} ({{
                filteredTrails.length
              }}
              total)
            </div>
            <div class="flex items-center gap-2">
              <button
                :disabled="currentPage === 1"
                @click="currentPage--"
                class="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft class="h-4 w-4" />
                <span class="hidden sm:inline">Previous</span>
              </button>

              <!-- Page numbers -->
              <div class="flex items-center gap-1">
                <button
                  v-for="page in totalPages"
                  :key="page"
                  @click="currentPage = page"
                  :class="[
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    currentPage === page
                      ? 'bg-black text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50',
                  ]"
                >
                  {{ page }}
                </button>
              </div>

              <button
                :disabled="currentPage === totalPages"
                @click="currentPage++"
                class="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span class="hidden sm:inline">Next</span>
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="filteredTrails.length === 0"
            class="px-6 py-12 text-center"
          >
            <p class="text-gray-500 text-sm">
              No audit activities found. Try adjusting your filters.
            </p>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

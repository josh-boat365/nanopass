<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Trash2,
  Edit2,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  X,
} from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";
import { useUserStore } from "@/stores/useUserStore";

const { success, error: showError } = useToast();
const userStore = useUserStore();

// ========================================
// STATE MANAGEMENT
// ========================================
const users = ref([]);
const systems = ref([]);
const permissions = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedPermission = ref(null);
const searchQuery = ref("");
const loading = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 100];

// Form data
const formData = ref({
  user_id: null,
  system_ids: [],
  date_time_expiry: "",
});

// Error state
const errorMessage = ref("");

// System search state
const systemSearchQuery = ref("");

// ========================================
// UTILITY FUNCTIONS (Defined early for use in computed properties)
// ========================================

const getUserName = (userId) => {
  const user = users.value.find((u) => u.id === userId);
  return user ? user.username : "Unknown User";
};

const getUserDisplayName = (user) => {
  const fullName = `${user?.firstName || ""} ${user?.surname || ""}`.trim();
  return fullName || user?.username || user?.email || "Unknown User";
};

const getSystemName = (systemId) => {
  const system = systems.value.find((s) => s.id === systemId);
  return system ? system.system_name : "Unknown System";
};

const formatExpiryDate = (date) => {
  if (!date) return "No expiry";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isExpired = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

const calculateDaysLeft = (expiryDate) => {
  if (!expiryDate) return 0;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// ========================================
// COMPUTED PROPERTIES
// ========================================

// Filtered permissions based on search and expiry status
const filteredPermissions = computed(() => {
  // First filter by expiry - exclude expired permissions
  let results = permissions.value.filter((perm) => {
    const daysLeft = calculateDaysLeft(perm.date_time_expiry);
    return daysLeft > 0; // Only include active (non-expired) permissions
  });

  // Then apply search filter
  if (!searchQuery.value.trim()) {
    return results;
  }
  const query = searchQuery.value.toLowerCase();
  return results.filter(
    (perm) =>
      (perm.user_name && perm.user_name.toLowerCase().includes(query)) ||
      (perm.system_name && perm.system_name.toLowerCase().includes(query)),
  );
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(groupedPermissions.value.length / itemsPerPage.value);
});

const paginatedPermissions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredPermissions.value.slice(start, end);
});

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    groupedPermissions.value.length,
  );
  const total = groupedPermissions.value.length;
  return `${start}-${end} of ${total}`;
});

// Filtered systems based on search
const filteredSystems = computed(() => {
  if (!systemSearchQuery.value.trim()) {
    return systems.value;
  }
  const query = systemSearchQuery.value.toLowerCase();
  return systems.value.filter(
    (system) =>
      system.system_name?.toLowerCase().includes(query) ||
      (system.code && system.code.toLowerCase().includes(query)),
  );
});

// Get selected systems
const selectedSystems = computed(() => {
  return systems.value.filter((system) =>
    formData.value.system_ids.includes(system.id),
  );
});

// Group permissions by user
const groupedPermissions = computed(() => {
  const grouped = {};

  filteredPermissions.value.forEach((perm) => {
    const userId = perm.user_id;
    if (!grouped[userId]) {
      const user = users.value.find((u) => u.id === userId);
      grouped[userId] = {
        user_id: perm.user_id,
        user_name: getUserDisplayName(user) || getUserName(perm.user_id),
        systems: [],
      };
    }
    grouped[userId].systems.push({
      id: perm.id,
      system_id: perm.system_id,
      system_name: getSystemName(perm.system_id),
      date_time_expiry: perm.date_time_expiry,
    });
  });

  return Object.values(grouped);
});

// Paginated grouped permissions
const paginatedGroupedPermissions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return groupedPermissions.value.slice(start, end);
});

// ========================================
// NOTIFICATION FUNCTIONS
// ========================================

const notifyAssignment = async (userId, assignedSystems) => {
  try {
    if (!userId || !assignedSystems || assignedSystems.length === 0) {
      console.warn("⚠️ Invalid notification params: userId or systems missing");
      return;
    }

    const user = users.value.find((u) => u.id === userId);
    if (!user || !user.email) {
      console.warn("⚠️ User not found:", userId);
      return;
    }

    const systemNames = assignedSystems
      .map((sId) => {
        const sys = systems.value.find((s) => s.id === sId);
        return sys?.system_name || `System ${sId}`;
      })
      .join(", ");

    // Notifications are created internally by backend when permissions are assigned
    console.log(
      `✅ Systems assigned for user ${user.username || user.email}: ${systemNames}. Backend will create notifications.`,
    );

    // Simulate fulfilled results for backward compatibility
    const results = [{ status: "fulfilled" }, { status: "fulfilled" }];

    results.forEach((result, index) => {
      const type = index === 0 ? "user" : "admin";
      if (result.status === "fulfilled") {
        console.log(
          `ℹ️ ${type.toUpperCase()} notification will be created by backend`,
        );
      } else {
        console.error(
          `❌ ${type.toUpperCase()} notification failed:`,
          result.reason.message,
        );
      }
    });
  } catch (err) {
    console.error("⚠️ Failed to send notifications (non-critical):", err);
  }
};

/**
 * Notify user of new/add-on system assignments
 */
const notifyNewAssignments = async (userId, newSystemIds) => {
  try {
    if (!userId || !newSystemIds || newSystemIds.length === 0) {
      console.warn("⚠️ Invalid notification params for new assignments");
      return;
    }

    const user = users.value.find((u) => u.id === userId);
    if (!user || !user.email) {
      console.warn("⚠️ User not found:", userId);
      return;
    }

    const systemNames = newSystemIds
      .map((sId) => {
        const sys = systems.value.find((s) => s.id === sId);
        return sys?.system_name || `System ${sId}`;
      })
      .join(", ");

    // Notifications are created internally by backend when permissions are extended
    console.log(
      "✅ Access duration extended for:",
      user.email,
      ". Backend will create notifications.",
    );
    const results = [{ status: "fulfilled" }, { status: "fulfilled" }];

    results.forEach((result, index) => {
      const type = index === 0 ? "user" : "admin";
      if (result.status === "fulfilled") {
        console.log(
          `ℹ️ ${type.toUpperCase()} notification will be created by backend`,
        );
      } else {
        console.error(
          `❌ ${type.toUpperCase()} notification failed:`,
          result.reason.message,
        );
      }
    });
  } catch (err) {
    console.error("⚠️ Failed to send notifications (non-critical):", err);
  }
};

/**
 * Notify user of updated system assignment details (e.g., expiry date change)
 */
const notifyAssignmentUpdate = async (
  userId,
  updatedSystemIds,
  newExpiryDate,
) => {
  try {
    if (!userId || !updatedSystemIds || updatedSystemIds.length === 0) {
      console.warn("⚠️ Invalid notification params for update");
      return;
    }

    const user = users.value.find((u) => u.id === userId);
    if (!user || !user.email) {
      console.warn("⚠️ User not found:", userId);
      return;
    }

    const systemNames = updatedSystemIds
      .map((sId) => {
        const sys = systems.value.find((s) => s.id === sId);
        return sys?.system_name || `System ${sId}`;
      })
      .join(", ");

    const formattedDate = new Date(newExpiryDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Notifications are created internally by backend when permissions are updated
    console.log(
      "✅ Access duration updated for:",
      user.email,
      ". Backend will create notifications.",
    );
    const results = [{ status: "fulfilled" }, { status: "fulfilled" }];

    results.forEach((result, index) => {
      const type = index === 0 ? "user" : "admin";
      if (result.status === "fulfilled") {
        console.log(
          `ℹ️ ${type.toUpperCase()} notification will be created by backend`,
        );
      } else {
        console.error(
          `❌ ${type.toUpperCase()} notification failed:`,
          result.reason.message,
        );
      }
    });
  } catch (err) {
    console.error("⚠️ Failed to send notifications (non-critical):", err);
  }
};

// ========================================
// API FUNCTIONS
// ========================================

// Load all required data on mount
onMounted(async () => {
  try {
    await loadAllData();
  } catch (err) {
    console.error("Fatal error in onMounted:", err);
    showError("Failed to load page. Please try again.");
  }
});

const loadAllData = async () => {
  loading.value = true;
  console.log("🚀 Starting to load all data...");

  try {
    // Use Promise.allSettled to load all data in parallel
    const results = await Promise.allSettled([
      loadUsers(),
      loadSystems(),
      loadPermissions(),
    ]);

    console.log(
      "📊 Data load results:",
      results.map((r) => r.status),
    );

    // Handle results
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const dataType = ["users", "systems", "permissions"][index];
        console.error(`Failed to load ${dataType}:`, result.reason);
      }
    });
  } catch (err) {
    console.error("Error in loadAllData:", err);
  } finally {
    loading.value = false;
    console.log("✅ Loading completed, loading state set to false");
  }
};

const loadUsers = async () => {
  try {
    // Load from users endpoint instead of employees
    const endpoint = API_ENDPOINTS.USERS?.LIST || "/api/users";
    console.log("📥 Loading users from:", endpoint);
    const response = await apiClient.get(endpoint);
    const data = response.data.data || response.data || [];
    users.value = Array.isArray(data) ? data : [];
    console.log("✅ Users loaded:", users.value.length, "users");
    return users.value;
  } catch (err) {
    console.error("❌ Error loading users:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      error: err.toString(),
    });
    users.value = [];
    throw err;
  }
};

const loadSystems = async () => {
  try {
    console.log("📥 Loading systems from:", API_ENDPOINTS.SYSTEMS.LIST);
    const response = await apiClient.get(API_ENDPOINTS.SYSTEMS.LIST);
    const data = response.data.data || response.data || [];
    systems.value = Array.isArray(data) ? data : [];
    console.log("✅ Systems loaded:", systems.value.length, "systems");
    return systems.value;
  } catch (err) {
    console.error("❌ Error loading systems:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      error: err.toString(),
    });
    systems.value = [];
    throw err;
  }
};

const loadPermissions = async () => {
  try {
    const endpoint = API_ENDPOINTS.PERMISSIONS?.LIST || "/permissions";
    console.log("📥 Loading permissions from:", endpoint);
    const response = await apiClient.get(endpoint);
    const data = response.data.data || response.data || [];
    permissions.value = Array.isArray(data) ? data : [];
    console.log(
      "✅ Permissions loaded:",
      permissions.value.length,
      "permissions",
    );
    return permissions.value;
  } catch (err) {
    console.error("❌ Error loading permissions:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      error: err.toString(),
    });
    permissions.value = [];
    throw err;
  }
};

// ========================================
// MODAL MANAGEMENT
// ========================================

const openAddModal = () => {
  formData.value = {
    user_id: null,
    system_ids: [],
    date_time_expiry: "",
  };
  systemSearchQuery.value = "";
  errorMessage.value = "";
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
  formData.value = {
    user_id: null,
    system_ids: [],
    date_time_expiry: "",
  };
  systemSearchQuery.value = "";
  errorMessage.value = "";
};

const openEditModal = async (permissionToEdit) => {
  try {
    selectedPermission.value = permissionToEdit;
    formData.value = {
      user_id: permissionToEdit.user_id,
      system_ids: [permissionToEdit.system_id],
      date_time_expiry: permissionToEdit.date_time_expiry
        ? new Date(permissionToEdit.date_time_expiry)
            .toISOString()
            .split("T")[0]
        : "",
    };
    systemSearchQuery.value = "";
    errorMessage.value = "";
    showEditModal.value = true;
  } catch (err) {
    console.error("Error loading permission:", err);
    showError("Failed to load permission details");
  }
};

// Open edit modal for grouped permissions (multiple systems per user)
const openEditGroupModal = (group) => {
  try {
    selectedPermission.value = {
      user_id: group.user_id,
      systems: group.systems.map((s) => ({
        id: parseInt(s.id, 10),
        system_id: parseInt(s.system_id, 10),
        system_name: s.system_name,
        date_time_expiry: s.date_time_expiry,
      })),
    };
    formData.value.system_ids = group.systems.map((s) =>
      parseInt(s.system_id, 10),
    );
    formData.value.user_id = group.user_id;
    const expiryDate = new Date(group.systems[0].date_time_expiry);
    formData.value.date_time_expiry = expiryDate.toISOString().split("T")[0];
    systemSearchQuery.value = "";
    errorMessage.value = "";
    showEditModal.value = true;
  } catch (err) {
    console.error("Error loading permission:", err);
    showError("Failed to load permission details");
  }
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedPermission.value = null;
  formData.value = {
    user_id: null,
    system_ids: [],
    date_time_expiry: "",
  };
  systemSearchQuery.value = "";
  errorMessage.value = "";
};

const openDeleteModal = (permissionToDelete) => {
  selectedPermission.value = permissionToDelete;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedPermission.value = null;
};

// ========================================
// FORM VALIDATION & SUBMISSION
// ========================================

// Toggle system selection
const toggleSystemSelection = (systemId) => {
  const id = parseInt(systemId, 10);
  const index = formData.value.system_ids.findIndex(
    (sid) => parseInt(sid, 10) === id,
  );
  if (index > -1) {
    formData.value.system_ids.splice(index, 1);
  } else {
    formData.value.system_ids.push(id);
  }
};

// Check if system is selected
const isSystemSelected = (systemId) => {
  const id = parseInt(systemId, 10);
  return formData.value.system_ids.some((sid) => parseInt(sid, 10) === id);
};

// Remove system from selection
const removeSystem = (systemId) => {
  const id = parseInt(systemId, 10);
  const index = formData.value.system_ids.findIndex(
    (sid) => parseInt(sid, 10) === id,
  );
  if (index > -1) {
    formData.value.system_ids.splice(index, 1);
  }
};

const validateForm = () => {
  if (!formData.value.user_id) {
    return "User is required";
  }
  if (formData.value.system_ids.length === 0) {
    return "Please select at least one system";
  }
  if (!formData.value.date_time_expiry) {
    return "Expiry date is required";
  }

  const selectedDate = new Date(formData.value.date_time_expiry);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return "Expiry date must be in the future";
  }

  return null;
};

// Create permission - using bulk POST endpoint
const addPermission = async () => {
  const validationError = validateForm();
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  try {
    submitting.value = true;
    errorMessage.value = "";

    // Prepare permissions array for bulk create (one API call)
    const permissions = formData.value.system_ids.map((systemId) => ({
      system_id: systemId,
      date_time_expiry: formData.value.date_time_expiry + " 23:59:59",
    }));

    const requestData = {
      user_id: formData.value.user_id,
      permissions: permissions, // Send all systems in single request
    };

    const response = await apiClient.post("/permissions", requestData);

    if (response.data?.success) {
      const count =
        response.data.meta?.count || formData.value.system_ids.length;
      success(`✓ Created ${count} permission(s)`);

      // Send notifications to user and admin
      await notifyAssignment(formData.value.user_id, formData.value.system_ids);

      await loadPermissions();

      setTimeout(() => {
        closeAddModal();
      }, 1500);
    }
  } catch (err) {
    console.error("Error creating permission:", err);
    errorMessage.value =
      err.response?.data?.message || "Failed to assign permission";
  } finally {
    submitting.value = false;
  }
};

// Update permission - handles adding new, removing, and updating expiry dates
const updatePermission = async () => {
  if (!formData.value.date_time_expiry) {
    errorMessage.value = "Please select an expiry date";
    return;
  }

  if (!selectedPermission.value) return;

  try {
    submitting.value = true;
    errorMessage.value = "";

    // Get current assigned system IDs
    const currentSystemIds = selectedPermission.value.systems.map((s) =>
      parseInt(s.system_id, 10),
    );

    // Get newly selected system IDs
    const newSystemIds = formData.value.system_ids.map((id) =>
      parseInt(id, 10),
    );

    // Find systems to remove (in current but not in new)
    const systemsToRemove = currentSystemIds.filter(
      (id) => !newSystemIds.includes(id),
    );

    // Find systems to add (in new but not in current)
    const systemsToAdd = newSystemIds.filter(
      (id) => !currentSystemIds.includes(id),
    );

    // Find systems to update (in both - just update expiry date)
    const systemsToUpdate = selectedPermission.value.systems
      .filter((s) => newSystemIds.includes(parseInt(s.system_id, 10)))
      .map((s) => s.id);

    console.log({
      currentSystemIds,
      newSystemIds,
      systemsToRemove,
      systemsToAdd,
      systemsToUpdate,
    });

    // Step 1: Delete permissions for removed systems
    if (systemsToRemove.length > 0) {
      const deletePromises = selectedPermission.value.systems
        .filter((s) => systemsToRemove.includes(parseInt(s.system_id, 10)))
        .map((s) =>
          apiClient.delete(`/permissions/${s.id}`).catch((err) => {
            console.error(
              `Error deleting permission for system ${s.system_id}:`,
              err,
            );
            return Promise.reject(err);
          }),
        );

      await Promise.all(deletePromises);
      console.log(`Deleted ${systemsToRemove.length} permission(s)`);
    }

    // Step 2: Create permissions for newly added systems
    if (systemsToAdd.length > 0) {
      const newPermissions = systemsToAdd.map((systemId) => ({
        system_id: systemId,
        date_time_expiry: formData.value.date_time_expiry + " 23:59:59",
      }));

      const createResponse = await apiClient.post("/permissions", {
        user_id: selectedPermission.value.user_id,
        permissions: newPermissions,
      });

      if (!createResponse.data?.success) {
        throw new Error("Failed to create new permissions");
      }
      console.log(`Created ${systemsToAdd.length} permission(s)`);

      // Notify user of new/add-on assignments
      await notifyNewAssignments(
        selectedPermission.value.user_id,
        systemsToAdd,
      );
    }

    // Step 3: Update expiry date for remaining permissions
    if (systemsToUpdate.length > 0) {
      const updateResponse = await apiClient.put("/permissions", {
        ids: systemsToUpdate,
        date_time_expiry: formData.value.date_time_expiry + " 23:59:59",
      });

      if (!updateResponse.data?.success) {
        throw new Error("Failed to update permissions");
      }
      console.log(`Updated ${systemsToUpdate.length} permission(s)`);

      // Notify user of updated assignment details
      const updatedSystemIds = selectedPermission.value.systems
        .filter((s) => systemsToUpdate.includes(s.id))
        .map((s) => parseInt(s.system_id, 10));

      if (updatedSystemIds.length > 0) {
        await notifyAssignmentUpdate(
          selectedPermission.value.user_id,
          updatedSystemIds,
          formData.value.date_time_expiry,
        );
      }
    }

    success(
      `✓ Removed ${systemsToRemove.length}, Added ${systemsToAdd.length}, Updated ${systemsToUpdate.length}`,
    );
    await loadPermissions();

    setTimeout(() => {
      closeEditModal();
    }, 1500);
  } catch (err) {
    console.error("Error updating permission:", err);
    errorMessage.value =
      err.response?.data?.message || "Failed to update permission";
  } finally {
    submitting.value = false;
  }
};

// Delete permission
const deletePermission = async () => {
  if (!selectedPermission.value) return;

  try {
    submitting.value = true;

    // If deleting grouped systems, delete all permissions for this user
    if (
      selectedPermission.value.systems &&
      Array.isArray(selectedPermission.value.systems)
    ) {
      // Delete all permissions in the group
      const deletePromises = selectedPermission.value.systems.map((system) =>
        apiClient.delete(`/permissions/${system.id}`).catch((err) => {
          console.error(`Error deleting system ${system.system_name}:`, err);
          return Promise.reject(err);
        }),
      );

      await Promise.all(deletePromises);
      success("All permissions deleted successfully!");
    } else {
      // Single permission delete (fallback)
      await apiClient.delete(`/permissions/${selectedPermission.value.id}`);
      success("Permission deleted successfully!");
    }

    await loadPermissions();

    setTimeout(() => {
      closeDeleteModal();
    }, 1000);
  } catch (err) {
    console.error("Error deleting permission:", err);
    showError(err.response?.data?.message || "Failed to delete permission");
  } finally {
    submitting.value = false;
  }
};

// ========================================
// PAGINATION & EVENT HANDLERS
// ========================================

// Pagination methods
const handleSearch = () => {
  currentPage.value = 1;
};

const handleItemsPerPageChange = (value) => {
  itemsPerPage.value = value;
  currentPage.value = 1;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            Assign Systems to Users
          </h1>
          <p class="text-gray-600 text-xs sm:text-sm mt-1">
            Manage user permissions and system access with expiry dates.
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 whitespace-nowrap"
        >
          <Plus class="h-4 w-4" />
          Assign System
        </button>
      </div>

      <!-- Search Bar -->
      <div
        class="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4"
      >
        <div class="flex-1 w-full">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Search by user or system name..."
            class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div class="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          {{ filteredPermissions.length }} result{{
            filteredPermissions.length !== 1 ? "s" : ""
          }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
        <span class="ml-2 text-gray-600">Loading permissions...</span>
      </div>

      <!-- Permissions Table -->
      <div v-else class="rounded-lg border bg-white shadow-sm overflow-hidden">
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
                  System
                </th>
                <th
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Expiry Date
                </th>
                <th
                  class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Status
                </th>
                <th
                  class="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr
                v-for="group in paginatedGroupedPermissions"
                :key="group.user_id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                  {{ group.user_name }}
                </td>
                <td
                  class="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                >
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="system in group.systems"
                      :key="system.id"
                      class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {{ system.system_name }}
                    </span>
                  </div>
                </td>
                <td class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm">
                  <div
                    v-if="group.systems.length > 0"
                    class="flex items-center gap-2"
                  >
                    <Calendar class="h-4 w-4 text-gray-400" />
                    <!-- Show the earliest expiry date among all systems -->
                    {{
                      formatExpiryDate(
                        group.systems.reduce((earliest, sys) => {
                          const earliestDate = new Date(earliest);
                          const sysDate = new Date(sys.date_time_expiry);
                          return sysDate < earliestDate
                            ? sys.date_time_expiry
                            : earliest;
                        }, group.systems[0]?.date_time_expiry || ""),
                      )
                    }}
                  </div>
                </td>
                <td class="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      group.systems.every((sys) =>
                        isExpired(sys.date_time_expiry),
                      )
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800',
                    ]"
                  >
                    {{
                      group.systems.every((sys) =>
                        isExpired(sys.date_time_expiry),
                      )
                        ? "All Expired"
                        : "Active"
                    }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1 sm:gap-2">
                    <button
                      @click="openEditGroupModal(group)"
                      class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit2 class="h-4 w-4" />
                      <span class="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      @click="
                        () => {
                          selectedPermission = group;
                          showDeleteModal = true;
                        }
                      "
                      class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 class="h-4 w-4" />
                      <span class="hidden sm:inline">Delete</span>
                    </button>
                  </div>
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
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                :value="itemsPerPage"
                @change="handleItemsPerPageChange(Number($event.target.value))"
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

        <!-- Empty state -->
        <div
          v-if="filteredPermissions.length === 0"
          class="px-4 sm:px-6 py-12 text-center"
        >
          <AlertCircle class="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500 text-xs sm:text-sm">
            {{
              searchQuery.trim()
                ? "No permissions match your search."
                : "No permissions found. Create your first assignment."
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add Permission Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        class="relative w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4 sticky top-0 bg-white z-10">
          <h2 class="text-lg font-semibold text-gray-900">
            Assign Systems to User
          </h2>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <!-- Modal Body -->
        <form
          @submit.prevent="addPermission"
          class="px-4 sm:px-6 py-4 space-y-4"
        >
          <!-- User Selection -->
          <div>
            <label
              for="add-user"
              class="block text-sm font-medium text-gray-900 mb-1"
            >
              Select User *
            </label>
            <select
              id="add-user"
              v-model.number="formData.user_id"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option :value="null" disabled>Choose a user...</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ getUserDisplayName(user) }} ({{ user.username }})
              </option>
            </select>
          </div>

          <!-- System Selection with Search -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">
              Select Systems * ({{ formData.system_ids.length }} selected)
            </label>

            <!-- Selected Systems Pills -->
            <div
              v-if="selectedSystems.length > 0"
              class="flex flex-wrap gap-2 mb-3"
            >
              <div
                v-for="system in selectedSystems"
                :key="system.id"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-full"
              >
                <span>{{ system.system_name }}</span>
                <button
                  type="button"
                  @click="removeSystem(system.id)"
                  class="hover:bg-gray-800 rounded-full p-0.5 transition-colors"
                >
                  <X class="h-3 w-3" />
                </button>
              </div>
            </div>

            <!-- System Search Input -->
            <div class="mb-2">
              <input
                v-model="systemSearchQuery"
                type="text"
                placeholder="Search systems by name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <!-- System Checkboxes (Filtered) -->
            <div
              class="border border-gray-300 rounded-md max-h-64 overflow-y-auto"
            >
              <!-- No Results Message -->
              <div
                v-if="filteredSystems.length === 0"
                class="px-4 py-8 text-center text-sm text-gray-500"
              >
                No systems found matching "{{ systemSearchQuery }}"
              </div>

              <!-- System List -->
              <div
                v-for="system in filteredSystems"
                :key="system.id"
                class="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <label class="flex items-start gap-3 px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="isSystemSelected(system.id)"
                    @change="toggleSystemSelection(system.id)"
                    class="mt-0.5 h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">
                      {{ system.system_name }}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Results Counter -->
            <p class="mt-2 text-xs text-gray-500">
              Showing {{ filteredSystems.length }} of {{ systems.length }}
              systems
            </p>
          </div>

          <!-- Expiry Date -->
          <div>
            <label
              for="add-expiry"
              class="block text-sm font-medium text-gray-900 mb-1"
            >
              <div class="flex items-center gap-1">
                <Calendar class="h-4 w-4" />
                <span>Expiry Date *</span>
              </div>
            </label>
            <input
              id="add-expiry"
              v-model="formData.date_time_expiry"
              type="date"
              required
              :min="new Date().toISOString().split('T')[0]"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p class="mt-1 text-xs text-gray-500">
              Set when the user's access to selected systems will expire
            </p>
          </div>

          <!-- Modal Footer -->
          <div class="flex gap-2 sm:gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              @click="closeAddModal"
              :disabled="submitting"
              class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
              {{ submitting ? "Assigning..." : "Assign Systems" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Permission Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4 sticky top-0 bg-white z-10">
          <h2 class="text-lg font-semibold text-gray-900">Edit Permission</h2>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <!-- Modal Body -->
        <form
          @submit.prevent="updatePermission"
          class="px-4 sm:px-6 py-4 space-y-4"
        >
          <!-- User (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">
              User
            </label>
            <div
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700"
            >
              {{ getUserName(selectedPermission?.user_id) }}
            </div>
          </div>

          <!-- System Selection with Search -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">
              Select Systems * ({{ formData.system_ids.length }} selected)
            </label>

            <!-- Selected Systems Pills -->
            <div
              v-if="selectedSystems.length > 0"
              class="flex flex-wrap gap-2 mb-3"
            >
              <div
                v-for="system in selectedSystems"
                :key="system.id"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-full"
              >
                <span>{{ system.system_name }}</span>
                <button
                  type="button"
                  @click="removeSystem(system.id)"
                  class="hover:bg-gray-800 rounded-full p-0.5 transition-colors"
                >
                  <X class="h-3 w-3" />
                </button>
              </div>
            </div>

            <!-- System Search Input -->
            <div class="mb-2">
              <input
                v-model="systemSearchQuery"
                type="text"
                placeholder="Search systems by name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <!-- System Checkboxes -->
            <div
              class="border border-gray-300 rounded-md max-h-64 overflow-y-auto"
            >
              <div
                v-for="system in filteredSystems"
                :key="system.id"
                class="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <label class="flex items-start gap-3 px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="isSystemSelected(system.id)"
                    @change="toggleSystemSelection(system.id)"
                    class="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">
                      {{ system.system_name }}
                    </div>
                    <p v-if="system.code" class="text-xs text-gray-500 mt-0.5">
                      {{ system.code }}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Results Counter -->
            <p class="mt-2 text-xs text-gray-500">
              Showing {{ filteredSystems.length }} of {{ systems.length }}
              systems
            </p>
          </div>

          <!-- Expiry Date -->
          <div>
            <label
              for="edit-expiry"
              class="block text-sm font-medium text-gray-900 mb-1"
            >
              <div class="flex items-center gap-1">
                <Calendar class="h-4 w-4" />
                <span>Expiry Date *</span>
              </div>
            </label>
            <input
              id="edit-expiry"
              v-model="formData.date_time_expiry"
              type="date"
              required
              :min="new Date().toISOString().split('T')[0]"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Modal Footer -->
          <div class="flex gap-2 sm:gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              @click="closeEditModal"
              :disabled="submitting"
              class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
              {{ submitting ? "Updating..." : "Update Permission" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Permission Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Delete Permission</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-4 sm:px-6 py-4">
          <p class="text-sm text-gray-600">
            Are you sure you want to delete all system permissions for this
            user? This action cannot be undone.
          </p>
          <p
            v-if="selectedPermission"
            class="mt-4 text-sm font-medium text-gray-900"
          >
            User:
            {{
              selectedPermission.user_name ||
              getUserName(selectedPermission.user_id)
            }}
          </p>
          <div
            v-if="selectedPermission && selectedPermission.systems"
            class="mt-3 flex flex-wrap gap-2"
          >
            <span
              v-for="system in selectedPermission.systems"
              :key="system.id"
              class="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 text-xs rounded-full"
            >
              {{ system.system_name }}
            </span>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="border-t px-4 sm:px-6 py-4 bg-gray-50 flex gap-2 sm:gap-3 justify-end"
        >
          <button
            @click="closeDeleteModal"
            :disabled="submitting"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="deletePermission"
            :disabled="submitting"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

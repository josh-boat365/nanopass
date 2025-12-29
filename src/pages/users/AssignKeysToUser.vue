<script setup>
import { ref, onMounted, computed } from "vue";
import {
  Trash2,
  Edit2,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
} from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/composables/useToast";

const userStore = useUserStore();
const { users, loading } = storeToRefs(userStore);
const { success, error: showError } = useToast();

// State management
const showAssignModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedUser = ref(null);
const selectedPermission = ref(null);
const searchQuery = ref("");
const submitting = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 100];

// Mock data - replace with actual API calls
const systems = ref([
  { id: 1, name: "HR Management System", code: "HRM-001" },
  { id: 2, name: "Financial System", code: "FIN-002" },
  { id: 3, name: "Inventory System", code: "INV-003" },
  { id: 4, name: "CRM System", code: "CRM-004" },
  { id: 5, name: "Project Management", code: "PM-005" },
]);

const permissions = ref([
  {
    id: 1,
    user_id: 1,
    user: { id: 1, username: "john_doe", email: "john@example.com" },
    system_id: 1,
    system: { id: 1, name: "HR Management System", code: "HRM-001" },
    date_time_expiry: "2025-12-31T23:59:59",
    created_at: "2024-01-15T10:30:00",
  },
  {
    id: 2,
    user_id: 1,
    user: { id: 1, username: "john_doe", email: "john@example.com" },
    system_id: 2,
    system: { id: 2, name: "Financial System", code: "FIN-002" },
    date_time_expiry: "2025-06-30T23:59:59",
    created_at: "2024-01-15T10:30:00",
  },
  {
    id: 3,
    user_id: 2,
    user: { id: 2, username: "jane_smith", email: "jane@example.com" },
    system_id: 3,
    system: { id: 3, name: "Inventory System", code: "INV-003" },
    date_time_expiry: "2025-09-15T23:59:59",
    created_at: "2024-02-01T14:20:00",
  },
]);

// Form data
const formData = ref({
  user_id: null,
  system_ids: [],
  date_time_expiry: "",
});

// Load data on component mount
onMounted(async () => {
  await loadUsers();
  // TODO: Load systems and permissions from API
  // await loadSystems();
  // await loadPermissions();
});

const loadUsers = async () => {
  try {
    await userStore.getAllUsers();
  } catch (err) {
    console.error("Error loading users:", err);
    showError("Failed to load users.");
  }
};

// Computed filtered permissions based on search
const filteredPermissions = computed(() => {
  if (!searchQuery.value.trim()) {
    return permissions.value;
  }
  const query = searchQuery.value.toLowerCase();
  return permissions.value.filter(
    (permission) =>
      permission.user?.username?.toLowerCase().includes(query) ||
      permission.user?.email?.toLowerCase().includes(query) ||
      permission.system?.name?.toLowerCase().includes(query) ||
      permission.system?.code?.toLowerCase().includes(query)
  );
});

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredPermissions.value.length / itemsPerPage.value);
});

// Computed: Paginated permissions
const paginatedPermissions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredPermissions.value.slice(start, end);
});

// Computed: Pagination info
const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    filteredPermissions.value.length
  );
  return `${start}-${end} of ${filteredPermissions.value.length}`;
});

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

// Open Assign Modal
const openAssignModal = () => {
  formData.value = {
    user_id: null,
    system_ids: [],
    date_time_expiry: "",
  };
  showAssignModal.value = true;
};

// Add search state for systems
const systemSearchQuery = ref("");

// Add computed filtered systems
const filteredSystems = computed(() => {
  if (!systemSearchQuery.value.trim()) {
    return systems.value;
  }
  const query = systemSearchQuery.value.toLowerCase();
  return systems.value.filter(
    (system) =>
      system.name?.toLowerCase().includes(query) ||
      system.code?.toLowerCase().includes(query)
  );
});

// Modify closeAssignModal to reset search
const closeAssignModal = () => {
  showAssignModal.value = false;
  systemSearchQuery.value = ""; // Reset search
  formData.value = {
    user_id: null,
    system_ids: [],
    date_time_expiry: "",
  };
};

// Open Edit Modal
const openEditModal = (permission) => {
  selectedPermission.value = permission;
  formData.value = {
    user_id: permission.user_id,
    system_ids: [permission.system_id],
    date_time_expiry: permission.date_time_expiry.split("T")[0],
  };
  showEditModal.value = true;
};

// Close Edit Modal
const closeEditModal = () => {
  showEditModal.value = false;
  selectedPermission.value = null;
  formData.value = {
    user_id: null,
    system_ids: [],
    date_time_expiry: "",
  };
};

// Open Delete Modal
const openDeleteModal = (permission) => {
  selectedPermission.value = permission;
  showDeleteModal.value = true;
};

// Close Delete Modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedPermission.value = null;
};

// Toggle system selection
const toggleSystemSelection = (systemId) => {
  const index = formData.value.system_ids.indexOf(systemId);
  if (index > -1) {
    formData.value.system_ids.splice(index, 1);
  } else {
    formData.value.system_ids.push(systemId);
  }
};

// Check if system is selected
const isSystemSelected = (systemId) => {
  return formData.value.system_ids.includes(systemId);
};

// Remove system from selection
const removeSystem = (systemId) => {
  const index = formData.value.system_ids.indexOf(systemId);
  if (index > -1) {
    formData.value.system_ids.splice(index, 1);
  }
};

// Get selected systems
const selectedSystems = computed(() => {
  return systems.value.filter((system) =>
    formData.value.system_ids.includes(system.id)
  );
});

// Validate form
const validateForm = () => {
  if (!formData.value.user_id) {
    return "Please select a user";
  }
  if (formData.value.system_ids.length === 0) {
    return "Please select at least one system";
  }
  if (!formData.value.date_time_expiry) {
    return "Please select an expiry date";
  }
  return null;
};

// Assign Systems
const assignSystems = async () => {
  const validationError = validateForm();
  if (validationError) {
    showError(validationError);
    return;
  }

  try {
    submitting.value = true;

    // TODO: Replace with actual API call
    // await permissionStore.assignSystems(formData.value);

    // Mock success - Add new permissions to the list
    formData.value.system_ids.forEach((systemId) => {
      const newPermission = {
        id: permissions.value.length + 1,
        user_id: formData.value.user_id,
        user: users.value.find((u) => u.id === formData.value.user_id),
        system_id: systemId,
        system: systems.value.find((s) => s.id === systemId),
        date_time_expiry: formData.value.date_time_expiry + "T23:59:59",
        created_at: new Date().toISOString(),
      };
      permissions.value.push(newPermission);
    });

    success(
      `Successfully assigned ${formData.value.system_ids.length} system(s) to user!`
    );

    setTimeout(() => {
      closeAssignModal();
    }, 1500);
  } catch (err) {
    showError(err.message || "Failed to assign systems");
  } finally {
    submitting.value = false;
  }
};

// Update Permission
const updatePermission = async () => {
  if (!formData.value.date_time_expiry) {
    showError("Please select an expiry date");
    return;
  }

  if (!selectedPermission.value) return;

  try {
    submitting.value = true;

    // TODO: Replace with actual API call
    // await permissionStore.updatePermission(selectedPermission.value.id, formData.value);

    // Mock success - Update in the list
    const index = permissions.value.findIndex(
      (p) => p.id === selectedPermission.value.id
    );
    if (index !== -1) {
      permissions.value[index].date_time_expiry =
        formData.value.date_time_expiry + "T23:59:59";
    }

    success("Permission updated successfully!");

    setTimeout(() => {
      closeEditModal();
    }, 1500);
  } catch (err) {
    showError(err.message || "Failed to update permission");
  } finally {
    submitting.value = false;
  }
};

// Delete Permission
const deletePermission = async () => {
  if (!selectedPermission.value) return;

  try {
    submitting.value = true;

    // TODO: Replace with actual API call
    // await permissionStore.deletePermission(selectedPermission.value.id);

    // Mock success - Remove from the list
    const index = permissions.value.findIndex(
      (p) => p.id === selectedPermission.value.id
    );
    if (index !== -1) {
      permissions.value.splice(index, 1);
    }

    success("Permission removed successfully!");

    setTimeout(() => {
      closeDeleteModal();
    }, 1000);
  } catch (err) {
    showError(err.message || "Failed to remove permission");
  } finally {
    submitting.value = false;
  }
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Check if permission is expired
const isExpired = (dateString) => {
  return new Date(dateString) < new Date();
};

// Get user display name
const getUserDisplayName = (user) => {
  return user?.username || user?.email || "Unknown User";
};

// Get system name
const getSystemName = (system) => {
  return system?.name || "Unknown System";
};
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            System Permissions
          </h1>
          <p class="text-gray-600 text-xs sm:text-sm mt-1">
            Assign and manage system access for users with expiry dates.
          </p>
        </div>
        <button
          @click="openAssignModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 whitespace-nowrap"
        >
          <UserPlus class="h-4 w-4" />
          Assign Systems
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
            placeholder="Search by user, email, system name, or code..."
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
      <div
        v-if="loading && !submitting"
        class="flex items-center justify-center py-12"
      >
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
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  System
                </th>
                <th
                  class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  System Code
                </th>
                <th
                  class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Expiry Date
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
                v-for="permission in paginatedPermissions"
                :key="permission.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4 text-sm">
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900">{{
                      getUserDisplayName(permission.user)
                    }}</span>
                    <span class="text-xs text-gray-500">{{
                      permission.user?.email
                    }}</span>
                    <span class="text-xs text-gray-500 md:hidden mt-1">
                      {{ getSystemName(permission.system) }}
                    </span>
                  </div>
                </td>
                <td
                  class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-900"
                >
                  {{ getSystemName(permission.system) }}
                </td>
                <td
                  class="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                >
                  {{ permission.system?.code }}
                </td>
                <td class="px-4 sm:px-6 py-4 text-sm">
                  <div class="flex flex-col">
                    <span
                      :class="[
                        'font-medium',
                        isExpired(permission.date_time_expiry)
                          ? 'text-red-600'
                          : 'text-gray-900',
                      ]"
                    >
                      {{ formatDate(permission.date_time_expiry) }}
                    </span>
                    <span
                      v-if="isExpired(permission.date_time_expiry)"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1 w-fit"
                    >
                      Expired
                    </span>
                  </div>
                </td>
                <td class="px-4 sm:px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1 sm:gap-2">
                    <button
                      @click="openEditModal(permission)"
                      class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit2 class="h-4 w-4" />
                      <span class="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      @click="openDeleteModal(permission)"
                      class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 class="h-4 w-4" />
                      <span class="hidden sm:inline">Remove</span>
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
          <p class="text-gray-500 text-xs sm:text-sm">
            {{
              searchQuery.trim()
                ? "No permissions match your search."
                : "No permissions assigned yet. Assign systems to users to get started."
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Assign Systems Modal -->
    <div
    v-if="showAssignModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
  >
    <div
      class="relative w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
    >
      <!-- Modal Header -->
      <div class="border-b px-4 sm:px-6 py-4 sticky top-0 bg-white z-10">
        <h2 class="text-lg font-semibold text-gray-900">Assign Systems to User</h2>
      </div>

      <!-- Modal Body -->
      <form @submit.prevent="assignSystems" class="px-4 sm:px-6 py-4 space-y-4">
        <!-- User Selection -->
        <div>
          <label
            for="assign-user"
            class="block text-sm font-medium text-gray-900 mb-1"
          >
            Select User *
          </label>
          <select
            id="assign-user"
            v-model="formData.user_id"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option :value="null" disabled>Choose a user...</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.username }} ({{ user.email }})
            </option>
          </select>
        </div>

        <!-- System Selection with Search -->
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">
            Select Systems * ({{ formData.system_ids.length }} selected)
          </label>
          
          <!-- Selected Systems Pills -->
          <div v-if="selectedSystems.length > 0" class="flex flex-wrap gap-2 mb-3">
            <div
              v-for="system in selectedSystems"
              :key="system.id"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-full"
            >
              <span>{{ system.name }}</span>
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
              placeholder="Search systems by name or code..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- System Checkboxes (Filtered) -->
          <div class="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
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
              <label
                class="flex items-start gap-3 px-4 py-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="isSystemSelected(system.id)"
                  @change="toggleSystemSelection(system.id)"
                  class="mt-0.5 h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">
                    {{ system.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    Code: {{ system.code }}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Results Counter -->
          <p class="mt-2 text-xs text-gray-500">
            Showing {{ filteredSystems.length }} of {{ systems.length }} systems
          </p>
        </div>

        <!-- Expiry Date -->
        <div>
          <label
            for="assign-expiry"
            class="block text-sm font-medium text-gray-900 mb-1"
          >
            <div class="flex items-center gap-1">
              <Calendar class="h-4 w-4" />
              <span>Expiry Date *</span>
            </div>
          </label>
          <input
            id="assign-expiry"
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
            @click="closeAssignModal"
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
              {{ getUserDisplayName(selectedPermission?.user) }}
            </div>
          </div>

          <!-- System (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">
              System
            </label>
            <div
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700"
            >
              {{ getSystemName(selectedPermission?.system) }}
            </div>
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
              {{ submitting ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Remove Permission</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-4 sm:px-6 py-4">
          <p class="text-xs sm:text-sm text-gray-600">
            Are you sure you want to remove
            <span class="font-semibold text-gray-900">{{
              getUserDisplayName(selectedPermission?.user)
            }}</span
            >'s access to
            <span class="font-semibold text-gray-900">{{
              getSystemName(selectedPermission?.system)
            }}</span
            >? This action cannot be undone.
          </p>
        </div>

        <!-- Modal Footer -->
        <div class="border-t px-4 sm:px-6 py-4 flex gap-2 sm:gap-3 justify-end">
          <button
            @click="closeDeleteModal"
            :disabled="submitting"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="deletePermission"
            :disabled="submitting"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Removing..." : "Remove" }}
          </button>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

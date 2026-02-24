<script setup>
import { ref, onMounted, computed } from "vue";
import {
  Trash2,
  Edit2,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle,
} from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/composables/useToast";

const userStore = useUserStore();
const { user, users, loading, error } = storeToRefs(userStore);
const { success, error: showError } = useToast();

// State management
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showTransferAdminModal = ref(false);
const showPasswordFields = ref({});
const selectedUser = ref(null);
const searchQuery = ref("");
const submitting = ref(false);
const successMessage = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 100];

// Admin transfer state
const currentAdmin = ref(null);
const selectedNewAdmin = ref(null);
const transferringAdmin = ref(false);

// Form data
const formData = ref({
  firstName: "",
  surname: "",
  email: "",
  username: "",
  empRole: "",
  password: "",
  password_confirmation: "",
});

// Load users on component mount
onMounted(async () => {
  await loadUsers();
  await loadCurrentAdmin();
});

// Load all users
const loadUsers = async () => {
  try {
    await userStore.getAllUsers();
  } catch (err) {
    console.error("Error loading users:", err);
    // Gracefully handle errors - show toast but don't crash
    if (err.status === 401) {
      showError("You are not authenticated. Please login again.");
    } else if (err.status === 403) {
      showError("You do not have permission to view users.");
    } else {
      showError("Failed to load users. Please try again later.");
    }
  }
};

// Load current admin
const loadCurrentAdmin = async () => {
  try {
    const response = await userStore.getCurrentAdmin();
    currentAdmin.value = response.admin || null;
  } catch (err) {
    console.error("Error loading current admin:", err);
  }
};

// Computed filtered users based on search
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value;
  }
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(
    (u) =>
      u.firstName?.toLowerCase().includes(query) ||
      u.surname?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.empRole?.toLowerCase().includes(query),
  );
});

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage.value);
});

// Computed: Paginated users
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredUsers.value.slice(start, end);
});

// Computed: Pagination info
const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    filteredUsers.value.length,
  );
  return `${start}-${end} of ${filteredUsers.value.length}`;
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

// Toggle password visibility
const togglePasswordVisibility = (userId) => {
  showPasswordFields.value[userId] = !showPasswordFields.value[userId];
};

// Open Add Modal
const openAddModal = () => {
  formData.value = {
    firstName: "",
    surname: "",
    email: "",
    username: "",
    empRole: "",
    password: "",
    password_confirmation: "",
  };
  successMessage.value = "";
  userStore.clearError();
  showAddModal.value = true;
};

// Close Add Modal
const closeAddModal = () => {
  showAddModal.value = false;
  formData.value = {
    firstName: "",
    surname: "",
    email: "",
    username: "",
    empRole: "",
    password: "",
    password_confirmation: "",
  };
  successMessage.value = "";
  userStore.clearError();
};

// Open Edit Modal
const openEditModal = async (userToEdit) => {
  try {
    const userData = await userStore.getUserById(userToEdit.id);

    selectedUser.value = userData;
    formData.value = {
      firstName: userData.firstName || "",
      surname: userData.surname || "",
      email: userData.email || "",
      username: userData.username || "",
      empRole: userData.empRole || "",
      password: "",
      password_confirmation: "",
    };
    successMessage.value = "";
    userStore.clearError();
    showEditModal.value = true;
  } catch (err) {
    console.error("Error loading user:", err);
  }
};

// Close Edit Modal
const closeEditModal = () => {
  showEditModal.value = false;
  selectedUser.value = null;
  formData.value = {
    firstName: "",
    surname: "",
    email: "",
    username: "",
    empRole: "",
    password: "",
    password_confirmation: "",
  };
  successMessage.value = "";
  userStore.clearError();
};

// Open Delete Modal
const openDeleteModal = (userToDelete) => {
  selectedUser.value = userToDelete;
  successMessage.value = "";
  userStore.clearError();
  showDeleteModal.value = true;
};

// Close Delete Modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedUser.value = null;
  successMessage.value = "";
  userStore.clearError();
};

// Validate form
const validateForm = () => {
  if (!formData.value.firstName.trim()) {
    return "First name is required";
  }
  if (!formData.value.surname.trim()) {
    return "Surname is required";
  }
  if (!formData.value.email.trim()) {
    return "Email is required";
  }
  if (!formData.value.username.trim()) {
    return "Username is required";
  }
  if (!showEditModal.value && !formData.value.password.trim()) {
    return "Password is required";
  }
  if (
    formData.value.password &&
    formData.value.password !== formData.value.password_confirmation
  ) {
    return "Passwords do not match";
  }
  if (formData.value.password && formData.value.password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

// Add User
const addUser = async () => {
  const validationError = validateForm();
  if (validationError) {
    showError(validationError);
    return;
  }

  try {
    submitting.value = true;
    userStore.clearError();

    const userData = {
      firstName: formData.value.firstName,
      surname: formData.value.surname,
      email: formData.value.email,
      username: formData.value.username,
      empRole: formData.value.empRole,
      password: formData.value.password,
      password_confirmation: formData.value.password_confirmation,
    };

    await userStore.createUser(userData);
    success("User created successfully!");
    await loadUsers();

    setTimeout(() => {
      closeAddModal();
    }, 1500);
  } catch (err) {
    showError(err.message || "Failed to create user");
  } finally {
    submitting.value = false;
  }
};

// Update User
const updateUser = async () => {
  const validationError = validateForm();
  if (validationError) {
    showError(validationError);
    return;
  }

  if (!selectedUser.value) return;

  try {
    submitting.value = true;
    userStore.clearError();

    const userData = {
      firstName: formData.value.firstName,
      surname: formData.value.surname,
      email: formData.value.email,
      username: formData.value.username,
      empRole: formData.value.empRole,
    };

    if (formData.value.password.trim()) {
      userData.password = formData.value.password;
      userData.password_confirmation = formData.value.password_confirmation;
    }

    await userStore.updateUser(selectedUser.value.id, userData);
    success("User updated successfully!");
    await loadUsers();

    setTimeout(() => {
      closeEditModal();
    }, 1500);
  } catch (err) {
    showError(err.message || "Failed to update user");
  } finally {
    submitting.value = false;
  }
};

// Delete User
const deleteUser = async () => {
  if (!selectedUser.value) return;

  try {
    submitting.value = true;
    userStore.clearError();

    await userStore.deleteUser(selectedUser.value.id);
    success("User deleted successfully!");

    setTimeout(() => {
      closeDeleteModal();
    }, 1000);
  } catch (err) {
    showError(err.message || "Failed to delete user");
  } finally {
    submitting.value = false;
  }
};

// Mask password for display (not needed since passwords aren't displayed in list)
const maskPassword = (password) => {
  return password ? "*".repeat(Math.max(password.length, 3)) : "";
};

// Get admin badge color
const getAdminBadgeColor = (isAdmin) => {
  return isAdmin ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
};

// Get user display name (full name)
const getUserDisplayName = (user) => {
  const fullName = `${user.firstName || ""} ${user.surname || ""}`.trim();
  return fullName || user.username || user.email;
};

// ========================================
// ADMIN TRANSFER FUNCTIONS
// ========================================

// Computed: Non-admin users for transfer selection
const nonAdminUsers = computed(() => {
  return users.value.filter((u) => !u.admin && u.id !== user.value?.id);
});

// Open Transfer Admin Modal
const openTransferAdminModal = () => {
  selectedNewAdmin.value = null;
  showTransferAdminModal.value = true;
};

// Close Transfer Admin Modal
const closeTransferAdminModal = () => {
  showTransferAdminModal.value = false;
  selectedNewAdmin.value = null;
};

// Transfer Admin Privileges
const handleTransferAdmin = async () => {
  if (!selectedNewAdmin.value) {
    showError("Please select a user to transfer admin privileges to.");
    return;
  }

  try {
    transferringAdmin.value = true;
    const result = await userStore.transferAdmin(selectedNewAdmin.value);

    // Show success message
    success(
      `Admin privileges transferred successfully to ${result.new_admin.username}. You will be logged out.`,
    );

    // CRITICAL: If server logged out the user, do a hard redirect to prevent loops
    if (result.logged_out) {
      // Small delay to show success message
      setTimeout(() => {
        // Use window.location.href for hard redirect (clears all Vue state)
        window.location.href =
          import.meta.env.BASE_URL.replace(/\/$/, "") + "/login";
      }, 1500);
      return; // Don't continue execution
    }

    // Fallback: If logged_out not in response, still redirect for safety
    closeTransferAdminModal();
    setTimeout(() => {
      window.location.href =
        import.meta.env.BASE_URL.replace(/\/$/, "") + "/login";
    }, 1500);
  } catch (err) {
    showError(err.message || "Failed to transfer admin privileges");
    transferringAdmin.value = false;
  }
  // Note: Don't set transferringAdmin to false on success - page will redirect
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
            User Management
          </h1>
          <p class="text-gray-600 text-xs sm:text-sm mt-1">
            Manage application users, privileges, and system assignments.
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="user?.admin"
            @click="openTransferAdminModal"
            class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 whitespace-nowrap"
          >
            <Shield class="h-4 w-4" />
            Transfer Admin
          </button>
          <button
            @click="openAddModal"
            class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 whitespace-nowrap"
          >
            <Plus class="h-4 w-4" />
            Create User
          </button>
        </div>
      </div>

      <!-- Global Error Message -->
      <div
        v-if="error && !showAddModal && !showEditModal && !showDeleteModal"
        class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
      >
        <p class="text-sm text-red-600">{{ error }}</p>
        <button
          @click="userStore.clearError()"
          class="mt-2 text-xs text-red-600 underline"
        >
          Dismiss
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
            placeholder="Search by name, email, username, or role..."
            class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div class="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          {{ filteredUsers.length }} result{{
            filteredUsers.length !== 1 ? "s" : ""
          }}
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading && !submitting"
        class="flex items-center justify-center py-12"
      >
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
        <span class="ml-2 text-gray-600">Loading users...</span>
      </div>

      <!-- Users Table -->
      <div v-else class="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-gray-50">
                <th
                  class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Name
                </th>
                <th
                  class="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Email
                </th>
                <th
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Role
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
                v-for="user in paginatedUsers"
                :key="user.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                  <div class="flex flex-col">
                    <span>{{ getUserDisplayName(user) }}</span>
                    <span class="text-xs text-gray-500 sm:hidden">{{
                      user.email
                    }}</span>
                  </div>
                </td>
                <td
                  class="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                >
                  {{ user.email }}
                </td>
                <td class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm">
                  <span
                    v-if="user.empRole"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ user.empRole }}
                  </span>
                  <span v-else class="text-gray-400 text-xs"
                    >Not specified</span
                  >
                </td>
                <td class="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.admin
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800',
                    ]"
                  >
                    {{ user.admin ? "Admin" : "User" }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1 sm:gap-2">
                    <button
                      @click="openEditModal(user)"
                      class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit2 class="h-4 w-4" />
                      <span class="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      @click="openDeleteModal(user)"
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
          v-if="filteredUsers.length === 0"
          class="px-4 sm:px-6 py-12 text-center"
        >
          <p class="text-gray-500 text-xs sm:text-sm">
            {{
              searchQuery.trim()
                ? "No users match your search."
                : "No users found. Create your first user."
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4 sticky top-0 bg-white">
          <h2 class="text-lg font-semibold text-gray-900">Create User</h2>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <!-- Success Message -->
        <div
          v-if="successMessage"
          class="mx-4 sm:mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <p class="text-sm text-green-600">{{ successMessage }}</p>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="addUser" class="px-4 sm:px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="add-firstName"
                class="block text-sm font-medium text-gray-900 mb-1"
                >First Name *</label
              >
              <input
                id="add-firstName"
                v-model="formData.firstName"
                type="text"
                placeholder="Enter first name"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label
                for="add-surname"
                class="block text-sm font-medium text-gray-900 mb-1"
                >Surname *</label
              >
              <input
                id="add-surname"
                v-model="formData.surname"
                type="text"
                placeholder="Enter surname"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label
              for="add-username"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Username *</label
            >
            <input
              id="add-username"
              v-model="formData.username"
              type="text"
              placeholder="Enter username or email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="add-email"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Email *</label
            >
            <input
              id="add-email"
              v-model="formData.email"
              type="email"
              placeholder="Enter email address"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="add-empRole"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Employee Role</label
            >
            <input
              id="add-empRole"
              v-model="formData.empRole"
              type="text"
              placeholder="e.g., IT System Developer"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="add-password"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Password *</label
            >
            <input
              id="add-password"
              v-model="formData.password"
              type="password"
              placeholder="Enter a strong password (min 6 characters)"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="add-password-confirmation"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Confirm Password *</label
            >
            <input
              id="add-password-confirmation"
              v-model="formData.password_confirmation"
              type="password"
              placeholder="Re-enter password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Modal Footer -->
          <div class="flex gap-2 sm:gap-3 justify-end pt-4">
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
              {{ submitting ? "Creating..." : "Create User" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4 sticky top-0 bg-white">
          <h2 class="text-lg font-semibold text-gray-900">Edit User</h2>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <!-- Success Message -->
        <div
          v-if="successMessage"
          class="mx-4 sm:mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <p class="text-sm text-green-600">{{ successMessage }}</p>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="updateUser" class="px-4 sm:px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="edit-firstName"
                class="block text-sm font-medium text-gray-900 mb-1"
                >First Name *</label
              >
              <input
                id="edit-firstName"
                v-model="formData.firstName"
                type="text"
                placeholder="Enter first name"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label
                for="edit-surname"
                class="block text-sm font-medium text-gray-900 mb-1"
                >Surname *</label
              >
              <input
                id="edit-surname"
                v-model="formData.surname"
                type="text"
                placeholder="Enter surname"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label
              for="edit-username"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Username *</label
            >
            <input
              id="edit-username"
              v-model="formData.username"
              type="text"
              placeholder="Enter username or email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="edit-email"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Email *</label
            >
            <input
              id="edit-email"
              v-model="formData.email"
              type="email"
              placeholder="Enter email address"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="edit-empRole"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Employee Role</label
            >
            <input
              id="edit-empRole"
              v-model="formData.empRole"
              type="text"
              placeholder="e.g., IT System Developer"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="edit-password"
              class="block text-sm font-medium text-gray-900 mb-1"
              >New Password (leave blank to keep current)</label
            >
            <input
              id="edit-password"
              v-model="formData.password"
              type="password"
              placeholder="Enter new password (optional)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="edit-password-confirmation"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Confirm New Password</label
            >
            <input
              id="edit-password-confirmation"
              v-model="formData.password_confirmation"
              type="password"
              placeholder="Re-enter new password"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Admin Status Info -->
          <div
            v-if="selectedUser?.admin"
            class="p-3 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <Shield class="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p class="text-xs text-amber-800">
                This user is the current admin. Admin privileges can only be
                transferred using the "Transfer Admin" feature.
              </p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex gap-2 sm:gap-3 justify-end pt-4">
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4"
    >
      <div
        class="relative w-full max-w-xs sm:max-w-md rounded-lg bg-white shadow-xl"
      >
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Delete User</h2>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <!-- Success Message -->
        <div
          v-if="successMessage"
          class="mx-4 sm:mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <p class="text-sm text-green-600">{{ successMessage }}</p>
        </div>

        <!-- Modal Body -->
        <div class="px-4 sm:px-6 py-4">
          <p class="text-xs sm:text-sm text-gray-600">
            Are you sure you want to delete
            <span class="font-semibold text-gray-900">{{
              getUserDisplayName(selectedUser)
            }}</span
            >? This action cannot be undone.
          </p>
        </div>

        <!-- Modal Footer -->
        <div
          class="border-t px-2 sm:px-4 md:px-6 py-4 flex gap-2 sm:gap-3 justify-end flex-wrap"
        >
          <button
            @click="closeDeleteModal"
            :disabled="submitting"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="deleteUser"
            :disabled="submitting"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Transfer Admin Modal -->
    <div
      v-if="showTransferAdminModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4"
    >
      <div
        class="relative w-full max-w-xs sm:max-w-md rounded-lg bg-white shadow-xl"
      >
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4">
          <h2
            class="text-lg font-semibold text-gray-900 flex items-center gap-2"
          >
            <Shield class="h-5 w-5 text-amber-600" />
            Transfer Admin Privileges
          </h2>
        </div>

        <!-- Warning Message -->
        <div
          class="mx-2 sm:mx-4 md:mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div class="flex items-start gap-2">
            <AlertTriangle class="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p class="text-sm font-medium text-amber-800">Warning</p>
              <p class="text-xs text-amber-700 mt-1">
                You will be demoted to a regular user,
                <strong>logged out immediately</strong>, and will need to log in
                again. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <!-- Current Admin Info -->
        <div
          class="mx-2 sm:mx-4 md:mx-6 mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg"
        >
          <p class="text-xs text-gray-500 mb-1">Current Admin</p>
          <p class="text-sm font-medium text-gray-900">
            {{ currentAdmin?.username || user?.username }} ({{
              currentAdmin?.email || user?.email
            }})
          </p>
        </div>

        <!-- Modal Body -->
        <div class="px-2 sm:px-4 md:px-6 py-4">
          <label class="block text-sm font-medium text-gray-900 mb-2">
            Select New Admin *
          </label>
          <select
            v-model="selectedNewAdmin"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option :value="null">Select a user</option>
            <option v-for="u in nonAdminUsers" :key="u.id" :value="u.id">
              {{ u.username }} ({{ u.email }})
            </option>
          </select>
          <p class="mt-2 text-xs text-gray-500">
            Only non-admin users are shown. The selected user will become the
            new system administrator.
          </p>
        </div>

        <!-- Modal Footer -->
        <div
          class="border-t px-2 sm:px-4 md:px-6 py-4 flex gap-2 sm:gap-3 justify-end flex-wrap"
        >
          <button
            @click="closeTransferAdminModal"
            :disabled="transferringAdmin"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="handleTransferAdmin"
            :disabled="transferringAdmin || !selectedNewAdmin"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Loader2 v-if="transferringAdmin" class="h-4 w-4 animate-spin" />
            {{ transferringAdmin ? "Transferring..." : "Transfer Admin" }}
          </button>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

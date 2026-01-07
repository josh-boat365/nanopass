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
} from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore";
import { useDepartmentStore } from "@/stores/useDepartmentStore";
import { useToast } from "@/composables/useToast";

const userStore = useUserStore();
const departmentStore = useDepartmentStore();
const { user, users, loading, error } = storeToRefs(userStore);
const { departments } = storeToRefs(departmentStore);
const { success, error: showError } = useToast();

// State management
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showPasswordFields = ref({});
const selectedUser = ref(null);
const searchQuery = ref("");
const submitting = ref(false);
const successMessage = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 100];

// Form data
const formData = ref({
  username: "",
  email: "",
  password: "",
  password_confirmation: "",
  department_id: null,
  admin: false,
});

// Load users on component mount
onMounted(async () => {
  await loadUsers();
  await loadDepartments();
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

// Load all departments
const loadDepartments = async () => {
  try {
    await departmentStore.getAllDepartments();
  } catch (err) {
    console.error("Error loading departments:", err);
  }
};

// Computed filtered users based on search
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value;
  }
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(
    (user) =>
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
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
    filteredUsers.value.length
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
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
    department_id: null,
    admin: false,
  };
  successMessage.value = "";
  userStore.clearError();
  showAddModal.value = true;
};

// Close Add Modal
const closeAddModal = () => {
  showAddModal.value = false;
  formData.value = {
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
    department_id: null,
    admin: false,
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
      username: userData.username || "",
      email: userData.email || "",
      password: "",
      password_confirmation: "",
      department_id: userData.department_id || null,
      admin: userData.admin || false,
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
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
    department_id: null,
    admin: false,
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
  if (!formData.value.username.trim()) {
    return "Username is required";
  }
  if (!formData.value.email.trim()) {
    return "Email is required";
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
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password,
      password_confirmation: formData.value.password_confirmation,
      department_id: formData.value.department_id,
      admin: formData.value.admin,
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
      username: formData.value.username,
      email: formData.value.email,
      department_id: formData.value.department_id,
      admin: formData.value.admin,
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

// Mask password for display
const maskPassword = (password) => {
  return password ? "*".repeat(password.length) : "";
};

// Get privilege badge color
const getPrivilegeBadgeColor = (privilege) => {
  if (!privilege) return "bg-gray-100 text-gray-800";

  const privilegeLower = privilege.toLowerCase();
  if (privilegeLower === "admin") return "bg-red-100 text-red-800";
  if (privilegeLower === "editor") return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
};

// Get user display name
const getUserDisplayName = (user) => {
  return user.username || user.email;
};

// Get department name by ID
const getDepartmentName = (departmentId) => {
  if (!departmentId) return null;
  const dept = departments.value.find((d) => d.id === departmentId);
  return dept ? dept.department_name : null;
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
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 whitespace-nowrap"
        >
          <Plus class="h-4 w-4" />
          Create User
        </button>
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
            placeholder="Search users by name or email..."
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
                  Department
                </th>
                <th
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Role
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
                    v-if="getDepartmentName(user.department_id)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ getDepartmentName(user.department_id) }}
                  </span>
                  <span v-else class="text-gray-400 text-xs"
                    >No department</span
                  >
                </td>
                <td class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm">
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
              placeholder="Enter username"
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
          <div>
            <label
              for="add-department"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Department</label
            >
            <select
              id="add-department"
              v-model="formData.department_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option :value="null">Select a department</option>
              <option
                v-for="dept in departments"
                :key="dept.id"
                :value="dept.id"
              >
                {{ dept.department_name }}
              </option>
            </select>
          </div>
          <div class="flex items-center">
            <input
              id="add-admin"
              v-model="formData.admin"
              type="checkbox"
              class="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
            />
            <label for="add-admin" class="ml-2 text-sm text-gray-900">
              Admin User
            </label>
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
              placeholder="Enter username"
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
          <div>
            <label
              for="edit-department"
              class="block text-sm font-medium text-gray-900 mb-1"
              >Department</label
            >
            <select
              id="edit-department"
              v-model="formData.department_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option :value="null">Select a department</option>
              <option
                v-for="dept in departments"
                :key="dept.id"
                :value="dept.id"
              >
                {{ dept.department_name }}
              </option>
            </select>
          </div>
          <div class="flex items-center">
            <input
              id="edit-admin"
              v-model="formData.admin"
              type="checkbox"
              class="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
            />
            <label for="edit-admin" class="ml-2 text-sm text-gray-900">
              Admin User
            </label>
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
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
        <div class="border-t px-4 sm:px-6 py-4 flex gap-2 sm:gap-3 justify-end">
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
  </BaseLayout>
</template>

<script setup>
import BaseLayout from "@/layouts/AppLayout.vue";
import { ref, computed } from "vue";
import {
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Lock,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-vue-next";

const showPasswordModal = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedPassword = ref(null);
const accountPassword = ref("");
const passwordError = ref("");
const revealedPassword = ref(null);
const showPassword = ref(false);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 15;

// Form data for create/edit
const formData = ref({
  systemName: "",
  description: "",
  password: "",
});

const formErrors = ref({
  systemName: "",
  description: "",
  password: "",
});

// Sample personal keys data
const personalKeys = ref([
  {
    id: 1,
    systemName: "GitHub Account",
    description: "Personal GitHub repository access",
    password: "MyGitH@b2024!",
    createdAt: "2024-08-10",
  },
  {
    id: 2,
    systemName: "AWS Console",
    description: "AWS management console login",
    password: "AwsC0ns0le#Secure",
    createdAt: "2024-09-15",
  },
  {
    id: 3,
    systemName: "Email Account",
    description: "Personal email access credentials",
    password: "Em@il123Pass",
    createdAt: "2024-06-01",
  },
  {
    id: 4,
    systemName: "LinkedIn Profile",
    description: "LinkedIn professional account",
    password: "Link3dIn!2024",
    createdAt: "2024-06-20",
  },
]);

const maskPassword = (password) => {
  return "•".repeat(12);
};

// Computed: Filtered keys based on search
const filteredKeys = computed(() => {
  if (!searchQuery.value) {
    return personalKeys.value;
  }
  const query = searchQuery.value.toLowerCase();
  return personalKeys.value.filter(
    (key) =>
      key.systemName.toLowerCase().includes(query) ||
      key.description.toLowerCase().includes(query)
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
  showPassword.value = false;
};

const handleVerifyPassword = () => {
  // Simulate password verification (in real app, this would be an API call)
  if (accountPassword.value === "demo123") {
    passwordError.value = "";
    revealedPassword.value = selectedPassword.value;
  } else {
    passwordError.value = "Incorrect account password. Please try again.";
  }
};

const handleCloseModal = () => {
  showPasswordModal.value = false;
  showCreateModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  selectedPassword.value = null;
  accountPassword.value = "";
  passwordError.value = "";
  revealedPassword.value = null;
  showPassword.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
    systemName: "",
    description: "",
    password: "",
  };
  formErrors.value = {
    systemName: "",
    description: "",
    password: "",
  };
};

const validateForm = () => {
  let isValid = true;
  formErrors.value = {
    systemName: "",
    description: "",
    password: "",
  };

  if (!formData.value.systemName.trim()) {
    formErrors.value.systemName = "System name is required";
    isValid = false;
  }

  if (!formData.value.description.trim()) {
    formErrors.value.description = "Description is required";
    isValid = false;
  }

  if (!formData.value.password.trim()) {
    formErrors.value.password = "Password is required";
    isValid = false;
  } else if (formData.value.password.length < 8) {
    formErrors.value.password = "Password must be at least 8 characters";
    isValid = false;
  }

  return isValid;
};

const handleCreatePassword = () => {
  if (!validateForm()) return;

  const newPassword = {
    id: Date.now(),
    systemName: formData.value.systemName,
    description: formData.value.description,
    password: formData.value.password,
    createdAt: new Date().toISOString().split("T")[0],
  };

  personalKeys.value.unshift(newPassword);
  handleCloseModal();
};

const handleEditPassword = (password) => {
  selectedPassword.value = password;
  formData.value = {
    systemName: password.systemName,
    description: password.description,
    password: password.password,
  };
  showEditModal.value = true;
};

const handleUpdatePassword = () => {
  if (!validateForm()) return;

  const index = personalKeys.value.findIndex(
    (p) => p.id === selectedPassword.value.id
  );
  if (index !== -1) {
    personalKeys.value[index] = {
      ...personalKeys.value[index],
      systemName: formData.value.systemName,
      description: formData.value.description,
      password: formData.value.password,
    };
  }
  handleCloseModal();
};

const handleDeletePassword = (password) => {
  selectedPassword.value = password;
  showDeleteModal.value = true;
};

const handleConfirmDelete = () => {
  personalKeys.value = personalKeys.value.filter(
    (p) => p.id !== selectedPassword.value.id
  );
  handleCloseModal();
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

const openCreateModal = () => {
  resetForm();
  showCreateModal.value = true;
};
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          Personal Keys
        </h1>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          Manage your personal password entries securely
        </p>
      </div>

      <!-- Main Content -->
      <div class="space-y-6">
        <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
          <!-- Header with Search and Create Button -->
          <div class="border-b bg-gray-50 px-4 sm:px-6 py-4">
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  Personal Passwords
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                  Total: {{ filteredKeys.length }} keys
                </p>
              </div>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

                <!-- Create Button -->
                <button
                  @click="openCreateModal"
                  class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  <Plus class="h-4 w-4" />
                  Create Password
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
                    class="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                  >
                    {{ pwd.description }}
                  </td>
                  <td class="hidden sm:table-cell px-4 sm:px-6 py-4">
                    <span class="text-sm font-mono text-gray-600">{{
                      maskPassword(pwd.password)
                    }}</span>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <div class="flex items-center gap-1 sm:gap-2">
                      <button
                        @click="handleViewPassword(pwd)"
                        class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                      >
                        <Eye class="h-4 w-4" />
                        <span class="hidden sm:inline">View</span>
                      </button>
                      <button
                        @click="handleEditPassword(pwd)"
                        class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Edit class="h-4 w-4" />
                        <span class="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        @click="handleDeletePassword(pwd)"
                        class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 class="h-4 w-4" />
                        <span class="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="paginatedKeys.length === 0">
                  <td
                    colspan="4"
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
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                @click="handleVerifyPassword"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
              >
                Verify
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

    <!-- Create/Edit Password Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ showEditModal ? "Edit Password" : "Create New Password" }}
          </h2>
          <button
            @click="handleCloseModal"
            class="text-gray-500 hover:text-gray-700"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="px-6 py-4">
          <div class="space-y-4">
            <!-- System Name -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                System Name <span class="text-red-600">*</span>
              </label>
              <input
                type="text"
                v-model="formData.systemName"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., GitHub Account"
              />
              <p
                v-if="formErrors.systemName"
                class="mt-1 text-xs text-red-600"
              >
                {{ formErrors.systemName }}
              </p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Description <span class="text-red-600">*</span>
              </label>
              <textarea
                v-model="formData.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Brief description of this password"
              ></textarea>
              <p
                v-if="formErrors.description"
                class="mt-1 text-xs text-red-600"
              >
                {{ formErrors.description }}
              </p>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Password <span class="text-red-600">*</span>
              </label>
              <input
                type="password"
                v-model="formData.password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter password"
              />
              <p v-if="formErrors.password" class="mt-1 text-xs text-red-600">
                {{ formErrors.password }}
              </p>
            </div>
          </div>

          <div class="border-t mt-6 pt-4 flex gap-3">
            <button
              @click="handleCloseModal"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="showEditModal ? handleUpdatePassword() : handleCreatePassword()"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
            >
              {{ showEditModal ? "Update" : "Create" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Confirm Deletion</h2>
          <button
            @click="handleCloseModal"
            class="text-gray-500 hover:text-gray-700"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="px-6 py-4">
          <p class="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this password entry? This action
            cannot be undone.
          </p>
          <div class="bg-red-50 border border-red-200 p-3 rounded-md mb-6">
            <p class="text-sm font-medium text-gray-900">
              {{ selectedPassword?.systemName }}
            </p>
            <p class="text-xs text-gray-600 mt-1">
              {{ selectedPassword?.description }}
            </p>
          </div>

          <div class="border-t pt-4 flex gap-3">
            <button
              @click="handleCloseModal"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="handleConfirmDelete"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>
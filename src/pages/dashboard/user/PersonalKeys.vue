<script setup>
import BaseLayout from "@/layouts/AppLayout.vue";
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
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
  Loader2,
} from "lucide-vue-next";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";
import { usePersonalKeyStore } from "@/stores/usePersonalKeyStore";

const { success, error: showError } = useToast();
const personalKeyStore = usePersonalKeyStore();
const {
  personalKeys,
  loading,
  error: storeError,
} = storeToRefs(personalKeyStore);

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
const submitting = ref(false);
const verifyingPassword = ref(false);

// Form data for create/edit
const formData = ref({
  keyname: "",
  description: "",
  key: "",
});

const formErrors = ref({
  keyname: "",
  description: "",
  key: "",
});

const maskPassword = (password) => {
  return "•".repeat(12);
};

// ========================================
// LIFECYCLE & DATA LOADING
// ========================================

onMounted(async () => {
  await personalKeyStore.getAllPersonalKeys();
});

// Computed: Filtered keys based on search
const filteredKeys = computed(() => {
  if (!searchQuery.value) {
    return personalKeys.value;
  }
  const query = searchQuery.value.toLowerCase();
  return personalKeys.value.filter(
    (key) =>
      key.keyname.toLowerCase().includes(query) ||
      (key.description && key.description.toLowerCase().includes(query))
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

const handleVerifyPassword = async () => {
  if (!accountPassword.value.trim()) {
    passwordError.value = "Please enter your password";
    return;
  }

  verifyingPassword.value = true;
  passwordError.value = "";

  try {
    // Step 1: Verify user's account password first
    const verifyEndpoint =
      API_ENDPOINTS.AUTH?.VERIFY_PASSWORD || "/verify-password";
    const verifyResponse = await apiClient.post(verifyEndpoint, {
      password: accountPassword.value,
    });

    // Check if password verification was successful
    if (
      verifyResponse.data?.success === true &&
      verifyResponse.data?.data?.password_match === true
    ) {
      // Password verified successfully
      console.log(
        "✅ Password verified for user:",
        verifyResponse.data.data.username
      );

      // Step 2: Now call the personal key verify endpoint to get the actual key
      try {
        const verifiedKey = await personalKeyStore.verifyPersonalKey(
          selectedPassword.value.id,
          accountPassword.value
        );

        // Check if key verification was successful
        if (verifiedKey && verifiedKey.key) {
          revealedPassword.value = {
            ...verifiedKey,
            masked: maskPassword(verifiedKey.key),
          };

          console.log(
            "✅ Personal key verified:",
            revealedPassword.value.keyname
          );

          // Log the reveal action to audit trail
          try {
            await apiClient.post("audit-trails/log-key-copied", {
              key_type: "personal",
              key_id: selectedPassword.value.id,
              key_name: selectedPassword.value.keyname,
              access_type: "revealed", // Specify that this is a reveal action
            });
            console.log("✅ Personal key reveal event logged");
          } catch (auditErr) {
            console.warn("Failed to log key reveal event:", auditErr);
            // Don't fail the reveal operation if logging fails
          }

          success("Personal key verified successfully!");
          accountPassword.value = "";
        } else {
          passwordError.value = "Failed to retrieve key";
        }
      } catch (keyErr) {
        console.error("Error verifying personal key:", keyErr);
        passwordError.value = "Verified but unable to retrieve personal key.";
      }
    } else {
      // Password verification failed
      passwordError.value =
        verifyResponse.data?.message || "Invalid password. Please try again.";
    }
  } catch (err) {
    console.error("Password verification failed:", err);
    passwordError.value =
      err.response?.data?.message || "Invalid password. Please try again.";
  } finally {
    verifyingPassword.value = false;
  }
};

// Helper function for countdown display
const displayLockoutCountdown = (lockedUntil) => {
  const unlockTime = new Date(lockedUntil);
  const interval = setInterval(() => {
    const now = new Date();
    const secondsLeft = Math.floor((unlockTime - now) / 1000);

    if (secondsLeft <= 0) {
      clearInterval(interval);
      passwordError.value = "You can try again now";
    } else {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      passwordError.value = `Account locked. Try again in ${timeStr}`;
    }
  }, 1000);
};

// New handler for copying personal key to clipboard and logging
const handleCopyKey = async () => {
  if (!revealedPassword.value) return;

  try {
    // Copy to system clipboard
    await navigator.clipboard.writeText(revealedPassword.value.key);

    // Log the copy event
    try {
      await apiClient.post("audit-trails/log-key-copied", {
        key_type: "personal",
        key_id: selectedPassword.value.id,
        key_name: selectedPassword.value.keyname,
        access_type: "copied", // Specify that this is a copy action
      });
      console.log("✅ Personal key copy event logged");
    } catch (logErr) {
      console.warn("Failed to log copy event:", logErr);
      // Don't fail the copy operation if logging fails
    }

    success("Key copied to clipboard!");

    // Optional: Clear clipboard after 30 seconds for security
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText("");
      } catch (e) {
        // Clipboard clear may not be supported in all browsers
      }
    }, 30000);
  } catch (err) {
    console.error("Failed to copy key:", err);
    showError("Failed to copy key to clipboard");
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
    keyname: "",
    description: "",
    key: "",
  };
  formErrors.value = {
    keyname: "",
    description: "",
    key: "",
  };
};

const validateForm = () => {
  let isValid = true;
  formErrors.value = {
    keyname: "",
    description: "",
    key: "",
  };

  if (!formData.value.keyname.trim()) {
    formErrors.value.keyname = "Key name is required";
    isValid = false;
  }

  if (!formData.value.description.trim()) {
    formErrors.value.description = "Description is required";
    isValid = false;
  }

  if (!formData.value.key.trim()) {
    formErrors.value.key = "Key is required";
    isValid = false;
  } else if (formData.value.key.length < 8) {
    formErrors.value.key = "Key must be at least 8 characters";
    isValid = false;
  }

  return isValid;
};

const handleCreatePassword = async () => {
  if (!validateForm()) return;

  submitting.value = true;
  try {
    console.log("📤 Creating personal key...");
    await personalKeyStore.createPersonalKey({
      keyname: formData.value.keyname,
      description: formData.value.description,
      key: formData.value.key,
    });

    console.log("✅ Personal key created");
    success("Personal key created successfully!");
    handleCloseModal();
  } catch (err) {
    console.error("❌ Error creating personal key:", err);
    showError(err.message || "Failed to create personal key");
  } finally {
    submitting.value = false;
  }
};

const handleEditPassword = (password) => {
  selectedPassword.value = password;
  formData.value = {
    keyname: password.keyname,
    description: password.description,
    key: password.key,
  };
  showEditModal.value = true;
};

const handleUpdatePassword = async () => {
  if (!validateForm()) return;

  submitting.value = true;
  try {
    console.log("📤 Updating personal key:", selectedPassword.value.id);
    await personalKeyStore.updatePersonalKey(selectedPassword.value.id, {
      keyname: formData.value.keyname,
      description: formData.value.description,
      key: formData.value.key,
    });

    console.log("✅ Personal key updated");
    success("Personal key updated successfully!");
    handleCloseModal();
  } catch (err) {
    console.error("❌ Error updating personal key:", err);
    showError(err.message || "Failed to update personal key");
  } finally {
    submitting.value = false;
  }
};

const handleDeletePassword = (password) => {
  selectedPassword.value = password;
  showDeleteModal.value = true;
};

const handleConfirmDelete = async () => {
  submitting.value = true;
  try {
    console.log("🗑️ Deleting personal key:", selectedPassword.value.id);
    await personalKeyStore.deletePersonalKey(selectedPassword.value.id);

    console.log("✅ Personal key deleted");
    success("Personal key deleted successfully!");
    handleCloseModal();
  } catch (err) {
    console.error("❌ Error deleting personal key:", err);
    showError(err.message || "Failed to delete personal key");
  } finally {
    submitting.value = false;
  }
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

              <div
                class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
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

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
            <span class="ml-2 text-gray-600">Loading personal keys...</span>
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
                    {{ pwd.keyname }}
                  </td>
                  <td
                    class="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                  >
                    {{ pwd.description }}
                  </td>
                  <td class="hidden sm:table-cell px-4 sm:px-6 py-4">
                    <span class="text-sm font-mono text-gray-600">{{
                      maskPassword(pwd.key)
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
                  {{ selectedPassword?.keyname }}
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
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Key Name
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ revealedPassword.keyname }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p class="text-sm text-gray-600">
                  {{ revealedPassword.description }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Details</label
                >
                <div
                  class="flex items-start gap-2 bg-gray-50 p-3 rounded-md border border-gray-200"
                >
                  <Lock class="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <template v-if="showPassword">
                      <div class="space-y-2 text-sm">
                        <div>
                          <span class="font-medium text-gray-700">Key:</span>
                          <code
                            class="text-gray-900 ml-2 font-mono break-all"
                            >{{ revealedPassword.key }}</code
                          >
                        </div>
                      </div>
                      <p class="text-xs text-amber-600 mt-2">
                        ⚠️ This is your plain text key. Keep it secure and do
                        not share it.
                      </p>
                    </template>
                    <template v-else>
                      <code class="text-sm font-mono text-gray-900"
                        >••••••••••••</code
                      >
                    </template>
                  </div>
                  <button
                    @click="togglePasswordVisibility"
                    class="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 mt-0.5"
                    type="button"
                  >
                    <EyeOff v-if="showPassword" class="h-4 w-4" />
                    <Eye v-else class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div class="border-t pt-4 flex gap-3">
              <button
                @click="handleCopyKey"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Copy Key
              </button>
              <button
                @click="handleCloseModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
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
            <!-- Key Name -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Key Name <span class="text-red-600">*</span>
              </label>
              <input
                type="text"
                v-model="formData.keyname"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., GitHub Account"
              />
              <p v-if="formErrors.keyname" class="mt-1 text-xs text-red-600">
                {{ formErrors.keyname }}
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

            <!-- Key -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Key <span class="text-red-600">*</span>
              </label>
              <input
                type="password"
                v-model="formData.key"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter key"
              />
              <p v-if="formErrors.key" class="mt-1 text-xs text-red-600">
                {{ formErrors.key }}
              </p>
            </div>
          </div>

          <div class="border-t mt-6 pt-4 flex gap-3">
            <button
              @click="handleCloseModal"
              :disabled="submitting"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              @click="
                showEditModal ? handleUpdatePassword() : handleCreatePassword()
              "
              :disabled="submitting"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
              {{
                submitting
                  ? showEditModal
                    ? "Updating..."
                    : "Creating..."
                  : showEditModal
                  ? "Update"
                  : "Create"
              }}
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
              {{ selectedPassword?.keyname }}
            </p>
            <p class="text-xs text-gray-600 mt-1">
              {{ selectedPassword?.description }}
            </p>
          </div>

          <div class="border-t pt-4 flex gap-3">
            <button
              @click="handleCloseModal"
              :disabled="submitting"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              @click="handleConfirmDelete"
              :disabled="submitting"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
              {{ submitting ? "Deleting..." : "Delete" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

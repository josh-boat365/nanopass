<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  Trash2,
  Edit2,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";

const { success, error: showError } = useToast();

// ========================================
// STATE MANAGEMENT
// ========================================
const categories = ref([]);
const systems = ref([]);
const passwords = ref([]);
const selectedPolicy = ref(null);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showPasswordFields = ref({});
const selectedPassword = ref(null);
const searchQuery = ref("");
const loading = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 100];
const isEditMode = ref(false);

// Form data
const formData = ref({
  system_id: null,
  title: "",
  username: "",
  password: "",
  notes: "",
  is_active: true,
});

// Policy validation state
const policyRequirements = ref(null);
const policyValidation = ref({
  isValid: false,
  errors: [],
  checked: false,
});

// ========================================
// COMPUTED PROPERTIES
// ========================================

// Filtered passwords based on search
const filteredPasswords = computed(() => {
  if (!searchQuery.value.trim()) {
    return passwords.value;
  }
  const query = searchQuery.value.toLowerCase();
  return passwords.value.filter(
    (pwd) =>
      pwd.title?.toLowerCase().includes(query) ||
      pwd.username?.toLowerCase().includes(query) ||
      (pwd.system_name && pwd.system_name.toLowerCase().includes(query))
  );
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredPasswords.value.length / itemsPerPage.value);
});

const paginatedPasswords = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredPasswords.value.slice(start, end);
});

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    filteredPasswords.value.length
  );
  const total = filteredPasswords.value.length;
  return `${start}-${end} of ${total}`;
});

// Password compliance percentage for progress bar
const passwordCompliancePercentage = computed(() => {
  // No password typed = 0%
  if (!formData.value.password) return 0;

  // No policy requirements = 100% (always valid)
  if (!policyRequirements.value) return 100;

  // Use validation result directly
  return policyValidation.value.isValid ? 100 : 0;
});

// Progress bar color based on compliance
const progressBarColor = computed(() => {
  const percentage = passwordCompliancePercentage.value;
  if (percentage >= 100) return "bg-green-500";
  return "bg-red-500";
});

// Visible requirements based on policy
const visibleRequirements = computed(() => {
  if (!policyRequirements.value) return [];
  return ["regex"];
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Parse policy requirements from backend
const parsePolicyFromRegex = (policy) => {
  if (!policy) return null;

  return {
    name: policy.name,
    description: policy.description,
    regex: policy.regex_text,
  };
};

// Check if individual requirement is met
const getRequirementStatus = (requirementType) => {
  if (!policyRequirements.value || !formData.value.password) {
    return false;
  }
  return policyValidation.value.isValid;
};

// Get requirement label text
const getRequirementLabel = (requirementType) => {
  if (!policyRequirements.value) return "";
  return policyRequirements.value.description || "Password policy requirement";
};

// Helper to get system name by ID
const getSystemNameById = (systemId) => {
  const system = systems.value.find((s) => s.id === systemId);
  return system ? system.system_name : "Unknown System";
};

// ========================================
// VALIDATION FUNCTIONS
// ========================================

// Validate password against policy
const validatePasswordAgainstPolicy = (
  password,
  requirements,
  isEdit = false
) => {
  console.log("🔍 Validating password:", {
    hasPassword: !!password,
    passwordLength: password?.length || 0,
    hasRequirements: !!requirements,
    requirementsRegex: requirements?.regex,
    isEdit,
  });

  // No policy = always valid
  if (!requirements || !requirements.regex) {
    console.log("✅ No policy requirements, validation passed");
    return {
      isValid: true,
      errors: [],
      checked: true,
    };
  }

  // Edit mode: empty password is valid (keeps existing)
  if (isEdit && (!password || password.length === 0)) {
    console.log("✅ Edit mode with empty password, validation passed");
    return {
      isValid: true,
      errors: [],
      checked: false,
    };
  }

  // Add mode: empty password is invalid
  if (!isEdit && (!password || password.length === 0)) {
    console.log("❌ Add mode requires password");
    return {
      isValid: false,
      errors: ["Password is required"],
      checked: true,
    };
  }

  // Validate against regex
  const errors = [];
  try {
    const regex = new RegExp(requirements.regex);
    const passes = regex.test(password);

    console.log("🔍 Regex validation:", {
      regex: requirements.regex,
      passwordPreview: password.substring(0, 3) + "***",
      passes,
    });

    if (!passes) {
      errors.push(
        `Password does not meet policy requirements: ${requirements.description}`
      );
    }
  } catch (e) {
    console.error("❌ Invalid regex pattern:", e);
    errors.push("Invalid password policy configuration");
  }

  const result = {
    isValid: errors.length === 0,
    errors: errors,
    checked: true,
  };

  console.log(
    result.isValid ? "✅ Password valid!" : "❌ Password invalid:",
    result
  );
  return result;
};

// Validate form before submission
const validateForm = (isEdit = false) => {
  console.log("Validating form - isEdit:", isEdit);
  console.log("Form data:", formData.value);
  console.log("Policy validation:", policyValidation.value);

  if (!formData.value.system_id) {
    return "System is required";
  }
  if (!formData.value.title.trim()) {
    return "Title is required";
  }

  // For add mode, password is always required
  if (!isEdit && !formData.value.password.trim()) {
    return "Password is required";
  }

  // If password is provided (add or edit), validate against policy
  if (formData.value.password.trim() && !policyValidation.value.isValid) {
    return (
      policyValidation.value.errors[0] ||
      "Password does not meet policy requirements"
    );
  }

  return null;
};

// ========================================
// WATCHERS
// ========================================

// Watch password field for real-time validation
watch(
  () => formData.value.password,
  (newPassword) => {
    console.log("🔑 Password changed, length:", newPassword?.length || 0);

    if (policyRequirements.value) {
      policyValidation.value = validatePasswordAgainstPolicy(
        newPassword,
        policyRequirements.value,
        isEditMode.value
      );
    } else {
      console.log("ℹ️ No policy requirements - auto-valid");
      policyValidation.value = { isValid: true, errors: [], checked: false };
    }
  }
);

// Watch system selection to load policy
watch(
  () => formData.value.system_id,
  (newSystemId) => {
    console.log("🔍 System ID changed to:", newSystemId);

    // Reset policy state
    selectedPolicy.value = null;
    policyRequirements.value = null;

    if (!newSystemId) {
      policyValidation.value = { isValid: false, errors: [], checked: false };
      return;
    }

    // Find the selected system
    const system = systems.value.find((s) => s.id === newSystemId);
    if (!system) {
      console.warn("⚠️ System not found with ID:", newSystemId);
      policyValidation.value = { isValid: false, errors: [], checked: false };
      return;
    }

    console.log("✅ Found system:", system.system_name);
    console.log("System category:", system.category);

    // CRITICAL FIX: Match the system's category with the full category data
    // The system.category only has {id, name}, we need the full category with policy
    let category = null;

    if (system.category && system.category.id) {
      // Find the full category object from our loaded categories
      category = categories.value.find((c) => c.id === system.category.id);
      console.log("✅ Matched category from categories list:", category?.name);
    }

    if (!category) {
      console.warn("⚠️ No category found for system");
      // No policy means validation is always valid
      policyValidation.value = { isValid: true, errors: [], checked: false };
      return;
    }

    const policy = category.policy;
    console.log("Policy found:", !!policy, policy);

    if (policy) {
      selectedPolicy.value = policy;
      policyRequirements.value = parsePolicyFromRegex(policy);
      console.log("✅ Policy requirements loaded:", policyRequirements.value);

      // Immediately validate current password state
      policyValidation.value = validatePasswordAgainstPolicy(
        formData.value.password,
        policyRequirements.value,
        isEditMode.value
      );
      console.log("✅ Initial validation:", policyValidation.value);
    } else {
      console.log("ℹ️ No policy for this system - validation will pass");
      policyValidation.value = { isValid: true, errors: [], checked: false };
    }
  }
);

// Watch search query to reset pagination
watch(searchQuery, () => {
  currentPage.value = 1;
});

// ========================================
// API FUNCTIONS
// ========================================

// Load categories with policies
const loadCategories = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
    const categoriesData = response.data?.data || response.data;
    categories.value = Array.isArray(categoriesData) ? categoriesData : [];
    console.log("✅ Loaded categories with policies:", categories.value.length);
  } catch (err) {
    console.error("❌ Error loading categories:", err);
    showError("Failed to load categories");
  }
};

// Load systems with relationships
const loadSystems = async () => {
  try {
    loading.value = true;
    const response = await apiClient.get(API_ENDPOINTS.SYSTEMS.LIST);
    const systemsData = response.data?.data || response.data;

    systems.value = Array.isArray(systemsData) ? systemsData : [];

    console.log("✅ Loaded systems:", systems.value.length);
    if (systems.value.length > 0) {
      console.log("Sample system structure:", systems.value[0]);
    }
  } catch (err) {
    console.error("❌ Error loading systems:", err);
    showError("Failed to load systems");
  } finally {
    loading.value = false;
  }
};

// Load passwords
const loadPasswords = async () => {
  try {
    loading.value = true;
    const response = await apiClient.get(API_ENDPOINTS.PASSWORDS.LIST);
    const passwordsData = response.data?.data || response.data;
    passwords.value = Array.isArray(passwordsData)
      ? passwordsData.map((pwd) => ({
          ...pwd,
          system_name:
            pwd.system?.system_name || getSystemNameById(pwd.system_id),
        }))
      : [];
    console.log("✅ Loaded passwords:", passwords.value.length);
  } catch (err) {
    console.error("❌ Error loading passwords:", err);
    showError("Failed to load passwords");
  } finally {
    loading.value = false;
  }
};

// ========================================
// MODAL FUNCTIONS
// ========================================

// Open Add Modal
const openAddModal = () => {
  console.log("📂 Opening Add Modal");
  isEditMode.value = false;
  formData.value = {
    system_id: null,
    title: "",
    username: "",
    password: "",
    notes: "",
    is_active: true,
  };
  selectedPolicy.value = null;
  policyRequirements.value = null;
  policyValidation.value = { isValid: false, errors: [], checked: false };
  showAddModal.value = true;
};

// Close Add Modal
const closeAddModal = () => {
  showAddModal.value = false;
  formData.value = {
    system_id: null,
    title: "",
    username: "",
    password: "",
    notes: "",
    is_active: true,
  };
  selectedPolicy.value = null;
  policyRequirements.value = null;
  policyValidation.value = { isValid: false, errors: [], checked: false };
};

// Open Edit Modal
const openEditModal = (password) => {
  console.log("📝 Opening Edit Modal for:", password.title);
  isEditMode.value = true;
  selectedPassword.value = password;
  formData.value = {
    system_id: Number(password.system_id),
    title: password.title || "",
    username: password.username || "",
    password: "", // Empty in edit mode
    notes: password.notes || "",
    is_active: password.is_active,
  };

  // The system watcher will handle loading the policy
  // Start with valid state for edit mode (empty password is OK)
  policyValidation.value = { isValid: true, errors: [], checked: false };
  showEditModal.value = true;
};

// Close Edit Modal
const closeEditModal = () => {
  showEditModal.value = false;
  isEditMode.value = false;
  selectedPassword.value = null;
  formData.value = {
    system_id: null,
    title: "",
    username: "",
    password: "",
    notes: "",
    is_active: true,
  };
  selectedPolicy.value = null;
  policyRequirements.value = null;
  policyValidation.value = { isValid: false, errors: [], checked: false };
};

// Open Delete Modal
const openDeleteModal = (password) => {
  selectedPassword.value = password;
  showDeleteModal.value = true;
};

// Close Delete Modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedPassword.value = null;
};

// ========================================
// PASSWORD OPERATIONS
// ========================================

// Toggle password visibility
const togglePasswordVisibility = (id) => {
  showPasswordFields.value[id] = !showPasswordFields.value[id];
};

// Toggle active status
const toggleActiveStatus = async (password) => {
  try {
    submitting.value = true;
    await apiClient.post(API_ENDPOINTS.PASSWORDS.TOGGLE_ACTIVE(password.id));
    await loadPasswords();
    success("Password status updated successfully!");
  } catch (err) {
    showError(err.message || "Failed to update password status");
  } finally {
    submitting.value = false;
  }
};

// Add Password
const addPassword = async () => {
  console.log("Attempting to add password...");
  const validationError = validateForm(false);
  if (validationError) {
    console.error("Validation failed:", validationError);
    showError(validationError);
    return;
  }

  try {
    submitting.value = true;

    const passwordData = {
      system_id: Number(formData.value.system_id),
      title: formData.value.title,
      username: formData.value.username || null,
      password: formData.value.password,
      notes: formData.value.notes || null,
      is_active: formData.value.is_active,
    };

    console.log("Sending password data:", passwordData);
    await apiClient.post(API_ENDPOINTS.PASSWORDS.CREATE, passwordData);
    await loadPasswords();
    success("Password created successfully!");
    closeAddModal();
  } catch (err) {
    console.error("Error creating password:", err);
    showError(err.message || "Failed to create password");
  } finally {
    submitting.value = false;
  }
};

// Update Password
const updatePassword = async () => {
  if (!selectedPassword.value) return;

  console.log("Attempting to update password...");
  const validationError = validateForm(true);
  if (validationError) {
    console.error("Validation failed:", validationError);
    showError(validationError);
    return;
  }

  try {
    submitting.value = true;

    const passwordData = {
      system_id: Number(formData.value.system_id),
      title: formData.value.title,
      username: formData.value.username || null,
      notes: formData.value.notes || null,
      is_active: formData.value.is_active,
    };

    // Only include password if provided
    if (formData.value.password.trim()) {
      passwordData.password = formData.value.password;
    }

    console.log("Sending update data:", passwordData);
    await apiClient.put(
      API_ENDPOINTS.PASSWORDS.UPDATE(selectedPassword.value.id),
      passwordData
    );
    await loadPasswords();
    success("Password updated successfully!");
    closeEditModal();
  } catch (err) {
    console.error("Error updating password:", err);
    showError(err.message || "Failed to update password");
  } finally {
    submitting.value = false;
  }
};

// Delete Password
const deletePassword = async () => {
  if (!selectedPassword.value) return;

  try {
    submitting.value = true;
    await apiClient.delete(
      API_ENDPOINTS.PASSWORDS.DELETE(selectedPassword.value.id)
    );
    passwords.value = passwords.value.filter(
      (p) => p.id !== selectedPassword.value.id
    );
    success("Password deleted successfully!");
    closeDeleteModal();
  } catch (err) {
    showError(err.message || "Failed to delete password");
  } finally {
    submitting.value = false;
  }
};

// ========================================
// PAGINATION FUNCTIONS
// ========================================

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

// ========================================
// DEBUG HELPER
// ========================================

const debugValidationState = () => {
  console.log("════════════════════════════════════");
  console.log("VALIDATION STATE DEBUG");
  console.log("════════════════════════════════════");
  console.log("📋 Form Data:");
  console.log("  - System ID:", formData.value.system_id);
  console.log("  - Password length:", formData.value.password?.length || 0);
  console.log("  - Is Edit Mode:", isEditMode.value);
  console.log("");
  console.log("📚 Loaded Data:");
  console.log("  - Categories loaded:", categories.value.length);
  console.log("  - Systems loaded:", systems.value.length);
  console.log("");
  console.log("🔒 Policy State:");
  console.log("  - Has policy requirements:", !!policyRequirements.value);
  if (policyRequirements.value) {
    console.log("  - Policy name:", policyRequirements.value.name);
    console.log("  - Policy regex:", policyRequirements.value.regex);
  }
  console.log("");
  console.log("✓ Validation State:");
  console.log("  - Is valid:", policyValidation.value.isValid);
  console.log("  - Checked:", policyValidation.value.checked);
  console.log("  - Errors:", policyValidation.value.errors);
  console.log("");
  console.log("📊 UI State:");
  console.log("  - Compliance %:", passwordCompliancePercentage.value);
  console.log("  - Progress color:", progressBarColor.value);
  console.log("════════════════════════════════════");

  // Test password if one exists
  if (formData.value.password && policyRequirements.value) {
    console.log("");
    console.log("🧪 Testing current password...");
    const testResult = validatePasswordAgainstPolicy(
      formData.value.password,
      policyRequirements.value,
      isEditMode.value
    );
    console.log("Test result:", testResult);
  }
};

// ========================================
// LIFECYCLE
// ========================================

onMounted(() => {
  loadCategories();
  loadSystems();
  loadPasswords();

  // Add debug helpers to window
  window.debugPasswordValidation = debugValidationState;

  window.testPassword = (password, systemId) => {
    const system = systems.value.find((s) => s.id === systemId);
    if (!system) {
      console.error("System not found");
      return;
    }

    const category = categories.value.find((c) => c.id === system.category.id);
    if (!category || !category.policy) {
      console.log("No policy for this system");
      return;
    }

    const requirements = parsePolicyFromRegex(category.policy);
    const result = validatePasswordAgainstPolicy(password, requirements, false);

    console.log("Test Result:", result);
    return result;
  };

  console.log("💡 Debug helpers available:");
  console.log("  - window.debugPasswordValidation()");
  console.log("  - window.testPassword('YourPassword123!', systemId)");

  // Log initial state after load
  setTimeout(() => {
    console.log("📊 Initial data loaded:");
    console.log("Categories:", categories.value.length);
    console.log("Systems:", systems.value.length);
    if (categories.value.length > 0) {
      console.log("Sample category:", categories.value[0]);
    }
    if (systems.value.length > 0) {
      console.log("Sample system:", systems.value[0]);
    }
  }, 1000);
});
</script>

<template>
  <BaseLayout>
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Manage Passwords</h1>
          <p class="text-gray-600 text-sm mt-1">
            Store and manage system passwords with policy enforcement.
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          <Plus class="h-4 w-4" />
          Add Password
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mb-6 flex items-center gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search passwords by title, username, or system..."
            class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div class="text-sm text-gray-600">
          {{ filteredPasswords.length }} result{{
            filteredPasswords.length !== 1 ? "s" : ""
          }}
        </div>
      </div>

      <!-- Passwords Table -->
      <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
          <span class="ml-2 text-gray-600">Loading passwords...</span>
        </div>

        <!-- Content -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b bg-gray-50">
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Title
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Username
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  System
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr
                v-for="password in paginatedPasswords"
                :key="password.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ password.title }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ password.username || "-" }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ password.system_name }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <button
                    @click="toggleActiveStatus(password)"
                    :disabled="submitting"
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
                      password.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
                    ]"
                  >
                    {{ password.is_active ? "Active" : "Inactive" }}
                  </button>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <button
                      @click="openEditModal(password)"
                      class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit2 class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      @click="openDeleteModal(password)"
                      class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div
          v-if="filteredPasswords.length === 0 && !loading"
          class="px-6 py-12 text-center"
        >
          <p class="text-gray-500 text-sm">
            {{
              searchQuery.trim()
                ? "No passwords match your search."
                : "No passwords found. Create your first one."
            }}
          </p>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="border-t px-4 sm:px-6 py-4 bg-gray-50"
        >
          <div
            class="flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <!-- Items Per Page Selector -->
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
              <span>per page</span>
            </div>

            <!-- Pagination Info -->
            <div class="text-sm text-gray-600">
              Showing {{ paginationInfo }}
            </div>

            <!-- Pagination Controls -->
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

    <!-- Add Password Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        class="relative w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-6 py-4 sticky top-0 bg-white z-10">
          <h2 class="text-lg font-semibold text-gray-900">Add New Password</h2>
        </div>
        <!-- Modal Body -->
        <div class="px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- System Selection -->
            <div class="col-span-2">
              <label
                for="add-system"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                System <span class="text-red-600">*</span>
              </label>
              <select
                id="add-system"
                v-model.number="formData.system_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option :value="null" disabled>Select a system</option>
                <option
                  v-for="system in systems"
                  :key="system.id"
                  :value="system.id"
                >
                  {{ system.system_name }}
                </option>
              </select>
            </div>

            <!-- Policy Display -->
            <div
              v-if="policyRequirements"
              class="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-md"
            >
              <div class="flex items-start gap-2">
                <AlertCircle class="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h3 class="font-semibold text-blue-900 mb-1">
                    Password Policy: {{ policyRequirements.name }}
                  </h3>
                  <p class="text-sm text-blue-800">
                    {{ policyRequirements.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label
                for="add-title"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Title <span class="text-red-600">*</span>
              </label>
              <input
                id="add-title"
                v-model="formData.title"
                type="text"
                placeholder="e.g., Admin Account"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <!-- Username -->
            <div>
              <label
                for="add-username"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Username
              </label>
              <input
                id="add-username"
                v-model="formData.username"
                type="text"
                placeholder="Optional username"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <!-- Password -->
            <div class="col-span-2">
              <label
                for="add-password"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Password <span class="text-red-600">*</span>
              </label>
              <div class="relative">
                <input
                  id="add-password"
                  v-model="formData.password"
                  :type="showPasswordFields['add'] ? 'text' : 'password'"
                  placeholder="Enter password"
                  :class="[
                    'w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black pr-10',
                    formData.password && !policyValidation.isValid
                      ? 'border-red-500'
                      : formData.password && policyValidation.isValid
                      ? 'border-green-500'
                      : 'border-gray-300',
                  ]"
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility('add')"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Eye v-if="!showPasswordFields['add']" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>

              <!-- Password Validation Progress -->
              <div v-if="policyRequirements" class="mt-3 space-y-3">
                <!-- Progress Bar - Only show when password is typed -->
                <div v-if="formData.password">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-xs font-medium text-gray-700">
                      Policy Compliance
                    </span>
                    <span class="text-xs font-semibold text-gray-900">
                      {{ passwordCompliancePercentage }}%
                    </span>
                  </div>
                  <div
                    class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
                  >
                    <div
                      :class="progressBarColor"
                      class="h-full transition-all duration-300 ease-out"
                      :style="{
                        width: `${passwordCompliancePercentage}%`,
                      }"
                    ></div>
                  </div>
                </div>

                <!-- Requirements Checklist - Always show when policy exists -->
                <div class="space-y-2">
                  <div
                    v-for="req in visibleRequirements"
                    :key="req"
                    class="flex items-center gap-2"
                  >
                    <div
                      :class="[
                        'flex items-center justify-center h-5 w-5 rounded-full shrink-0 transition-colors',
                        formData.password && getRequirementStatus(req)
                          ? 'bg-green-500'
                          : formData.password && !getRequirementStatus(req)
                          ? 'bg-red-500'
                          : 'bg-gray-300',
                      ]"
                    >
                      <Check
                        v-if="formData.password && getRequirementStatus(req)"
                        class="h-3 w-3 text-white"
                      />
                      <X
                        v-else-if="
                          formData.password && !getRequirementStatus(req)
                        "
                        class="h-3 w-3 text-white"
                      />
                      <AlertCircle v-else class="h-3 w-3 text-white" />
                    </div>
                    <span
                      :class="[
                        'text-sm transition-colors',
                        formData.password && getRequirementStatus(req)
                          ? 'text-green-700 font-medium'
                          : formData.password && !getRequirementStatus(req)
                          ? 'text-red-600'
                          : 'text-gray-600',
                      ]"
                    >
                      {{ getRequirementLabel(req) }}
                    </span>
                  </div>
                </div>

                <!-- Overall Validation Status -->
                <div
                  v-if="formData.password && policyValidation.isValid"
                  class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md"
                >
                  <Check class="h-5 w-5 text-green-600 shrink-0" />
                  <span class="text-sm font-medium text-green-800">
                    Password meets all policy requirements
                  </span>
                </div>
                <div
                  v-else-if="
                    formData.password && policyValidation.errors.length > 0
                  "
                  class="p-3 bg-red-50 border border-red-200 rounded-md"
                >
                  <div
                    v-for="error in policyValidation.errors"
                    :key="error"
                    class="flex items-start gap-2"
                  >
                    <X class="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <span class="text-sm text-red-800">{{ error }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <label
                for="add-notes"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Notes
              </label>
              <textarea
                id="add-notes"
                v-model="formData.notes"
                rows="3"
                placeholder="Add any additional notes..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              ></textarea>
            </div>

            <!-- Active Checkbox -->
            <div class="col-span-2 flex items-center gap-2">
              <input
                id="add-active"
                v-model="formData.is_active"
                type="checkbox"
                class="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <label for="add-active" class="text-sm font-medium text-gray-900">
                Active
              </label>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white z-10"
        >
          <button
            @click="closeAddModal"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="addPassword"
            :disabled="
              !formData.system_id ||
              !formData.title.trim() ||
              !formData.password.trim() ||
              !policyValidation.isValid ||
              submitting
            "
            class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Adding..." : "Add Password" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Password Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        class="relative w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-6 py-4 sticky top-0 bg-white z-10">
          <h2 class="text-lg font-semibold text-gray-900">Edit Password</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- System Selection -->
            <div class="col-span-2">
              <label
                for="edit-system"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                System <span class="text-red-600">*</span>
              </label>
              <select
                id="edit-system"
                v-model.number="formData.system_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option :value="null" disabled>Select a system</option>
                <option
                  v-for="system in systems"
                  :key="system.id"
                  :value="system.id"
                >
                  {{ system.system_name }}
                </option>
              </select>
            </div>

            <!-- Policy Display -->
            <div
              v-if="policyRequirements"
              class="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-md"
            >
              <div class="flex items-start gap-2">
                <AlertCircle class="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h3 class="font-semibold text-blue-900 mb-1">
                    Password Policy: {{ policyRequirements.name }}
                  </h3>
                  <p class="text-sm text-blue-800">
                    {{ policyRequirements.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label
                for="edit-title"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Title <span class="text-red-600">*</span>
              </label>
              <input
                id="edit-title"
                v-model="formData.title"
                type="text"
                placeholder="e.g., Admin Account"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <!-- Username -->
            <div>
              <label
                for="edit-username"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Username
              </label>
              <input
                id="edit-username"
                v-model="formData.username"
                type="text"
                placeholder="Optional username"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <!-- Password -->
            <div class="col-span-2">
              <label
                for="edit-password"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Password
                <span class="text-gray-500 text-xs ml-1"
                  >(Leave empty to keep current)</span
                >
              </label>
              <div class="relative">
                <input
                  id="edit-password"
                  v-model="formData.password"
                  :type="showPasswordFields['edit'] ? 'text' : 'password'"
                  placeholder="Leave empty to keep current password"
                  :class="[
                    'w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black pr-10',
                    formData.password && !policyValidation.isValid
                      ? 'border-red-500'
                      : formData.password && policyValidation.isValid
                      ? 'border-green-500'
                      : 'border-gray-300',
                  ]"
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility('edit')"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Eye v-if="!showPasswordFields['edit']" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>

              <!-- Password Validation Progress - Only show when typing new password -->
              <div
                v-if="formData.password && policyRequirements"
                class="mt-3 space-y-3"
              >
                <!-- Progress Bar -->
                <div>
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-xs font-medium text-gray-700">
                      Policy Compliance
                    </span>
                    <span class="text-xs font-semibold text-gray-900">
                      {{ passwordCompliancePercentage }}%
                    </span>
                  </div>
                  <div
                    class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
                  >
                    <div
                      :class="progressBarColor"
                      class="h-full transition-all duration-300 ease-out"
                      :style="{
                        width: `${passwordCompliancePercentage}%`,
                      }"
                    ></div>
                  </div>
                </div>

                <!-- Requirements Checklist -->
                <div class="space-y-2">
                  <div
                    v-for="req in visibleRequirements"
                    :key="req"
                    class="flex items-center gap-2"
                  >
                    <div
                      :class="[
                        'flex items-center justify-center h-5 w-5 rounded-full shrink-0 transition-colors',
                        getRequirementStatus(req)
                          ? 'bg-green-500'
                          : 'bg-red-500',
                      ]"
                    >
                      <Check
                        v-if="getRequirementStatus(req)"
                        class="h-3 w-3 text-white"
                      />
                      <X v-else class="h-3 w-3 text-white" />
                    </div>
                    <span
                      :class="[
                        'text-sm transition-colors',
                        getRequirementStatus(req)
                          ? 'text-green-700 font-medium'
                          : 'text-red-600',
                      ]"
                    >
                      {{ getRequirementLabel(req) }}
                    </span>
                  </div>
                </div>

                <!-- Overall Validation Status -->
                <div
                  v-if="policyValidation.isValid"
                  class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md"
                >
                  <Check class="h-5 w-5 text-green-600 shrink-0" />
                  <span class="text-sm font-medium text-green-800">
                    Password meets all policy requirements
                  </span>
                </div>
                <div
                  v-else-if="policyValidation.errors.length > 0"
                  class="p-3 bg-red-50 border border-red-200 rounded-md"
                >
                  <div
                    v-for="error in policyValidation.errors"
                    :key="error"
                    class="flex items-start gap-2"
                  >
                    <X class="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <span class="text-sm text-red-800">{{ error }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <label
                for="edit-notes"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Notes
              </label>
              <textarea
                id="edit-notes"
                v-model="formData.notes"
                rows="3"
                placeholder="Add any additional notes..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              ></textarea>
            </div>

            <!-- Active Checkbox -->
            <div class="col-span-2 flex items-center gap-2">
              <input
                id="edit-active"
                v-model="formData.is_active"
                type="checkbox"
                class="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <label
                for="edit-active"
                class="text-sm font-medium text-gray-900"
              >
                Active
              </label>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white z-10"
        >
          <button
            @click="closeEditModal"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="updatePassword"
            :disabled="
              !formData.system_id ||
              !formData.title.trim() ||
              (formData.password && !policyValidation.isValid) ||
              submitting
            "
            class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <!-- Modal Header -->
        <div class="border-b px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Delete Password</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4">
          <p class="text-sm text-gray-600">
            Are you sure you want to delete
            <span class="font-semibold text-gray-900">{{
              selectedPassword?.title
            }}</span
            >? This action cannot be undone.
          </p>
        </div>

        <!-- Modal Footer -->
        <div class="border-t px-6 py-4 flex gap-3 justify-end">
          <button
            @click="closeDeleteModal"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="deletePassword"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div></BaseLayout
  >
</template>

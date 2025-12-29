<script setup>
import { ref, computed, onMounted } from "vue";
import { Trash2, Edit2, Plus, Info, Loader2, Regex } from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";

const { success, error: showError } = useToast();

// State management
const passwordPolicies = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedPolicy = ref(null);
const searchQuery = ref("");
const loading = ref(false);
const submitting = ref(false);

// Form data (internal use for building requirements)
const formData = ref({
  name: "",
  requirements: {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: false,
    requireSpecialChars: false,
  },
});

// Generate regex based on requirements
const generateRegex = (requirements) => {
  const {
    minLength,
    requireUppercase,
    requireLowercase,
    requireNumbers,
    requireSpecialChars,
  } = requirements;

  let lookaheads = [];
  let charClass = "A-Za-z\\d@$!%*?&";

  // Build lookaheads based on requirements
  if (requireUppercase) {
    lookaheads.push("(?=.*[A-Z])");
  }

  if (requireLowercase) {
    lookaheads.push("(?=.*[a-z])");
  }

  if (requireNumbers) {
    lookaheads.push("(?=.*\\d)");
  }

  if (requireSpecialChars) {
    lookaheads.push("(?=.*[@$!%*?&])");
  }

  // Combine lookaheads and length requirement
  const lookaheadString = lookaheads.join("");
  return `^${lookaheadString}[${charClass}]{${minLength},}$`;
};

// Generate human-readable description
const generateDescription = (requirements) => {
  const parts = [];

  parts.push(`Minimum ${requirements.minLength} characters`);

  if (requirements.requireUppercase) {
    parts.push("at least 1 uppercase letter");
  }

  if (requirements.requireLowercase) {
    parts.push("at least 1 lowercase letter");
  }

  if (requirements.requireNumbers) {
    parts.push("at least 1 number");
  }

  if (requirements.requireSpecialChars) {
    parts.push("at least 1 special character (@$!%*?&)");
  }

  return parts.join(", ");
};

// Computed generated regex for current form
const generatedRegex = computed(() => {
  return generateRegex(formData.value.requirements);
});

// Computed generated description for current form
const generatedDescription = computed(() => {
  return generateDescription(formData.value.requirements);
});

// Filtered policies
const filteredPolicies = ref([]);
const updateFilteredPolicies = () => {
  if (!searchQuery.value.trim()) {
    filteredPolicies.value = passwordPolicies.value;
    return;
  }
  const query = searchQuery.value.toLowerCase();
  filteredPolicies.value = passwordPolicies.value.filter(
    (policy) =>
      policy.name.toLowerCase().includes(query) ||
      policy.description.toLowerCase().includes(query)
  );
};

// Open Add Modal
const openAddModal = () => {
  formData.value = {
    name: "",
    requirements: {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: false,
      requireSpecialChars: false,
    },
  };
  showAddModal.value = true;
};

// Close Add Modal
const closeAddModal = () => {
  showAddModal.value = false;
};

// Open Edit Modal
const openEditModal = (policy) => {
  selectedPolicy.value = policy;
  // Deep copy the policy data into formData
  formData.value = {
    name: policy.name || "",
    requirements: JSON.parse(
      JSON.stringify(
        policy.requirements || {
          minLength: 8,
          requireUppercase: false,
          requireLowercase: true,
          requireNumbers: false,
          requireSpecialChars: false,
        }
      )
    ),
  };
  showEditModal.value = true;
};

// Close Edit Modal
const closeEditModal = () => {
  showEditModal.value = false;
  selectedPolicy.value = null;
};

// Open Delete Modal
const openDeleteModal = (policy) => {
  selectedPolicy.value = policy;
  showDeleteModal.value = true;
};

// Close Delete Modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedPolicy.value = null;
};

// Add Password Policy
const addPasswordPolicy = async () => {
  if (!formData.value.name.trim()) {
    showError("Policy name is required");
    return;
  }

  try {
    submitting.value = true;

    const policyData = {
      name: formData.value.name,
      description: generatedDescription.value,
      regex_text: generatedRegex.value,
    };

    const { data } = await apiClient.post(
      API_ENDPOINTS.POLICIES.CREATE,
      policyData
    );

    passwordPolicies.value.push(data);
    updateFilteredPolicies();
    success("Password policy created successfully!");
    closeAddModal();
  } catch (err) {
    showError(err.message || "Failed to create policy");
  } finally {
    submitting.value = false;
  }
};

// Update Password Policy
const updatePasswordPolicy = async () => {
  if (!formData.value.name.trim() || !selectedPolicy.value) {
    showError("Policy name is required");
    return;
  }

  try {
    submitting.value = true;

    const policyData = {
      name: formData.value.name,
      description: generatedDescription.value,
      regex_text: generatedRegex.value,
    };

    const { data } = await apiClient.put(
      API_ENDPOINTS.POLICIES.UPDATE(selectedPolicy.value.id),
      policyData
    );

    const index = passwordPolicies.value.findIndex(
      (p) => p.id === selectedPolicy.value.id
    );
    if (index > -1) {
      passwordPolicies.value[index] = data;
    }

    updateFilteredPolicies();
    success("Password policy updated successfully!");
    closeEditModal();
  } catch (err) {
    showError(err.message || "Failed to update policy");
  } finally {
    submitting.value = false;
  }
};

// Delete Password Policy
const deletePasswordPolicy = async () => {
  if (!selectedPolicy.value) return;

  try {
    submitting.value = true;
    await apiClient.delete(
      API_ENDPOINTS.POLICIES.DELETE(selectedPolicy.value.id)
    );

    passwordPolicies.value = passwordPolicies.value.filter(
      (p) => p.id !== selectedPolicy.value.id
    );
    updateFilteredPolicies();
    success("Password policy deleted successfully!");
    closeDeleteModal();
  } catch (err) {
    showError(err.message || "Failed to delete policy");
  } finally {
    submitting.value = false;
  }
};

// Load policies on mount
const loadPolicies = async () => {
  try {
    loading.value = true;
    const response = await apiClient.get(API_ENDPOINTS.POLICIES.LIST);
    const policiesData = response.data?.data || response.data;
    passwordPolicies.value = Array.isArray(policiesData) ? policiesData : [];
    updateFilteredPolicies();
  } catch (err) {
    console.error("Error loading policies:", err);
    showError("Failed to load policies");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPolicies();
});
</script>

<template>
  <BaseLayout>
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            System Password Policies
          </h1>
          <p class="text-gray-600 text-sm mt-1">
            Create and manage password policies with easy-to-use requirements
            builder
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          <Plus class="h-4 w-4" />
          Add Password Policy
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mb-6 flex items-center gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            @input="updateFilteredPolicies"
            type="text"
            placeholder="Search policies by name or description..."
            class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div class="text-sm text-gray-600">
          {{ filteredPolicies.length }} result{{
            filteredPolicies.length !== 1 ? "s" : ""
          }}
        </div>
      </div>

      <!-- Password Policies Table -->
      <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
          <span class="ml-2 text-gray-600">Loading policies...</span>
        </div>

        <!-- Content -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b bg-gray-50">
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Policy Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Description
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
                v-for="policy in filteredPolicies"
                :key="policy.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ policy.name }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 max-w-lg">
                  {{ policy.description }}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <button
                      @click="openEditModal(policy)"
                      class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit2 class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      @click="openDeleteModal(policy)"
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

          <!-- Empty state -->
          <div
            v-if="filteredPolicies.length === 0"
            class="px-6 py-12 text-center"
          >
            <p class="text-gray-500 text-sm">
              {{
                searchQuery.trim()
                  ? "No policies match your search."
                  : "No password policies found. Create your first one."
              }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Password Policy Modal -->
    <div
      v-if="showAddModal || showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        class="relative w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-6 py-4 sticky top-0 bg-white z-10">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ showAddModal ? "Add Password Policy" : "Edit Password Policy" }}
          </h2>
          <p class="text-sm text-gray-600 mt-1">
            Configure password requirements - regex pattern will be generated
            automatically
          </p>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4 space-y-6">
          <!-- Policy Name -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2"
              >Policy Name *</label
            >
            <input
              v-model="formData.name"
              type="text"
              placeholder="e.g., Strong Password"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Password Requirements -->
          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="flex items-center gap-2 mb-4">
              <h3 class="text-sm font-semibold text-gray-900">
                Password Requirements
              </h3>
              <div class="group relative">
                <Info class="h-4 w-4 text-gray-400 cursor-help" />
                <div
                  class="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-20"
                >
                  Configure the rules that passwords must follow. The
                  description and regex pattern will be generated automatically.
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <!-- Minimum Length -->
              <div class="bg-white p-4 rounded-md border border-gray-200">
                <label class="block text-sm font-medium text-gray-900 mb-2"
                  >Minimum Length *</label
                >
                <input
                  v-model.number="formData.requirements.minLength"
                  type="number"
                  min="1"
                  max="128"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Minimum number of characters (1-128)
                </p>
              </div>

              <!-- Uppercase Letters -->
              <div class="bg-white p-4 rounded-md border border-gray-200">
                <label class="flex items-center gap-2">
                  <input
                    v-model="formData.requirements.requireUppercase"
                    type="checkbox"
                    class="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span class="text-sm font-medium text-gray-900"
                    >Require Uppercase Letters (A-Z)</span
                  >
                </label>
                <p class="text-xs text-gray-500 mt-1">
                  Password must contain at least one uppercase letter
                </p>
              </div>

              <!-- Lowercase Letters -->
              <div class="bg-white p-4 rounded-md border border-gray-200">
                <label class="flex items-center gap-2">
                  <input
                    v-model="formData.requirements.requireLowercase"
                    type="checkbox"
                    class="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span class="text-sm font-medium text-gray-900"
                    >Require Lowercase Letters (a-z)</span
                  >
                </label>
                <p class="text-xs text-gray-500 mt-1">
                  Password must contain at least one lowercase letter
                </p>
              </div>

              <!-- Numbers -->
              <div class="bg-white p-4 rounded-md border border-gray-200">
                <label class="flex items-center gap-2">
                  <input
                    v-model="formData.requirements.requireNumbers"
                    type="checkbox"
                    class="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span class="text-sm font-medium text-gray-900"
                    >Require Numbers (0-9)</span
                  >
                </label>
                <p class="text-xs text-gray-500 mt-1">
                  Password must contain at least one number
                </p>
              </div>

              <!-- Special Characters -->
              <div class="bg-white p-4 rounded-md border border-gray-200">
                <label class="flex items-center gap-2">
                  <input
                    v-model="formData.requirements.requireSpecialChars"
                    type="checkbox"
                    class="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span class="text-sm font-medium text-gray-900"
                    >Require Special Characters (@$!%*?&)</span
                  >
                </label>
                <p class="text-xs text-gray-500 mt-1">
                  Password must contain at least one special character
                </p>
              </div>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">
              Description Preview
            </h3>
            <p
              class="text-sm text-gray-900 bg-white p-3 rounded border border-blue-200"
            >
              {{ generatedDescription }}
            </p>
            <p class="text-xs text-gray-600 mt-2">
              This description will be shown to users
            </p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white"
        >
          <button
            @click="showAddModal ? closeAddModal() : closeEditModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            @click="showAddModal ? addPasswordPolicy() : updatePasswordPolicy()"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{
              showAddModal
                ? submitting
                  ? "Adding..."
                  : "Add Policy"
                : submitting
                ? "Saving..."
                : "Save Changes"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div class="border-b px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Delete Password Policy
          </h2>
        </div>

        <div class="px-6 py-4">
          <p class="text-sm text-gray-600">
            Are you sure you want to delete
            <span class="font-semibold text-gray-900">{{
              selectedPolicy?.name || selectedPolicy?.name
            }}</span
            >? This action cannot be undone.
          </p>
        </div>

        <div class="border-t px-6 py-4 flex gap-3 justify-end">
          <button
            @click="closeDeleteModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            @click="deletePasswordPolicy"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

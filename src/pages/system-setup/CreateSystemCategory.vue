<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Trash2,
  Edit2,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";

const { success, error: showError } = useToast();

// State management
const categories = ref([]);
const passwordPolicies = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedCategory = ref(null);
const searchQuery = ref("");
const loading = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 100];

// Form data
const formData = ref({
  name: "",
  policy_id: "",
  description: "",
});

// Computed filtered categories based on search
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return categories.value;
  }
  const query = searchQuery.value.toLowerCase();
  return categories.value.filter(
    (category) =>
      category.name.toLowerCase().includes(query) ||
      (category.policy_name &&
        category.policy_name.toLowerCase().includes(query)) ||
      category.description.toLowerCase().includes(query)
  );
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredCategories.value.length / itemsPerPage.value);
});

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredCategories.value.slice(start, end);
});

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    filteredCategories.value.length
  );
  const total = filteredCategories.value.length;
  return `${start}-${end} of ${total}`;
});

// Helper function to get policy name by ID
const getPolicyName = (policyId) => {
  const policy = passwordPolicies.value.find((p) => p.id === policyId);
  return policy ? policy.name : "Unknown Policy";
};

// Load policies from API
const loadPolicies = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.POLICIES.LIST);
    const policiesData = response.data?.data || response.data;
    passwordPolicies.value = Array.isArray(policiesData) ? policiesData : [];
  } catch (err) {
    console.error("Error loading policies:", err);
    showError("Failed to load policies");
  }
};

// Load categories from API
const loadCategories = async () => {
  try {
    loading.value = true;
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
    const categoriesData = response.data?.data || response.data;
    categories.value = Array.isArray(categoriesData)
      ? categoriesData.map((category) => ({
          ...category,
          policy_name:
            category.policy?.name || getPolicyName(category.policy_id),
        }))
      : [];
  } catch (err) {
    console.error("Error loading categories:", err);
    showError("Failed to load categories");
  } finally {
    loading.value = false;
  }
};

// Open Add Modal
const openAddModal = () => {
  formData.value = { name: "", policy_id: "", description: "" };
  showAddModal.value = true;
};

// Close Add Modal
const closeAddModal = () => {
  showAddModal.value = false;
  formData.value = { name: "", policy_id: "", description: "" };
};

// Open Edit Modal
const openEditModal = (category) => {
  selectedCategory.value = category;
  formData.value = {
    name: category.name,
    policy_id: category.policy_id,
    description: category.description,
  };
  showEditModal.value = true;
};

// Close Edit Modal
const closeEditModal = () => {
  showEditModal.value = false;
  selectedCategory.value = null;
  formData.value = { name: "", policy_id: "", description: "" };
};

// Open Delete Modal
const openDeleteModal = (category) => {
  selectedCategory.value = category;
  showDeleteModal.value = true;
};

// Close Delete Modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedCategory.value = null;
};

// Add Category
const addCategory = async () => {
  if (!formData.value.name.trim() || !formData.value.policy_id) {
    showError("Category name and policy are required");
    return;
  }

  try {
    submitting.value = true;

    const categoryData = {
      name: formData.value.name,
      policy_id: Number(formData.value.policy_id),
      description: formData.value.description,
    };

    await apiClient.post(API_ENDPOINTS.CATEGORIES.CREATE, categoryData);

    await loadCategories();
    success("Category created successfully!");
    closeAddModal();
  } catch (err) {
    showError(err.message || "Failed to create category");
  } finally {
    submitting.value = false;
  }
};

// Update Category
const updateCategory = async () => {
  if (
    !formData.value.name.trim() ||
    !formData.value.policy_id ||
    !selectedCategory.value
  ) {
    showError("Category name and policy are required");
    return;
  }

  try {
    submitting.value = true;

    const categoryData = {
      name: formData.value.name,
      policy_id: Number(formData.value.policy_id),
      description: formData.value.description,
    };

    await apiClient.put(
      API_ENDPOINTS.CATEGORIES.UPDATE(selectedCategory.value.id),
      categoryData
    );

    await loadCategories();
    success("Category updated successfully!");
    closeEditModal();
  } catch (err) {
    showError(err.message || "Failed to update category");
  } finally {
    submitting.value = false;
  }
};

// Delete Category
const deleteCategory = async () => {
  if (!selectedCategory.value) return;

  try {
    submitting.value = true;
    await apiClient.delete(
      API_ENDPOINTS.CATEGORIES.DELETE(selectedCategory.value.id)
    );

    categories.value = categories.value.filter(
      (c) => c.id !== selectedCategory.value.id
    );
    success("Category deleted successfully!");
    closeDeleteModal();
  } catch (err) {
    showError(err.message || "Failed to delete category");
  } finally {
    submitting.value = false;
  }
};

// Pagination methods
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

onMounted(() => {
  loadPolicies();
  loadCategories();
});
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-0"
      >
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            System Categories
          </h1>
          <p class="text-gray-600 text-xs sm:text-sm mt-1">
            Manage system categories for organization and classification.
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 whitespace-nowrap"
        >
          <Plus class="h-4 w-4" />
          Add Category
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search categories by name, policy, or description..."
            class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div class="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          {{ filteredCategories.length }} result{{
            filteredCategories.length !== 1 ? "s" : ""
          }}
        </div>
      </div>

      <!-- Categories Table -->
      <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
          <span class="ml-2 text-gray-600">Loading categories...</span>
        </div>

        <!-- Content -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b bg-gray-50">
                <th
                  class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Name
                </th>
                <th
                  class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Password Policy
                </th>
                <th
                  class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell"
                >
                  Description
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
                v-for="category in paginatedCategories"
                :key="category.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td
                  class="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900"
                >
                  <div class="flex flex-col sm:block">
                    <span class="font-semibold">{{ category.name }}</span>
                    <span class="text-gray-600 sm:hidden text-xs mt-1">{{
                      category.policy_name
                    }}</span>
                  </div>
                </td>
                <td
                  class="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell"
                >
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ category.policy_name }}
                  </span>
                </td>
                <td
                  class="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell"
                >
                  {{ category.description }}
                </td>
                <td class="px-4 sm:px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1 sm:gap-2">
                    <button
                      @click="openEditModal(category)"
                      class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit2 class="h-4 w-4" />
                      <span class="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      @click="openDeleteModal(category)"
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

        <!-- Empty state -->
        <div
          v-if="filteredCategories.length === 0"
          class="px-4 sm:px-6 py-12 text-center"
        >
          <p class="text-gray-500 text-xs sm:text-sm">
            {{
              searchQuery.trim()
                ? "No categories match your search."
                : "No categories found. Create your first one."
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
      </div>
    </div>

    <!-- Add Category Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Add New Category</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-4 sm:px-6 py-4 space-y-4">
          <div>
            <label
              for="add-name"
              class="block text-xs sm:text-sm font-medium text-gray-900 mb-1"
              >Category Name <span class="text-red-600">*</span></label
            >
            <input
              id="add-name"
              v-model="formData.name"
              type="text"
              placeholder="Enter category name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="add-policy"
              class="block text-xs sm:text-sm font-medium text-gray-900 mb-1"
              >Password Policy <span class="text-red-600">*</span></label
            >
            <select
              id="add-policy"
              v-model="formData.policy_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="" disabled>Select a password policy</option>
              <option
                v-for="policy in passwordPolicies"
                :key="policy.id"
                :value="policy.id"
              >
                {{ policy.name }}
              </option>
            </select>
          </div>
          <div>
            <label
              for="add-description"
              class="block text-xs sm:text-sm font-medium text-gray-900 mb-1"
              >Description</label
            >
            <textarea
              id="add-description"
              v-model="formData.description"
              rows="3"
              placeholder="Enter category description"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            ></textarea>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="border-t px-4 sm:px-6 py-4 flex gap-2 sm:gap-3 justify-end">
          <button
            @click="closeAddModal"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            @click="addCategory"
            :disabled="
              !formData.name.trim() || !formData.policy_id || submitting
            "
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Adding..." : "Add Category" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Category Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Edit Category</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-4 sm:px-6 py-4 space-y-4">
          <div>
            <label
              for="edit-name"
              class="block text-xs sm:text-sm font-medium text-gray-900 mb-1"
              >Category Name <span class="text-red-600">*</span></label
            >
            <input
              id="edit-name"
              v-model="formData.name"
              type="text"
              placeholder="Enter category name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="edit-policy"
              class="block text-xs sm:text-sm font-medium text-gray-900 mb-1"
              >Password Policy <span class="text-red-600">*</span></label
            >
            <select
              id="edit-policy"
              v-model="formData.policy_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="" disabled>Select a password policy</option>
              <option
                v-for="policy in passwordPolicies"
                :key="policy.id"
                :value="policy.id"
              >
                {{ policy.name }}
              </option>
            </select>
          </div>
          <div>
            <label
              for="edit-description"
              class="block text-xs sm:text-sm font-medium text-gray-900 mb-1"
              >Description</label
            >
            <textarea
              id="edit-description"
              v-model="formData.description"
              rows="3"
              placeholder="Enter category description"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            ></textarea>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="border-t px-4 sm:px-6 py-4 flex gap-2 sm:gap-3 justify-end">
          <button
            @click="closeEditModal"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            @click="updateCategory"
            :disabled="
              !formData.name.trim() || !formData.policy_id || submitting
            "
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <!-- Modal Header -->
        <div class="border-b px-4 sm:px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Delete Category</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-4 sm:px-6 py-4">
          <p class="text-xs sm:text-sm text-gray-600">
            Are you sure you want to delete
            <span class="font-semibold text-gray-900">{{
              selectedCategory?.name
            }}</span
            >? This action cannot be undone.
          </p>
        </div>

        <!-- Modal Footer -->
        <div class="border-t px-4 sm:px-6 py-4 flex gap-2 sm:gap-3 justify-end">
          <button
            @click="closeDeleteModal"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            @click="deleteCategory"
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

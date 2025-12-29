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
const systems = ref([]);
const categories = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedSystem = ref(null);
const searchQuery = ref("");
const loading = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 100];

// Form data
const formData = ref({
  system_name: "",
  category_id: null,
});

// Computed filtered systems based on search
const filteredSystems = computed(() => {
  if (!searchQuery.value.trim()) {
    return systems.value;
  }
  const query = searchQuery.value.toLowerCase();
  return systems.value.filter(
    (system) =>
      system.system_name?.toLowerCase().includes(query) ||
      (system.category_name &&
        system.category_name.toLowerCase().includes(query))
  );
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredSystems.value.length / itemsPerPage.value);
});

const paginatedSystems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSystems.value.slice(start, end);
});

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    filteredSystems.value.length
  );
  const total = filteredSystems.value.length;
  return `${start}-${end} of ${total}`;
});

// Helper function to get category name by ID
const getCategoryName = (categoryId) => {
  const category = categories.value.find((c) => c.id === categoryId);
  return category ? category.name : "Unknown Category";
};

// Load categories from API
const loadCategories = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
    const categoriesData = response.data?.data || response.data;
    categories.value = Array.isArray(categoriesData) ? categoriesData : [];
  } catch (err) {
    console.error("Error loading categories:", err);
    showError("Failed to load categories");
  }
};

// Load systems from API
const loadSystems = async () => {
  try {
    loading.value = true;
    const response = await apiClient.get(API_ENDPOINTS.SYSTEMS.LIST);
    const systemsData = response.data?.data || response.data;
    systems.value = Array.isArray(systemsData)
      ? systemsData.map((system) => ({
          ...system,
          category_name:
            system.category?.name || getCategoryName(system.category_id),
        }))
      : [];
  } catch (err) {
    console.error("Error loading systems:", err);
    showError("Failed to load systems");
  } finally {
    loading.value = false;
  }
};

// Open Add Modal
const openAddModal = () => {
  formData.value = { system_name: "", category_id: "" };
  showAddModal.value = true;
};

// Close Add Modal
const closeAddModal = () => {
  showAddModal.value = false;
  formData.value = { system_name: "", category_id: "" };
};

// Open Edit Modal
const openEditModal = (system) => {
  selectedSystem.value = system;
  formData.value = {
    system_name: system.system_name,
    category_id: Number(system.category_id),
  };
  showEditModal.value = true;
};

// Close Edit Modal
const closeEditModal = () => {
  showEditModal.value = false;
  selectedSystem.value = null;
  formData.value = { system_name: "", category_id: "" };
};

// Open Delete Modal
const openDeleteModal = (system) => {
  selectedSystem.value = system;
  showDeleteModal.value = true;
};

// Close Delete Modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedSystem.value = null;
};

// Add System
const addSystem = async () => {
  if (!formData.value.system_name.trim() || !formData.value.category_id) {
    showError("System name and category are required");
    return;
  }

  try {
    submitting.value = true;

    const systemData = {
      system_name: formData.value.system_name,
      category_id: Number(formData.value.category_id),
    };

    await apiClient.post(API_ENDPOINTS.SYSTEMS.CREATE, systemData);

    await loadSystems();
    success("System created successfully!");
    closeAddModal();
  } catch (err) {
    showError(err.message || "Failed to create system");
  } finally {
    submitting.value = false;
  }
};

// Update System
const updateSystem = async () => {
  if (
    !formData.value.system_name.trim() ||
    !formData.value.category_id ||
    !selectedSystem.value
  ) {
    showError("System name and category are required");
    return;
  }

  try {
    submitting.value = true;

    const systemData = {
      system_name: formData.value.system_name,
      category_id: Number(formData.value.category_id),
    };

    await apiClient.put(
      API_ENDPOINTS.SYSTEMS.UPDATE(selectedSystem.value.id),
      systemData
    );

    await loadSystems();
    success("System updated successfully!");
    closeEditModal();
  } catch (err) {
    showError(err.message || "Failed to update system");
  } finally {
    submitting.value = false;
  }
};

// Delete System
const deleteSystem = async () => {
  if (!selectedSystem.value) return;

  try {
    submitting.value = true;
    await apiClient.delete(
      API_ENDPOINTS.SYSTEMS.DELETE(selectedSystem.value.id)
    );

    systems.value = systems.value.filter(
      (s) => s.id !== selectedSystem.value.id
    );
    success("System deleted successfully!");
    closeDeleteModal();
  } catch (err) {
    showError(err.message || "Failed to delete system");
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
  loadCategories();
  loadSystems();
});
</script>

<template>
  <BaseLayout>
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">System Setup</h1>
          <p class="text-gray-600 text-sm mt-1">
            Manage systems and assign them to categories.
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          <Plus class="h-4 w-4" />
          Add System
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mb-6 flex items-center gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search systems by name or category..."
            class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div class="text-sm text-gray-600">
          {{ filteredSystems.length }} result{{
            filteredSystems.length !== 1 ? "s" : ""
          }}
        </div>
      </div>

      <!-- Systems Table -->
      <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
          <span class="ml-2 text-gray-600">Loading systems...</span>
        </div>

        <!-- Content -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b bg-gray-50">
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  System Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Category
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
                v-for="system in paginatedSystems"
                :key="system.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ system.system_name }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ system.category_name }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <button
                      @click="openEditModal(system)"
                      class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit2 class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      @click="openDeleteModal(system)"
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
          v-if="filteredSystems.length === 0 && !loading"
          class="px-6 py-12 text-center"
        >
          <p class="text-gray-500 text-sm">
            {{
              searchQuery.trim()
                ? "No systems match your search."
                : "No systems found. Create your first one."
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

    <!-- Add System Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-6 py-4 sticky top-0 bg-white">
          <h2 class="text-lg font-semibold text-gray-900">Add System</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4 space-y-4">
          <div>
            <label
              for="add-name"
              class="block text-sm font-medium text-gray-900 mb-1"
            >
              System Name <span class="text-red-600">*</span>
            </label>
            <input
              id="add-name"
              v-model="formData.system_name"
              type="text"
              placeholder="Enter system name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="add-category"
              class="block text-sm font-medium text-gray-900 mb-1"
            >
              Category <span class="text-red-600">*</span>
            </label>
            <select
              id="add-category"
              v-model.number="formData.category_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option :value="null" disabled>Select a category</option>
              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white"
        >
          <button
            @click="closeAddModal"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="addSystem"
            :disabled="
              !formData.system_name.trim() ||
              !formData.category_id ||
              submitting
            "
            class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? "Adding..." : "Add System" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit System Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div class="border-b px-6 py-4 sticky top-0 bg-white">
          <h2 class="text-lg font-semibold text-gray-900">Edit System</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4 space-y-4">
          <div>
            <label
              for="edit-name"
              class="block text-sm font-medium text-gray-900 mb-1"
            >
              System Name <span class="text-red-600">*</span>
            </label>
            <input
              id="edit-name"
              v-model="formData.system_name"
              type="text"
              placeholder="Enter system name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label
              for="edit-category"
              class="block text-sm font-medium text-gray-900 mb-1"
            >
              Category <span class="text-red-600">*</span>
            </label>
            <select
              id="edit-category"
              v-model.number="formData.category_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option :value="null" disabled>Select a category</option>
              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white"
        >
          <button
            @click="closeEditModal"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="updateSystem"
            :disabled="
              !formData.system_name.trim() ||
              !formData.category_id ||
              submitting
            "
            class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 inline-flex items-center gap-2"
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
          <h2 class="text-lg font-semibold text-gray-900">Delete System</h2>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4">
          <p class="text-sm text-gray-600">
            Are you sure you want to delete
            <span class="font-semibold text-gray-900">{{
              selectedSystem?.system_name
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
            @click="deleteSystem"
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

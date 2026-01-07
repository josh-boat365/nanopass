<script setup>
import { ref, onMounted, computed } from "vue";
import {
  Trash2,
  Edit2,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";

const { success, error: showError } = useToast();

// State management
const departments = ref([]);
const loading = ref(true);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedDepartment = ref(null);
const searchQuery = ref("");
const submitting = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [10, 25, 50, 100];

// Form data
const formData = ref({
  department_name: "",
});

// Fetch departments
const fetchDepartments = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get(API_ENDPOINTS.DEPARTMENTS.LIST);
    departments.value = response.data.data || [];
    console.log("📊 Departments loaded:", departments.value);
  } catch (err) {
    console.error("❌ Error fetching departments:", err);
    showError(err.response?.data?.message || "Failed to load departments");
  } finally {
    loading.value = false;
  }
};

// Load departments on mount
onMounted(() => {
  fetchDepartments();
});

// Computed filtered departments
const filteredDepartments = computed(() => {
  if (!searchQuery.value.trim()) {
    return departments.value;
  }
  const query = searchQuery.value.toLowerCase();
  return departments.value.filter((dept) =>
    dept.department_name?.toLowerCase().includes(query)
  );
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredDepartments.value.length / itemsPerPage.value);
});

const paginatedDepartments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredDepartments.value.slice(start, end);
});

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    filteredDepartments.value.length
  );
  return `${start}-${end} of ${filteredDepartments.value.length}`;
});

// Pagination handlers
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

// Modal handlers
const openAddModal = () => {
  formData.value = { department_name: "" };
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
  formData.value = { department_name: "" };
};

const openEditModal = (dept) => {
  selectedDepartment.value = dept;
  formData.value = { department_name: dept.department_name };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedDepartment.value = null;
  formData.value = { department_name: "" };
};

const openDeleteModal = (dept) => {
  selectedDepartment.value = dept;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedDepartment.value = null;
};

// Add department
const addDepartment = async () => {
  if (!formData.value.department_name.trim()) {
    showError("Department name is required");
    return;
  }

  submitting.value = true;
  try {
    const response = await apiClient.post(API_ENDPOINTS.DEPARTMENTS.CREATE, {
      department_name: formData.value.department_name,
    });

    departments.value.push(response.data.data);
    success("Department created successfully");
    closeAddModal();
  } catch (err) {
    console.error("❌ Error creating department:", err);
    showError(err.response?.data?.message || "Failed to create department");
  } finally {
    submitting.value = false;
  }
};

// Update department
const updateDepartment = async () => {
  if (!formData.value.department_name.trim()) {
    showError("Department name is required");
    return;
  }

  submitting.value = true;
  try {
    const response = await apiClient.put(
      API_ENDPOINTS.DEPARTMENTS.UPDATE(selectedDepartment.value.id),
      {
        department_name: formData.value.department_name,
      }
    );

    const index = departments.value.findIndex(
      (d) => d.id === selectedDepartment.value.id
    );
    if (index !== -1) {
      departments.value[index] = response.data.data;
    }

    success("Department updated successfully");
    closeEditModal();
  } catch (err) {
    console.error("❌ Error updating department:", err);
    showError(err.response?.data?.message || "Failed to update department");
  } finally {
    submitting.value = false;
  }
};

// Delete department
const deleteDepartment = async () => {
  submitting.value = true;
  try {
    await apiClient.delete(
      API_ENDPOINTS.DEPARTMENTS.DELETE(selectedDepartment.value.id)
    );

    departments.value = departments.value.filter(
      (d) => d.id !== selectedDepartment.value.id
    );

    success("Department deleted successfully");
    closeDeleteModal();
  } catch (err) {
    console.error("❌ Error deleting department:", err);
    showError(
      err.response?.data?.message ||
        "Failed to delete department. It may have associated users."
    );
  } finally {
    submitting.value = false;
  }
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
            Department Management
          </h1>
          <p class="text-gray-600 text-xs sm:text-sm mt-1">
            Create, update, and manage departments.
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 whitespace-nowrap"
        >
          <Plus class="h-4 w-4" />
          Create Department
        </button>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading && !submitting"
        class="flex items-center justify-center py-12"
      >
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
        <span class="ml-2 text-gray-600">Loading departments...</span>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- Search Bar -->
        <div
          class="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4"
        >
          <div class="flex-1 w-full">
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Search departments by name..."
              class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div class="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
            {{ filteredDepartments.length }} result{{
              filteredDepartments.length !== 1 ? "s" : ""
            }}
          </div>
        </div>

        <!-- Table -->
        <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-gray-50">
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Department
                  </th>
                  <th
                    class="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Created
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
                  v-for="dept in paginatedDepartments"
                  :key="dept.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td
                    class="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900"
                  >
                    <div class="flex flex-col">
                      <span>{{ dept.department_name }}</span>
                    </div>
                  </td>
                  <td
                    class="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                  >
                    {{
                      new Date(dept.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    }}
                  </td>
                  <td class="px-4 sm:px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1 sm:gap-2">
                      <button
                        @click="openEditModal(dept)"
                        class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 class="h-4 w-4" />
                        <span class="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        @click="openDeleteModal(dept)"
                        class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
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
          v-if="paginatedDepartments.length === 0"
          class="px-4 sm:px-6 py-12 text-center rounded-lg border bg-white"
        >
          <p class="text-gray-500 text-xs sm:text-sm">
            {{
              searchQuery.trim()
                ? "No departments match your search."
                : "No departments found. Create your first department."
            }}
          </p>
        </div>
      </template>

      <!-- Add Modal -->
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <div
          class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <!-- Modal Header -->
          <div class="border-b px-4 sm:px-6 py-4 sticky top-0 bg-white">
            <h2 class="text-lg font-semibold text-gray-900">
              Create Department
            </h2>
          </div>

          <!-- Modal Body -->
          <form
            @submit.prevent="addDepartment"
            class="px-4 sm:px-6 py-4 space-y-4"
          >
            <div>
              <label
                for="add-name"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Department Name *
              </label>
              <input
                id="add-name"
                v-model="formData.department_name"
                type="text"
                required
                placeholder="Enter department name"
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
                {{ submitting ? "Creating..." : "Create Department" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Modal -->
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <div
          class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <!-- Modal Header -->
          <div class="border-b px-4 sm:px-6 py-4 sticky top-0 bg-white">
            <h2 class="text-lg font-semibold text-gray-900">Edit Department</h2>
          </div>

          <!-- Modal Body -->
          <form
            @submit.prevent="updateDepartment"
            class="px-4 sm:px-6 py-4 space-y-4"
          >
            <div>
              <label
                for="edit-name"
                class="block text-sm font-medium text-gray-900 mb-1"
              >
                Department Name *
              </label>
              <input
                id="edit-name"
                v-model="formData.department_name"
                type="text"
                required
                placeholder="Enter department name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
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
            <h2 class="text-lg font-semibold text-gray-900">
              Delete Department
            </h2>
          </div>

          <!-- Modal Body -->
          <div class="px-4 sm:px-6 py-4">
            <p class="text-xs sm:text-sm text-gray-600">
              Are you sure you want to delete
              <span class="font-semibold text-gray-900">{{
                selectedDepartment?.department_name
              }}</span
              >? This action cannot be undone.
            </p>
          </div>

          <!-- Modal Footer -->
          <div
            class="border-t px-4 sm:px-6 py-4 flex gap-2 sm:gap-3 justify-end"
          >
            <button
              @click="closeDeleteModal"
              :disabled="submitting"
              class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              @click="deleteDepartment"
              :disabled="submitting"
              class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 inline-flex items-center gap-2"
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

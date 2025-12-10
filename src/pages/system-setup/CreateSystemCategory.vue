<script setup>
import { ref } from "vue";
import { Trash2, Edit2, Plus } from "lucide-vue-next";
import BaseLayout from "@/layouts/AppLayout.vue";

// State management
const categories = ref([
  {
    id: 1,
    name: "General",
    description: "General system settings and configurations.",
  },
  {
    id: 2,
    name: "Security",
    description: "Security-related settings and policies.",
  },
  {
    id: 3,
    name: "Performance",
    description: "Performance optimization settings.",
  },
]);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedCategory = ref(null);
const searchQuery = ref("");

// Form data
const formData = ref({
  name: "",
  description: "",
});

// Computed filtered categories based on search
const filteredCategories = ref([]);
const updateFilteredCategories = () => {
  if (!searchQuery.value.trim()) {
    filteredCategories.value = categories.value;
    return;
  }
  const query = searchQuery.value.toLowerCase();
  filteredCategories.value = categories.value.filter(
    (category) =>
      category.name.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query)
  );
};

// Open Add Modal
const openAddModal = () => {
  formData.value = { name: "", description: "" };
  showAddModal.value = true;
};

// Close Add Modal
const closeAddModal = () => {
  showAddModal.value = false;
  formData.value = { name: "", description: "" };
};

// Open Edit Modal
const openEditModal = (category) => {
  selectedCategory.value = category;
  formData.value = { name: category.name, description: category.description };
  showEditModal.value = true;
};

// Close Edit Modal
const closeEditModal = () => {
  showEditModal.value = false;
  selectedCategory.value = null;
  formData.value = { name: "", description: "" };
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
const addCategory = () => {
  if (formData.value.name.trim()) {
    categories.value.push({
      id: Math.max(...categories.value.map((c) => c.id), 0) + 1,
      name: formData.value.name,
      description: formData.value.description,
    });
    updateFilteredCategories();
    closeAddModal();
  }
};

// Update Category
const updateCategory = () => {
  if (formData.value.name.trim() && selectedCategory.value) {
    const index = categories.value.findIndex(
      (c) => c.id === selectedCategory.value.id
    );
    if (index > -1) {
      categories.value[index].name = formData.value.name;
      categories.value[index].description = formData.value.description;
    }
    closeEditModal();
  }
};

// Delete Category
const deleteCategory = () => {
  categories.value = categories.value.filter(
    (c) => c.id !== selectedCategory.value.id
  );
  updateFilteredCategories();
  closeDeleteModal();
};

// Initialize filtered categories on component mount
updateFilteredCategories();
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
            @input="updateFilteredCategories"
            type="text"
            placeholder="Search categories..."
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
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b bg-gray-50">
                <th
                  class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  Name
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
                v-for="category in filteredCategories"
                :key="category.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td
                  class="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900"
                >
                  <div class="flex flex-col sm:block">
                    <span class="font-semibold">{{ category.name }}</span>
                    <span class="text-gray-600 sm:hidden text-xs">{{
                      category.description
                    }}</span>
                  </div>
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
              >Category Name</label
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
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            Add Category
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
              >Category Name</label
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
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            Save Changes
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
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

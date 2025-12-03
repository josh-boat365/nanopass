<script setup>
import { ref } from 'vue'
import { Trash2, Edit2, Plus } from 'lucide-vue-next'
import BaseLayout from '@/layouts/AppLayout.vue'

// Sample categories (would typically come from an API or parent component)
const availableCategories = ref([
    { id: 1, name: 'General' },
    { id: 2, name: 'Security' },
    { id: 3, name: 'Performance' },
])

// State management
const passwordPolicies = ref([
    {
        id: 1,
        categoryId: 1,
        categoryName: 'General',
        name: 'Basic Password',
        regex: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$',
        description: 'Minimum 8 characters with letters and numbers',
        expirationDays: 90
    },
    {
        id: 2,
        categoryId: 2,
        categoryName: 'Security',
        name: 'Strong Password',
        regex: '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$',
        description: 'Minimum 12 chars with uppercase, lowercase, number, and special char',
        expirationDays: 60
    },
])

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedPolicy = ref(null)
const searchQuery = ref('')

// Form data
const formData = ref({
    categoryId: '',
    name: '',
    regex: '',
    expirationDays: '',
})

// Computed filtered policies based on search
const filteredPolicies = ref([])
const updateFilteredPolicies = () => {
    if (!searchQuery.value.trim()) {
        filteredPolicies.value = passwordPolicies.value
        return
    }
    const query = searchQuery.value.toLowerCase()
    filteredPolicies.value = passwordPolicies.value.filter(policy =>
        policy.name.toLowerCase().includes(query) ||
        policy.categoryName.toLowerCase().includes(query) ||
        policy.regex.toLowerCase().includes(query)
    )
}

// Get category name by ID
const getCategoryName = (categoryId) => {
    const category = availableCategories.value.find(c => c.id === categoryId)
    return category?.name || 'Unknown'
}

// Open Add Modal
const openAddModal = () => {
    formData.value = { categoryId: '', name: '', regex: '', expirationDays: '' }
    showAddModal.value = true
}

// Close Add Modal
const closeAddModal = () => {
    showAddModal.value = false
    formData.value = { categoryId: '', name: '', regex: '', expirationDays: '' }
}

// Open Edit Modal
const openEditModal = (policy) => {
    selectedPolicy.value = policy
    formData.value = {
        categoryId: policy.categoryId,
        name: policy.name,
        regex: policy.regex,
        expirationDays: policy.expirationDays
    }
    showEditModal.value = true
}

// Close Edit Modal
const closeEditModal = () => {
    showEditModal.value = false
    selectedPolicy.value = null
    formData.value = { categoryId: '', name: '', regex: '', expirationDays: '' }
}

// Open Delete Modal
const openDeleteModal = (policy) => {
    selectedPolicy.value = policy
    showDeleteModal.value = true
}

// Close Delete Modal
const closeDeleteModal = () => {
    showDeleteModal.value = false
    selectedPolicy.value = null
}

// Add Password Policy
const addPasswordPolicy = () => {
    if (formData.value.categoryId && formData.value.name.trim() && formData.value.regex.trim() && formData.value.expirationDays) {
        const categoryName = getCategoryName(parseInt(formData.value.categoryId))
        passwordPolicies.value.push({
            id: Math.max(...passwordPolicies.value.map(p => p.id), 0) + 1,
            categoryId: parseInt(formData.value.categoryId),
            categoryName: categoryName,
            name: formData.value.name,
            regex: formData.value.regex,
            expirationDays: parseInt(formData.value.expirationDays),
        })
        updateFilteredPolicies()
        closeAddModal()
    }
}

// Update Password Policy
const updatePasswordPolicy = () => {
    if (formData.value.categoryId && formData.value.name.trim() && formData.value.regex.trim() && formData.value.expirationDays && selectedPolicy.value) {
        const index = passwordPolicies.value.findIndex(p => p.id === selectedPolicy.value.id)
        if (index > -1) {
            const categoryName = getCategoryName(parseInt(formData.value.categoryId))
            passwordPolicies.value[index].categoryId = parseInt(formData.value.categoryId)
            passwordPolicies.value[index].categoryName = categoryName
            passwordPolicies.value[index].name = formData.value.name
            passwordPolicies.value[index].regex = formData.value.regex
            passwordPolicies.value[index].expirationDays = parseInt(formData.value.expirationDays)
        }
        closeEditModal()
    }
}

// Delete Password Policy
const deletePasswordPolicy = () => {
    passwordPolicies.value = passwordPolicies.value.filter(p => p.id !== selectedPolicy.value.id)
    updateFilteredPolicies()
    closeDeleteModal()
}

// Initialize filtered policies on component mount
updateFilteredPolicies()
</script>

<template>
    <BaseLayout>
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">System Password Policies</h1>
                    <p class="text-gray-600 text-sm mt-1">Manage password validation policies tied to system categories.
                    </p>
                </div>
                <button @click="openAddModal"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                    <Plus class="h-4 w-4" />
                    Add Password Policy
                </button>
            </div>

            <!-- Search Bar -->
            <div class="mb-6 flex items-center gap-4">
                <div class="flex-1">
                    <input v-model="searchQuery" @input="updateFilteredPolicies" type="text"
                        placeholder="Search policies by name, category, or pattern..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div class="text-sm text-gray-600">
                    {{ filteredPolicies.length }} result{{ filteredPolicies.length !== 1 ? 's' : '' }}
                </div>
            </div>

            <!-- Password Policies Table -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b bg-gray-50">
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Category
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Policy Name
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Regex Pattern
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Expiration (Days)
                                </th>
                                <th
                                    class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="policy in filteredPolicies" :key="policy.id"
                                class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {{ policy.categoryName }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                                    {{ policy.name }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600 font-mono text-xs max-w-xs truncate">
                                    {{ policy.regex }}
                                </td>
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                                    {{ policy.expirationDays }} days
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-3">
                                        <button @click="openEditModal(policy)"
                                            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                            <Edit2 class="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button @click="openDeleteModal(policy)"
                                            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
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
                <div v-if="filteredPolicies.length === 0" class="px-6 py-12 text-center">
                    <p class="text-gray-500 text-sm">
                        {{ searchQuery.trim() ? 'No policies match your search.' : 'No password policies found. Create your first one.' }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Add Password Policy Modal -->
        <div v-if="showAddModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4 sticky top-0 bg-white">
                    <h2 class="text-lg font-semibold text-gray-900">Add Password Policy</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="add-category" class="block text-sm font-medium text-gray-900 mb-1">System
                            Category</label>
                        <select id="add-category" v-model="formData.categoryId"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">Select a category</option>
                            <option v-for="category in availableCategories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="add-name" class="block text-sm font-medium text-gray-900 mb-1">Policy Name</label>
                        <input id="add-name" v-model="formData.name" type="text" placeholder="e.g., Strong Password"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="add-regex" class="block text-sm font-medium text-gray-900 mb-1">Regex
                            Pattern</label>
                        <textarea id="add-regex" v-model="formData.regex" rows="4"
                            placeholder="e.g., ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono text-xs"></textarea>
                        <p class="text-xs text-gray-500 mt-1">Enter a regular expression for password validation</p>
                    </div>
                    <div>
                        <label for="add-expiration" class="block text-sm font-medium text-gray-900 mb-1">Password
                            Expiration (Days)</label>
                        <input id="add-expiration" v-model="formData.expirationDays" type="number" min="1"
                            placeholder="e.g., 90"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                        <p class="text-xs text-gray-500 mt-1">Number of days before password expires</p>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white">
                    <button @click="closeAddModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="addPasswordPolicy"
                        class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                        Add Policy
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit Password Policy Modal -->
        <div v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4 sticky top-0 bg-white">
                    <h2 class="text-lg font-semibold text-gray-900">Edit Password Policy</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="edit-category" class="block text-sm font-medium text-gray-900 mb-1">System
                            Category</label>
                        <select id="edit-category" v-model="formData.categoryId"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">Select a category</option>
                            <option v-for="category in availableCategories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="edit-name" class="block text-sm font-medium text-gray-900 mb-1">Policy Name</label>
                        <input id="edit-name" v-model="formData.name" type="text" placeholder="e.g., Strong Password"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="edit-regex" class="block text-sm font-medium text-gray-900 mb-1">Regex
                            Pattern</label>
                        <textarea id="edit-regex" v-model="formData.regex" rows="4"
                            placeholder="e.g., ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono text-xs"></textarea>
                        <p class="text-xs text-gray-500 mt-1">Enter a regular expression for password validation</p>
                    </div>
                    <div>
                        <label for="edit-expiration" class="block text-sm font-medium text-gray-900 mb-1">Password
                            Expiration (Days)</label>
                        <input id="edit-expiration" v-model="formData.expirationDays" type="number" min="1"
                            placeholder="e.g., 90"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                        <p class="text-xs text-gray-500 mt-1">Number of days before password expires</p>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white">
                    <button @click="closeEditModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="updatePasswordPolicy"
                        class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4">
                    <h2 class="text-lg font-semibold text-gray-900">Delete Password Policy</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4">
                    <p class="text-sm text-gray-600">
                        Are you sure you want to delete <span class="font-semibold text-gray-900">{{
                            selectedPolicy?.name }}</span>? This action cannot be undone.
                    </p>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end">
                    <button @click="closeDeleteModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="deletePasswordPolicy"
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </BaseLayout>
</template>

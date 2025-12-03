<script setup>
import { ref } from 'vue'
import { Trash2, Edit2, Plus } from 'lucide-vue-next'
import BaseLayout from '@/layouts/AppLayout.vue'

// Sample password policies (would typically come from an API or parent component)
const availablePasswordPolicies = ref([
    { id: 1, name: 'Basic Password', categoryName: 'General' },
    { id: 2, name: 'Strong Password', categoryName: 'Security' },
    { id: 3, name: 'Advanced Password', categoryName: 'Performance' },
])

// State management
const systems = ref([
    {
        id: 1,
        name: 'Main Production',
        description: 'Primary production system',
        passwordPolicyId: 2,
        passwordPolicyName: 'Strong Password'
    },
    {
        id: 2,
        name: 'Staging Environment',
        description: 'Staging and testing environment',
        passwordPolicyId: 1,
        passwordPolicyName: 'Basic Password'
    },
])

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedSystem = ref(null)
const searchQuery = ref('')

// Form data
const formData = ref({
    name: '',
    description: '',
    passwordPolicyId: '',
})

// Computed filtered systems based on search
const filteredSystems = ref([])
const updateFilteredSystems = () => {
    if (!searchQuery.value.trim()) {
        filteredSystems.value = systems.value
        return
    }
    const query = searchQuery.value.toLowerCase()
    filteredSystems.value = systems.value.filter(system =>
        system.name.toLowerCase().includes(query) ||
        system.description.toLowerCase().includes(query) ||
        system.passwordPolicyName.toLowerCase().includes(query)
    )
}

// Get password policy name by ID
const getPasswordPolicyName = (policyId) => {
    const policy = availablePasswordPolicies.value.find(p => p.id === policyId)
    return policy?.name || 'Unknown'
}

// Open Add Modal
const openAddModal = () => {
    formData.value = { name: '', description: '', passwordPolicyId: '' }
    showAddModal.value = true
}

// Close Add Modal
const closeAddModal = () => {
    showAddModal.value = false
    formData.value = { name: '', description: '', passwordPolicyId: '' }
}

// Open Edit Modal
const openEditModal = (system) => {
    selectedSystem.value = system
    formData.value = {
        name: system.name,
        description: system.description,
        passwordPolicyId: system.passwordPolicyId
    }
    showEditModal.value = true
}

// Close Edit Modal
const closeEditModal = () => {
    showEditModal.value = false
    selectedSystem.value = null
    formData.value = { name: '', description: '', passwordPolicyId: '' }
}

// Open Delete Modal
const openDeleteModal = (system) => {
    selectedSystem.value = system
    showDeleteModal.value = true
}

// Close Delete Modal
const closeDeleteModal = () => {
    showDeleteModal.value = false
    selectedSystem.value = null
}

// Add System
const addSystem = () => {
    if (formData.value.name.trim() && formData.value.passwordPolicyId) {
        const policyName = getPasswordPolicyName(parseInt(formData.value.passwordPolicyId))
        systems.value.push({
            id: Math.max(...systems.value.map(s => s.id), 0) + 1,
            name: formData.value.name,
            description: formData.value.description,
            passwordPolicyId: parseInt(formData.value.passwordPolicyId),
            passwordPolicyName: policyName,
        })
        updateFilteredSystems()
        closeAddModal()
    }
}

// Update System
const updateSystem = () => {
    if (formData.value.name.trim() && formData.value.passwordPolicyId && selectedSystem.value) {
        const index = systems.value.findIndex(s => s.id === selectedSystem.value.id)
        if (index > -1) {
            const policyName = getPasswordPolicyName(parseInt(formData.value.passwordPolicyId))
            systems.value[index].name = formData.value.name
            systems.value[index].description = formData.value.description
            systems.value[index].passwordPolicyId = parseInt(formData.value.passwordPolicyId)
            systems.value[index].passwordPolicyName = policyName
        }
        closeEditModal()
    }
}

// Delete System
const deleteSystem = () => {
    systems.value = systems.value.filter(s => s.id !== selectedSystem.value.id)
    updateFilteredSystems()
    closeDeleteModal()
}

// Initialize filtered systems on component mount
updateFilteredSystems()
</script>

<template>
    <BaseLayout>
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">System Setup</h1>
                    <p class="text-gray-600 text-sm mt-1">Manage systems and assign password policies to them.</p>
                </div>
                <button @click="openAddModal"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                    <Plus class="h-4 w-4" />
                    Add System
                </button>
            </div>

            <!-- Search Bar -->
            <div class="mb-6 flex items-center gap-4">
                <div class="flex-1">
                    <input v-model="searchQuery" @input="updateFilteredSystems" type="text"
                        placeholder="Search systems by name, description, or policy..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div class="text-sm text-gray-600">
                    {{ filteredSystems.length }} result{{ filteredSystems.length !== 1 ? 's' : '' }}
                </div>
            </div>

            <!-- Systems Table -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b bg-gray-50">
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    System Name
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Description
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Password Policy
                                </th>
                                <th
                                    class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="system in filteredSystems" :key="system.id"
                                class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                                    {{ system.name }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600">
                                    {{ system.description }}
                                </td>
                                <td class="px-6 py-4 text-sm">
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {{ system.passwordPolicyName }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-3">
                                        <button @click="openEditModal(system)"
                                            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                            <Edit2 class="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button @click="openDeleteModal(system)"
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
                <div v-if="filteredSystems.length === 0" class="px-6 py-12 text-center">
                    <p class="text-gray-500 text-sm">
                        {{ searchQuery.trim() ? 'No systems match your search.' : 'No systems found. Create your first one.' }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Add System Modal -->
        <div v-if="showAddModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4 sticky top-0 bg-white">
                    <h2 class="text-lg font-semibold text-gray-900">Add System</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="add-name" class="block text-sm font-medium text-gray-900 mb-1">System Name</label>
                        <input id="add-name" v-model="formData.name" type="text" placeholder="Enter system name"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="add-description"
                            class="block text-sm font-medium text-gray-900 mb-1">Description</label>
                        <textarea id="add-description" v-model="formData.description" rows="3"
                            placeholder="Enter system description"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"></textarea>
                    </div>
                    <div>
                        <label for="add-policy" class="block text-sm font-medium text-gray-900 mb-1">System Password
                            Policy</label>
                        <select id="add-policy" v-model="formData.passwordPolicyId"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">Select a password policy</option>
                            <option v-for="policy in availablePasswordPolicies" :key="policy.id" :value="policy.id">
                                {{ policy.name }} ({{ policy.categoryName }})
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white">
                    <button @click="closeAddModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="addSystem"
                        class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                        Add System
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit System Modal -->
        <div v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4 sticky top-0 bg-white">
                    <h2 class="text-lg font-semibold text-gray-900">Edit System</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="edit-name" class="block text-sm font-medium text-gray-900 mb-1">System Name</label>
                        <input id="edit-name" v-model="formData.name" type="text" placeholder="Enter system name"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="edit-description"
                            class="block text-sm font-medium text-gray-900 mb-1">Description</label>
                        <textarea id="edit-description" v-model="formData.description" rows="3"
                            placeholder="Enter system description"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"></textarea>
                    </div>
                    <div>
                        <label for="edit-policy" class="block text-sm font-medium text-gray-900 mb-1">System Password
                            Policy</label>
                        <select id="edit-policy" v-model="formData.passwordPolicyId"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">Select a password policy</option>
                            <option v-for="policy in availablePasswordPolicies" :key="policy.id" :value="policy.id">
                                {{ policy.name }} ({{ policy.categoryName }})
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white">
                    <button @click="closeEditModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="updateSystem"
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
                    <h2 class="text-lg font-semibold text-gray-900">Delete System</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4">
                    <p class="text-sm text-gray-600">
                        Are you sure you want to delete <span class="font-semibold text-gray-900">{{
                            selectedSystem?.name }}</span>? This action cannot be undone.
                    </p>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end">
                    <button @click="closeDeleteModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="deleteSystem"
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </BaseLayout>
</template>

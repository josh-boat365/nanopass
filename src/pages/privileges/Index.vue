<script setup>
import { ref } from 'vue'
import { Trash2, Edit2, Plus } from 'lucide-vue-next'
import BaseLayout from '@/layouts/AppLayout.vue'

// State management
const privileges = ref([
    { id: 1, name: 'Admin', description: 'Full access to all features and settings.' },
    { id: 2, name: 'Editor', description: 'Can create and edit content but cannot change settings.' },
    { id: 3, name: 'Viewer', description: 'Read-only access to content.' },
])

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedPrivilege = ref(null)
const searchQuery = ref('')

// Form data
const formData = ref({
    name: '',
    description: '',
})

// Computed filtered privileges based on search
const filteredPrivileges = ref([])
const updateFilteredPrivileges = () => {
    if (!searchQuery.value.trim()) {
        filteredPrivileges.value = privileges.value
        return
    }
    const query = searchQuery.value.toLowerCase()
    filteredPrivileges.value = privileges.value.filter(privilege =>
        privilege.name.toLowerCase().includes(query) ||
        privilege.description.toLowerCase().includes(query)
    )
}

// Open Add Modal
const openAddModal = () => {
    formData.value = { name: '', description: '' }
    showAddModal.value = true
}

// Close Add Modal
const closeAddModal = () => {
    showAddModal.value = false
    formData.value = { name: '', description: '' }
}

// Open Edit Modal
const openEditModal = (privilege) => {
    selectedPrivilege.value = privilege
    formData.value = { name: privilege.name, description: privilege.description }
    showEditModal.value = true
}

// Close Edit Modal
const closeEditModal = () => {
    showEditModal.value = false
    selectedPrivilege.value = null
    formData.value = { name: '', description: '' }
}

// Open Delete Modal
const openDeleteModal = (privilege) => {
    selectedPrivilege.value = privilege
    showDeleteModal.value = true
}

// Close Delete Modal
const closeDeleteModal = () => {
    showDeleteModal.value = false
    selectedPrivilege.value = null
}

// Add Privilege
const addPrivilege = () => {
    if (formData.value.name.trim()) {
        privileges.value.push({
            id: Math.max(...privileges.value.map(p => p.id), 0) + 1,
            name: formData.value.name,
            description: formData.value.description,
        })
        updateFilteredPrivileges()
        closeAddModal()
    }
}

// Update Privilege
const updatePrivilege = () => {
    if (formData.value.name.trim() && selectedPrivilege.value) {
        const index = privileges.value.findIndex(p => p.id === selectedPrivilege.value.id)
        if (index > -1) {
            privileges.value[index].name = formData.value.name
            privileges.value[index].description = formData.value.description
        }
        closeEditModal()
    }
}

// Delete Privilege
const deletePrivilege = () => {
    privileges.value = privileges.value.filter(p => p.id !== selectedPrivilege.value.id)
    updateFilteredPrivileges()
    closeDeleteModal()
}

// Initialize filtered privileges on component mount
updateFilteredPrivileges()
</script>

<template>
    <BaseLayout>
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Privileges Management</h1>
                    <p class="text-gray-600 text-sm mt-1">Manage user privileges and roles within the application.</p>
                </div>
                <button @click="openAddModal"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                    <Plus class="h-4 w-4" />
                    Add Privilege
                </button>
            </div>

            <!-- Search Bar -->
            <div class="mb-6 flex items-center gap-4">
                <div class="flex-1">
                    <input v-model="searchQuery" @input="updateFilteredPrivileges" type="text"
                        placeholder="Search privileges by name or description..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div class="text-sm text-gray-600">
                    {{ filteredPrivileges.length }} result{{ filteredPrivileges.length !== 1 ? 's' : '' }}
                </div>
            </div>

            <!-- Privileges Table -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b bg-gray-50">
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Name
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Description
                                </th>
                                <th
                                    class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="privilege in filteredPrivileges" :key="privilege.id"
                                class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                                    {{ privilege.name }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600">
                                    {{ privilege.description }}
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-3">
                                        <button @click="openEditModal(privilege)"
                                            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                            <Edit2 class="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button @click="openDeleteModal(privilege)"
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
                <div v-if="filteredPrivileges.length === 0" class="px-6 py-12 text-center">
                    <p class="text-gray-500 text-sm">
                        {{ searchQuery.trim() ? 'No privileges match your search.' : 'No privileges found. Create your first one.' }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Add Privilege Modal -->
        <div v-if="showAddModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4">
                    <h2 class="text-lg font-semibold text-gray-900">Add New Privilege</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="add-name" class="block text-sm font-medium text-gray-900 mb-1">Privilege
                            Name</label>
                        <input id="add-name" v-model="formData.name" type="text" placeholder="Enter privilege name"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="add-description"
                            class="block text-sm font-medium text-gray-900 mb-1">Description</label>
                        <textarea id="add-description" v-model="formData.description" rows="3"
                            placeholder="Enter privilege description"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"></textarea>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end">
                    <button @click="closeAddModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="addPrivilege"
                        class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                        Add Privilege
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit Privilege Modal -->
        <div v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4">
                    <h2 class="text-lg font-semibold text-gray-900">Edit Privilege</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="edit-name" class="block text-sm font-medium text-gray-900 mb-1">Privilege
                            Name</label>
                        <input id="edit-name" v-model="formData.name" type="text" placeholder="Enter privilege name"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="edit-description"
                            class="block text-sm font-medium text-gray-900 mb-1">Description</label>
                        <textarea id="edit-description" v-model="formData.description" rows="3"
                            placeholder="Enter privilege description"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"></textarea>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end">
                    <button @click="closeEditModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="updatePrivilege"
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
                    <h2 class="text-lg font-semibold text-gray-900">Delete Privilege</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4">
                    <p class="text-sm text-gray-600">
                        Are you sure you want to delete <span class="font-semibold text-gray-900">{{
                            selectedPrivilege?.name }}</span>? This action cannot be undone.
                    </p>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end">
                    <button @click="closeDeleteModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="deletePrivilege"
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </BaseLayout>
</template>

<script setup>
import { ref } from 'vue'
import { Trash2, Edit2, Plus, Eye, EyeOff } from 'lucide-vue-next'
import BaseLayout from '@/layouts/AppLayout.vue'

// Sample privileges (would typically come from an API)
const availablePrivileges = ref([
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Editor' },
    { id: 3, name: 'Viewer' },
])

// Sample systems (would typically come from an API)
const availableSystems = ref([
    { id: 1, name: 'Main Production' },
    { id: 2, name: 'Staging Environment' },
])

// State management
const users = ref([
    {
        id: 1,
        username: 'jnboateng',
        email: 'jnboateng@nanopass.com',
        password: 'SecurePass123!',
        privilege: 'Admin',
        system: 'Main Production'
    },
    {
        id: 2,
        username: 'asmith',
        email: 'asmith@nanopass.com',
        password: 'EditorPass456!',
        privilege: 'Editor',
        system: 'Staging Environment'
    },
])

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showPasswordFields = ref({})
const selectedUser = ref(null)
const searchQuery = ref('')

// Form data
const formData = ref({
    username: '',
    email: '',
    password: '',
    privilege: '',
    system: '',
})

// Computed filtered users based on search
const filteredUsers = ref([])
const updateFilteredUsers = () => {
    if (!searchQuery.value.trim()) {
        filteredUsers.value = users.value
        return
    }
    const query = searchQuery.value.toLowerCase()
    filteredUsers.value = users.value.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.privilege.toLowerCase().includes(query) ||
        user.system.toLowerCase().includes(query)
    )
}

// Watch for user changes and update filtered list
const updateUsers = () => {
    updateFilteredUsers()
}

// Toggle password visibility
const togglePasswordVisibility = (userId) => {
    showPasswordFields.value[userId] = !showPasswordFields.value[userId]
}

// Open Add Modal
const openAddModal = () => {
    formData.value = { username: '', email: '', password: '', privilege: '', system: '' }
    showAddModal.value = true
}

// Close Add Modal
const closeAddModal = () => {
    showAddModal.value = false
    formData.value = { username: '', email: '', password: '', privilege: '', system: '' }
}

// Open Edit Modal
const openEditModal = (user) => {
    selectedUser.value = user
    formData.value = {
        username: user.username,
        email: user.email,
        password: user.password,
        privilege: user.privilege,
        system: user.system
    }
    showEditModal.value = true
}

// Close Edit Modal
const closeEditModal = () => {
    showEditModal.value = false
    selectedUser.value = null
    formData.value = { username: '', email: '', password: '', privilege: '', system: '' }
}

// Open Delete Modal
const openDeleteModal = (user) => {
    selectedUser.value = user
    showDeleteModal.value = true
}

// Close Delete Modal
const closeDeleteModal = () => {
    showDeleteModal.value = false
    selectedUser.value = null
}

// Add User
const addUser = () => {
    if (formData.value.username.trim() && formData.value.email.trim() && formData.value.password.trim() && formData.value.privilege && formData.value.system) {
        users.value.push({
            id: Math.max(...users.value.map(u => u.id), 0) + 1,
            username: formData.value.username,
            email: formData.value.email,
            password: formData.value.password,
            privilege: formData.value.privilege,
            system: formData.value.system,
        })
        updateFilteredUsers()
        closeAddModal()
    }
}

// Update User
const updateUser = () => {
    if (formData.value.username.trim() && formData.value.email.trim() && formData.value.password.trim() && formData.value.privilege && formData.value.system && selectedUser.value) {
        const index = users.value.findIndex(u => u.id === selectedUser.value.id)
        if (index > -1) {
            users.value[index].username = formData.value.username
            users.value[index].email = formData.value.email
            users.value[index].password = formData.value.password
            users.value[index].privilege = formData.value.privilege
            users.value[index].system = formData.value.system
        }
        closeEditModal()
    }
}

// Delete User
const deleteUser = () => {
    users.value = users.value.filter(u => u.id !== selectedUser.value.id)
    updateFilteredUsers()
    closeDeleteModal()
}

// Mask password for display
const maskPassword = (password) => {
    return '*'.repeat(password.length)
}

// Initialize filtered users on component mount
updateFilteredUsers()
</script>

<template>
    <BaseLayout>
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
                    <p class="text-gray-600 text-sm mt-1">Manage application users, privileges, and system assignments.
                    </p>
                </div>
                <button @click="openAddModal"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                    <Plus class="h-4 w-4" />
                    Create User
                </button>
            </div>

            <!-- Search Bar -->
            <div class="mb-6 flex items-center gap-4">
                <div class="flex-1">
                    <input v-model="searchQuery" @input="updateFilteredUsers" type="text"
                        placeholder="Search users by username, email, privilege, or system..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div class="text-sm text-gray-600">
                    {{ filteredUsers.length }} result{{ filteredUsers.length !== 1 ? 's' : '' }}
                </div>
            </div>

            <!-- Users Table -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b bg-gray-50">
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Username
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Email
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Privilege
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    System
                                </th>
                                <th
                                    class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                                    {{ user.username }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600">
                                    {{ user.email }}
                                </td>
                                <td class="px-6 py-4 text-sm">
                                    <span :class="[
                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                        user.privilege === 'Admin' ? 'bg-red-100 text-red-800' :
                                            user.privilege === 'Editor' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                    ]">
                                        {{ user.privilege }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm">
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {{ user.system }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-3">
                                        <button @click="openEditModal(user)"
                                            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                            <Edit2 class="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button @click="openDeleteModal(user)"
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
                <div v-if="filteredUsers.length === 0" class="px-6 py-12 text-center">
                    <p class="text-gray-500 text-sm">
                        {{ searchQuery.trim() ? "No users match your search." : "No users found. Create your first user." }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Add User Modal -->
        <div v-if="showAddModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4 sticky top-0 bg-white">
                    <h2 class="text-lg font-semibold text-gray-900">Create User</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="add-username" class="block text-sm font-medium text-gray-900 mb-1">Username</label>
                        <input id="add-username" v-model="formData.username" type="text" placeholder="Enter username"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="add-email" class="block text-sm font-medium text-gray-900 mb-1">Email</label>
                        <input id="add-email" v-model="formData.email" type="email" placeholder="Enter email address"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="add-password" class="block text-sm font-medium text-gray-900 mb-1">Password</label>
                        <input id="add-password" v-model="formData.password" type="password"
                            placeholder="Enter a strong password"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="add-privilege" class="block text-sm font-medium text-gray-900 mb-1">App
                            Privilege</label>
                        <select id="add-privilege" v-model="formData.privilege"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">Select a privilege</option>
                            <option v-for="privilege in availablePrivileges" :key="privilege.id"
                                :value="privilege.name">
                                {{ privilege.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="add-system" class="block text-sm font-medium text-gray-900 mb-1">System
                            Assignment</label>
                        <select id="add-system" v-model="formData.system"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">Select a system</option>
                            <option v-for="system in availableSystems" :key="system.id" :value="system.name">
                                {{ system.name }}
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
                    <button @click="addUser"
                        class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                        Create User
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit User Modal -->
        <div v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <!-- Modal Header -->
                <div class="border-b px-6 py-4 sticky top-0 bg-white">
                    <h2 class="text-lg font-semibold text-gray-900">Edit User</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4 space-y-4">
                    <div>
                        <label for="edit-username" class="block text-sm font-medium text-gray-900 mb-1">Username</label>
                        <input id="edit-username" v-model="formData.username" type="text" placeholder="Enter username"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="edit-email" class="block text-sm font-medium text-gray-900 mb-1">Email</label>
                        <input id="edit-email" v-model="formData.email" type="email" placeholder="Enter email address"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="edit-password" class="block text-sm font-medium text-gray-900 mb-1">Password</label>
                        <input id="edit-password" v-model="formData.password" type="password"
                            placeholder="Enter a strong password"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                        <label for="edit-privilege" class="block text-sm font-medium text-gray-900 mb-1">App
                            Privilege</label>
                        <select id="edit-privilege" v-model="formData.privilege"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">Select a privilege</option>
                            <option v-for="privilege in availablePrivileges" :key="privilege.id"
                                :value="privilege.name">
                                {{ privilege.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="edit-system" class="block text-sm font-medium text-gray-900 mb-1">System
                            Assignment</label>
                        <select id="edit-system" v-model="formData.system"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="">Select a system</option>
                            <option v-for="system in availableSystems" :key="system.id" :value="system.name">
                                {{ system.name }}
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
                    <button @click="updateUser"
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
                    <h2 class="text-lg font-semibold text-gray-900">Delete User</h2>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4">
                    <p class="text-sm text-gray-600">
                        Are you sure you want to delete <span class="font-semibold text-gray-900">{{
                            selectedUser?.username }}</span>? This action cannot be undone.
                    </p>
                </div>

                <!-- Modal Footer -->
                <div class="border-t px-6 py-4 flex gap-3 justify-end">
                    <button @click="closeDeleteModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button @click="deleteUser"
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </BaseLayout>
</template>
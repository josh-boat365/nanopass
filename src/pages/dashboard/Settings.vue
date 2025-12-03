<script setup>
import { ref } from 'vue'
import BaseLayout from '@/layouts/AppLayout.vue'
import { Save, Trash2, Plus, X, Clock, AlertCircle, CheckCircle, Mail, Lock, User, Shield, Key, LogOut } from 'lucide-vue-next'

// Tabs
const activeTab = ref('profile')

// User Profile Data
const userProfile = ref({
    username: 'john_doe',
    email: 'john@nanopass.com',
    fullName: 'John Doe',
    department: 'Security Team',
    privilege: 'Admin',
    createdAt: '2024-01-15',
})

// Form data for profile update
const profileFormData = ref({
    fullName: userProfile.value.fullName,
    email: userProfile.value.email,
    department: userProfile.value.department,
})

const profileSaved = ref(false)

// Active Access Sessions
const activeSessions = ref([
    {
        id: 1,
        system: 'Main Production',
        deviceType: 'Desktop',
        browser: 'Chrome on Windows',
        ipAddress: '192.168.1.100',
        loginTime: '2024-12-03 14:32:15',
        lastActivity: '2 minutes ago',
        isCurrent: true,
    },
    {
        id: 2,
        system: 'Staging Environment',
        deviceType: 'Laptop',
        browser: 'Safari on macOS',
        ipAddress: '192.168.1.105',
        loginTime: '2024-12-03 10:15:22',
        lastActivity: '1 hour ago',
        isCurrent: false,
    },
    {
        id: 3,
        system: 'Development',
        deviceType: 'Mobile',
        browser: 'Chrome on Android',
        ipAddress: '10.0.0.50',
        loginTime: '2024-12-02 16:45:33',
        lastActivity: '1 day ago',
        isCurrent: false,
    },
])

// App Passwords
const appPasswords = ref([
    {
        id: 1,
        name: 'Production API Access',
        system: 'Main Production',
        createdAt: '2024-11-15',
        lastUsed: '2 hours ago',
        status: 'active',
    },
    {
        id: 2,
        name: 'Staging Backup Tool',
        system: 'Staging Environment',
        createdAt: '2024-10-20',
        lastUsed: '3 days ago',
        status: 'active',
    },
    {
        id: 3,
        name: 'Old Dev Access',
        system: 'Development',
        createdAt: '2024-08-10',
        lastUsed: 'Never',
        status: 'inactive',
    },
])

// Requests
const requests = ref([
    {
        id: 1,
        type: 'privilege_change',
        title: 'Privilege Change Request',
        description: 'Requesting Editor privilege for Main Production system',
        requestedPrivilege: 'Editor',
        system: 'Main Production',
        currentPrivilege: 'Viewer',
        reason: 'Need to modify content for new campaign',
        status: 'pending',
        createdAt: '2024-12-02 10:30:00',
        priority: 'normal',
    },
    {
        id: 2,
        type: 'password_access',
        title: 'App Password Access Request',
        description: 'Requesting access to Development system password',
        system: 'Development',
        purpose: 'Automated backup script integration',
        reason: 'Backup automation',
        status: 'approved',
        createdAt: '2024-11-28 15:45:00',
        priority: 'normal',
    },
    {
        id: 3,
        type: 'privilege_change',
        title: 'Privilege Change Request',
        description: 'Requesting Admin privilege for Staging system',
        requestedPrivilege: 'Admin',
        system: 'Staging Environment',
        currentPrivilege: 'Editor',
        reason: 'Need full access for testing',
        status: 'rejected',
        createdAt: '2024-11-25 09:20:00',
        priority: 'high',
    },
])

// Modal states
const showNewAppPasswordModal = ref(false)
const showNewRequestModal = ref(false)
const newAppPasswordForm = ref({
    name: '',
    system: '',
})

const newRequestForm = ref({
    type: 'privilege_change',
    system: '',
    requestedPrivilege: '',
    purpose: '',
    reason: '',
})

// Functions
const saveProfile = () => {
    userProfile.value.fullName = profileFormData.value.fullName
    userProfile.value.email = profileFormData.value.email
    userProfile.value.department = profileFormData.value.department
    profileSaved.value = true
    setTimeout(() => {
        profileSaved.value = false
    }, 3000)
}

const revokeAppPassword = (id) => {
    appPasswords.value = appPasswords.value.filter(p => p.id !== id)
}

const revokeSession = (id) => {
    activeSessions.value = activeSessions.value.filter(s => s.id !== id)
}

const createAppPassword = () => {
    if (newAppPasswordForm.value.name.trim() && newAppPasswordForm.value.system) {
        appPasswords.value.push({
            id: Math.max(...appPasswords.value.map(p => p.id), 0) + 1,
            name: newAppPasswordForm.value.name,
            system: newAppPasswordForm.value.system,
            createdAt: new Date().toISOString().split('T')[0],
            lastUsed: 'Just now',
            status: 'active',
        })
        newAppPasswordForm.value = { name: '', system: '' }
        showNewAppPasswordModal.value = false
    }
}

const submitRequest = () => {
    if (newRequestForm.value.system && newRequestForm.value.reason.trim()) {
        const newRequest = {
            id: Math.max(...requests.value.map(r => r.id), 0) + 1,
            type: newRequestForm.value.type,
            title: newRequestForm.value.type === 'privilege_change' ? 'Privilege Change Request' : 'App Password Access Request',
            description: newRequestForm.value.type === 'privilege_change'
                ? `Requesting ${newRequestForm.value.requestedPrivilege} privilege for ${newRequestForm.value.system} system`
                : `Requesting access to ${newRequestForm.value.system} system password`,
            ...(newRequestForm.value.type === 'privilege_change' && {
                requestedPrivilege: newRequestForm.value.requestedPrivilege,
                currentPrivilege: 'Viewer',
            }),
            system: newRequestForm.value.system,
            reason: newRequestForm.value.reason,
            status: 'pending',
            createdAt: new Date().toLocaleString(),
            priority: 'normal',
        }
        requests.value.unshift(newRequest)
        newRequestForm.value = { type: 'privilege_change', system: '', requestedPrivilege: '', purpose: '', reason: '' }
        showNewRequestModal.value = false
    }
}

const getStatusColor = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800'
        case 'approved':
            return 'bg-green-100 text-green-800'
        case 'rejected':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

const getStatusIcon = (status) => {
    switch (status) {
        case 'pending':
            return Clock
        case 'approved':
            return CheckCircle
        case 'rejected':
            return AlertCircle
        default:
            return Clock
    }
}
</script>

<template>
    <BaseLayout>
        <div class="p-6">
            <!-- Page Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
                <p class="mt-2 text-gray-600">Manage your profile, access permissions, and security settings</p>
            </div>

            <!-- Tabs Navigation -->
            <div class="mb-8 border-b border-gray-200">
                <div class="flex gap-8">
                    <button @click="activeTab = 'profile'"
                        :class="['pb-4 px-1 border-b-2 font-medium text-sm transition-colors', activeTab === 'profile' ? 'border-black text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900']">
                        <User class="inline mr-2 h-4 w-4" />
                        Profile
                    </button>
                    <button @click="activeTab = 'sessions'"
                        :class="['pb-4 px-1 border-b-2 font-medium text-sm transition-colors', activeTab === 'sessions' ? 'border-black text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900']">
                        <LogOut class="inline mr-2 h-4 w-4" />
                        Active Sessions
                    </button>
                    <button @click="activeTab = 'passwords'"
                        :class="['pb-4 px-1 border-b-2 font-medium text-sm transition-colors', activeTab === 'passwords' ? 'border-black text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900']">
                        <Key class="inline mr-2 h-4 w-4" />
                        App Passwords
                    </button>
                    <button @click="activeTab = 'requests'"
                        :class="['pb-4 px-1 border-b-2 font-medium text-sm transition-colors', activeTab === 'requests' ? 'border-black text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900']">
                        <Shield class="inline mr-2 h-4 w-4" />
                        Requests
                    </button>
                </div>
            </div>

            <!-- Profile Tab -->
            <div v-show="activeTab === 'profile'" class="space-y-6">
                <!-- Profile Overview Card -->
                <div class="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                    <div class="grid gap-6 md:grid-cols-2">
                        <!-- Display Fields -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <div
                                class="px-4 py-2 bg-gray-50 rounded-md border border-gray-200 text-gray-900 text-sm font-medium">
                                {{ userProfile.username }}
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Current Privilege</label>
                            <div class="px-4 py-2 bg-gray-50 rounded-md border border-gray-200">
                                <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    {{ userProfile.privilege }}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
                            <div class="px-4 py-2 bg-gray-50 rounded-md border border-gray-200 text-gray-900 text-sm">
                                {{ userProfile.createdAt }}
                            </div>
                        </div>

                        <!-- Editable Fields -->
                        <div>
                            <label for="fullname" class="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                            <input id="fullname" v-model="profileFormData.fullName" type="text"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-900 mb-2">Email
                                Address</label>
                            <input id="email" v-model="profileFormData.email" type="email"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                        </div>

                        <div class="md:col-span-2">
                            <label for="department"
                                class="block text-sm font-medium text-gray-900 mb-2">Department</label>
                            <input id="department" v-model="profileFormData.department" type="text"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                        </div>
                    </div>

                    <!-- Save Button -->
                    <div class="mt-6 flex items-center gap-4">
                        <button @click="saveProfile"
                            class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                            <Save class="h-4 w-4" />
                            Save Changes
                        </button>
                        <div v-if="profileSaved" class="flex items-center gap-2 text-green-600 text-sm">
                            <CheckCircle class="h-4 w-4" />
                            Profile updated successfully
                        </div>
                    </div>
                </div>

                <!-- Security Recommendation -->
                <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div class="flex items-start gap-3">
                        <AlertCircle class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 class="font-semibold text-blue-900">Security Tip</h3>
                            <p class="text-sm text-blue-800 mt-1">To change your password, please contact your system
                                administrator or visit the security settings page.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Sessions Tab -->
            <div v-show="activeTab === 'sessions'" class="space-y-6">
                <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
                    <div class="border-b bg-gray-50 px-6 py-4">
                        <h2 class="text-lg font-semibold text-gray-900">Active Sessions</h2>
                        <p class="text-sm text-gray-600 mt-1">Manage your active sessions and revoke access if needed
                        </p>
                    </div>

                    <div class="divide-y">
                        <div v-for="session in activeSessions" :key="session.id"
                            class="p-6 hover:bg-gray-50 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <h3 class="font-semibold text-gray-900">{{ session.system }}</h3>
                                        <span v-if="session.isCurrent"
                                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Current Session
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                        <div>
                                            <p class="font-medium text-gray-900">{{ session.browser }}</p>
                                            <p class="text-xs">{{ session.deviceType }}</p>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900">{{ session.ipAddress }}</p>
                                            <p class="text-xs">IP Address</p>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900">{{ session.loginTime }}</p>
                                            <p class="text-xs">Login Time</p>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900">{{ session.lastActivity }}</p>
                                            <p class="text-xs">Last Activity</p>
                                        </div>
                                    </div>
                                </div>
                                <button v-if="!session.isCurrent" @click="revokeSession(session.id)"
                                    class="ml-4 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                    Revoke
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- App Passwords Tab -->
            <div v-show="activeTab === 'passwords'" class="space-y-6">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900">App Passwords</h2>
                        <p class="text-sm text-gray-600 mt-1">Create and manage passwords for automated access and
                            integrations</p>
                    </div>
                    <button @click="showNewAppPasswordModal = true"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                        <Plus class="h-4 w-4" />
                        New App Password
                    </button>
                </div>

                <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b bg-gray-50">
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">System
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Used
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="password in appPasswords" :key="password.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ password.name }}</td>
                                <td class="px-6 py-4 text-sm text-gray-600">{{ password.system }}</td>
                                <td class="px-6 py-4 text-sm text-gray-600">{{ password.createdAt }}</td>
                                <td class="px-6 py-4 text-sm text-gray-600">{{ password.lastUsed }}</td>
                                <td class="px-6 py-4">
                                    <span
                                        :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', password.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800']">
                                        {{ password.status === 'active' ? 'Active' : 'Inactive' }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button @click="revokeAppPassword(password.id)"
                                        class="text-red-600 hover:text-red-800 font-medium text-sm">
                                        <Trash2 class="h-4 w-4 inline" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Requests Tab -->
            <div v-show="activeTab === 'requests'" class="space-y-6">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900">Access Requests</h2>
                        <p class="text-sm text-gray-600 mt-1">Submit and track privilege and access requests</p>
                    </div>
                    <button @click="showNewRequestModal = true"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
                        <Plus class="h-4 w-4" />
                        New Request
                    </button>
                </div>

                <div class="space-y-4">
                    <div v-for="request in requests" :key="request.id"
                        class="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900">{{ request.title }}</h3>
                                <p class="text-sm text-gray-600 mt-1">{{ request.description }}</p>
                            </div>
                            <span
                                :class="['inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium', getStatusColor(request.status)]">
                                <component :is="getStatusIcon(request.status)" class="h-3 w-3" />
                                {{ request.status.charAt(0).toUpperCase() + request.status.slice(1) }}
                            </span>
                        </div>

                        <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <p class="text-gray-600">System</p>
                                <p class="font-medium text-gray-900">{{ request.system }}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Priority</p>
                                <p class="font-medium text-gray-900 capitalize">{{ request.priority }}</p>
                            </div>
                            <div v-if="request.type === 'privilege_change'">
                                <p class="text-gray-600">Requested Privilege</p>
                                <p class="font-medium text-gray-900">{{ request.requestedPrivilege }}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Reason</p>
                                <p class="font-medium text-gray-900">{{ request.reason }}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Request Date</p>
                                <p class="font-medium text-gray-900">{{ request.createdAt }}</p>
                            </div>
                        </div>

                        <div class="pt-4 border-t">
                            <p class="text-xs text-gray-500">Request ID: #{{ request.id }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- New App Password Modal -->
            <div v-if="showNewAppPasswordModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
                    <div class="border-b px-6 py-4 flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-gray-900">Create New App Password</h2>
                        <button @click="showNewAppPasswordModal = false" class="text-gray-500 hover:text-gray-700">
                            <X class="h-5 w-5" />
                        </button>
                    </div>

                    <div class="px-6 py-4 space-y-4">
                        <div>
                            <label for="app-name" class="block text-sm font-medium text-gray-900 mb-1">Password
                                Name</label>
                            <input id="app-name" v-model="newAppPasswordForm.name" type="text"
                                placeholder="e.g., Backup Script Access"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                        </div>

                        <div>
                            <label for="app-system" class="block text-sm font-medium text-gray-900 mb-1">System</label>
                            <select id="app-system" v-model="newAppPasswordForm.system"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                                <option value="">Select a system</option>
                                <option value="Main Production">Main Production</option>
                                <option value="Staging Environment">Staging Environment</option>
                                <option value="Development">Development</option>
                            </select>
                        </div>
                    </div>

                    <div class="border-t px-6 py-4 flex gap-3 justify-end">
                        <button @click="showNewAppPasswordModal = false"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                            Cancel
                        </button>
                        <button @click="createAppPassword"
                            class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800">
                            Create Password
                        </button>
                    </div>
                </div>
            </div>

            <!-- New Request Modal -->
            <div v-if="showNewRequestModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                    <div class="border-b px-6 py-4 sticky top-0 bg-white flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-gray-900">Submit Access Request</h2>
                        <button @click="showNewRequestModal = false" class="text-gray-500 hover:text-gray-700">
                            <X class="h-5 w-5" />
                        </button>
                    </div>

                    <div class="px-6 py-4 space-y-4">
                        <div>
                            <label for="req-type" class="block text-sm font-medium text-gray-900 mb-1">Request
                                Type</label>
                            <select id="req-type" v-model="newRequestForm.type"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                                <option value="privilege_change">Privilege Change</option>
                                <option value="password_access">App Password Access</option>
                            </select>
                        </div>

                        <div>
                            <label for="req-system" class="block text-sm font-medium text-gray-900 mb-1">System</label>
                            <select id="req-system" v-model="newRequestForm.system"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                                <option value="">Select a system</option>
                                <option value="Main Production">Main Production</option>
                                <option value="Staging Environment">Staging Environment</option>
                                <option value="Development">Development</option>
                            </select>
                        </div>

                        <div v-if="newRequestForm.type === 'privilege_change'">
                            <label for="req-privilege" class="block text-sm font-medium text-gray-900 mb-1">Requested
                                Privilege</label>
                            <select id="req-privilege" v-model="newRequestForm.requestedPrivilege"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                                <option value="">Select privilege</option>
                                <option value="Viewer">Viewer</option>
                                <option value="Editor">Editor</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label for="req-reason" class="block text-sm font-medium text-gray-900 mb-1">Reason</label>
                            <textarea id="req-reason" v-model="newRequestForm.reason" rows="3"
                                placeholder="Explain why you need this access..."
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"></textarea>
                        </div>
                    </div>

                    <div class="border-t px-6 py-4 flex gap-3 justify-end sticky bottom-0 bg-white">
                        <button @click="showNewRequestModal = false"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                            Cancel
                        </button>
                        <button @click="submitRequest"
                            class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800">
                            Submit Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </BaseLayout>
</template>

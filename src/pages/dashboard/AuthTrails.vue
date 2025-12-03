<script setup>
import { ref } from 'vue'
import BaseLayout from '@/layouts/AppLayout.vue'
import { Search, Download, CheckCircle, XCircle, Shield, Eye, Smartphone } from 'lucide-vue-next'

// State management
const searchQuery = ref('')
const filterStatus = ref('all')
const filterPrivilege = ref('all')
const filteredTrails = ref([])

// Sample authentication trails data
const authTrails = ref([
    {
        id: 1,
        username: 'john_doe',
        email: 'john@nanopass.com',
        system: 'Main Production',
        privilege: 'Admin',
        loginTime: '2024-12-03 14:32:15',
        day: 'Monday',
        duration: '2 hours 15 mins',
        ipAddress: '192.168.1.100',
        device: 'Chrome on Windows',
        status: 'success'
    },
    {
        id: 2,
        username: 'jane_smith',
        email: 'jane@nanopass.com',
        system: 'Staging Environment',
        privilege: 'Editor',
        loginTime: '2024-12-03 13:45:22',
        day: 'Monday',
        duration: '1 hour 30 mins',
        ipAddress: '192.168.1.105',
        device: 'Safari on macOS',
        status: 'success'
    },
    {
        id: 3,
        username: 'mike_johnson',
        email: 'mike@nanopass.com',
        system: 'Development',
        privilege: 'Viewer',
        loginTime: '2024-12-03 11:20:45',
        day: 'Monday',
        duration: '45 mins',
        ipAddress: '192.168.1.110',
        device: 'Firefox on Linux',
        status: 'success'
    },
    {
        id: 4,
        username: 'sarah_williams',
        email: 'sarah@nanopass.com',
        system: 'Main Production',
        privilege: 'Editor',
        loginTime: '2024-12-03 09:15:33',
        day: 'Monday',
        duration: '3 hours 20 mins',
        ipAddress: '10.0.0.50',
        device: 'Chrome on Windows',
        status: 'success'
    },
    {
        id: 5,
        username: 'alex_davis',
        email: 'alex@nanopass.com',
        system: 'Main Production',
        privilege: 'Admin',
        loginTime: '2024-12-03 08:30:12',
        day: 'Monday',
        duration: '5 hours 45 mins',
        ipAddress: '192.168.1.120',
        device: 'Chrome on Windows',
        status: 'success'
    },
    {
        id: 6,
        username: 'robert_brown',
        email: 'robert@nanopass.com',
        system: 'Staging Environment',
        privilege: 'Viewer',
        loginTime: '2024-12-02 16:45:28',
        day: 'Sunday',
        duration: '30 mins',
        ipAddress: '192.168.1.99',
        device: 'Mobile Safari on iOS',
        status: 'success'
    },
    {
        id: 7,
        username: 'emma_wilson',
        email: 'emma@nanopass.com',
        system: 'Development',
        privilege: 'Admin',
        loginTime: '2024-12-02 15:22:50',
        day: 'Sunday',
        duration: '1 hour 10 mins',
        ipAddress: '192.168.1.88',
        device: 'Chrome on Windows',
        status: 'success'
    },
    {
        id: 8,
        username: 'charles_miller',
        email: 'charles@nanopass.com',
        system: 'Main Production',
        privilege: 'Editor',
        loginTime: '2024-12-02 14:10:15',
        day: 'Sunday',
        duration: '2 hours',
        ipAddress: '192.168.1.77',
        device: 'Firefox on Windows',
        status: 'failed'
    },
    {
        id: 9,
        username: 'lucy_taylor',
        email: 'lucy@nanopass.com',
        system: 'Staging Environment',
        privilege: 'Viewer',
        loginTime: '2024-12-02 12:05:42',
        day: 'Sunday',
        duration: '55 mins',
        ipAddress: '10.0.0.75',
        device: 'Chrome on macOS',
        status: 'success'
    },
    {
        id: 10,
        username: 'john_doe',
        email: 'john@nanopass.com',
        system: 'Development',
        privilege: 'Admin',
        loginTime: '2024-12-02 10:30:20',
        day: 'Sunday',
        duration: '3 hours',
        ipAddress: '192.168.1.100',
        device: 'Chrome on Windows',
        status: 'success'
    },
])

// Color mappings
const statusColors = {
    'success': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800'
}

const privilegeColors = {
    'Admin': 'bg-red-100 text-red-800',
    'Editor': 'bg-yellow-100 text-yellow-800',
    'Viewer': 'bg-green-100 text-green-800'
}

// Functions
const updateFilteredTrails = () => {
    let results = authTrails.value

    // Filter by search query
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        results = results.filter(trail =>
            trail.username.toLowerCase().includes(query) ||
            trail.email.toLowerCase().includes(query) ||
            trail.system.toLowerCase().includes(query) ||
            trail.ipAddress.toLowerCase().includes(query)
        )
    }

    // Filter by status
    if (filterStatus.value !== 'all') {
        results = results.filter(trail => trail.status === filterStatus.value)
    }

    // Filter by privilege
    if (filterPrivilege.value !== 'all') {
        results = results.filter(trail => trail.privilege === filterPrivilege.value)
    }

    filteredTrails.value = results
}

// Export to CSV
const exportToCSV = () => {
    const headers = ['Username', 'Email', 'System', 'Privilege', 'Login Time', 'Duration', 'IP Address', 'Device', 'Status']
    const rows = filteredTrails.value.map(trail => [
        trail.username,
        trail.email,
        trail.system,
        trail.privilege,
        trail.loginTime,
        trail.duration,
        trail.ipAddress,
        trail.device,
        trail.status
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auth-trails-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
}

// Initialize filtered trails on component mount
updateFilteredTrails()
</script>

<template>
    <BaseLayout>
        <div class="p-6">
            <!-- Page Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Authentication Trails</h1>
                <p class="mt-2 text-gray-600">Track user login activities, system access, and session history</p>
            </div>

            <!-- Summary Cards -->
            <div class="grid gap-4 md:grid-cols-3 mb-8">
                <div class="rounded-lg border bg-white p-6 shadow-sm">
                    <p class="text-sm text-gray-600">Total Login Activities</p>
                    <p class="mt-2 text-3xl font-bold text-gray-900">{{ authTrails.length }}</p>
                    <p class="mt-1 text-xs text-gray-500">Last 2 days</p>
                </div>

                <div class="rounded-lg border bg-white p-6 shadow-sm">
                    <p class="text-sm text-gray-600">Successful Logins</p>
                    <p class="mt-2 text-3xl font-bold text-green-600">{{authTrails.filter(t => t.status ===
                        'success').length}}</p>
                    <p class="mt-1 text-xs text-gray-500">{{((authTrails.filter(t => t.status === 'success').length /
                        authTrails.length) * 100).toFixed(1)}}% success rate</p>
                </div>

                <div class="rounded-lg border bg-white p-6 shadow-sm">
                    <p class="text-sm text-gray-600">Failed Logins</p>
                    <p class="mt-2 text-3xl font-bold text-red-600">{{authTrails.filter(t => t.status ===
                        'failed').length}}</p>
                    <p class="mt-1 text-xs text-gray-500">Requires investigation</p>
                </div>
            </div>

            <!-- Filters and Search -->
            <div class="mb-6 space-y-4">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <!-- Search -->
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-900 mb-2">Search</label>
                        <div class="relative">
                            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input v-model="searchQuery" @input="updateFilteredTrails" type="text"
                                placeholder="Search by username, email, system, or IP..."
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
                        </div>
                    </div>

                    <!-- Status Filter -->
                    <div class="min-w-fit">
                        <label class="block text-sm font-medium text-gray-900 mb-2">Status</label>
                        <select v-model="filterStatus" @change="updateFilteredTrails"
                            class="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="all">All Status</option>
                            <option value="success">Successful</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <!-- Privilege Filter -->
                    <div class="min-w-fit">
                        <label class="block text-sm font-medium text-gray-900 mb-2">Privilege</label>
                        <select v-model="filterPrivilege" @change="updateFilteredTrails"
                            class="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                            <option value="all">All Privileges</option>
                            <option value="Admin">Admin</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>

                    <!-- Export Button -->
                    <button @click="exportToCSV"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                        <Download class="h-4 w-4" />
                        Export CSV
                    </button>
                </div>

                <!-- Results Count -->
                <div class="text-sm text-gray-600">
                    Showing {{ filteredTrails.length }} of {{ authTrails.length }} activities
                </div>
            </div>

            <!-- Authentication Trails Table -->
            <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b bg-gray-50">
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    User
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    System
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Login Time
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Duration
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Privilege
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    IP Address
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Device
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="trail in filteredTrails" :key="trail.id"
                                class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                                            {{ trail.username.substring(0, 2).toUpperCase() }}
                                        </div>
                                        <div>
                                            <div class="text-sm font-medium text-gray-900">{{ trail.username }}</div>
                                            <div class="text-xs text-gray-500">{{ trail.email }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                                    {{ trail.system }}
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm font-medium text-gray-900">{{ trail.loginTime }}</div>
                                    <div class="text-xs text-gray-500">{{ trail.day }}</div>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600">
                                    {{ trail.duration }}
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', privilegeColors[trail.privilege]]">
                                        {{ trail.privilege }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600 font-mono">
                                    {{ trail.ipAddress }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600">
                                    {{ trail.device }}
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        :class="['inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[trail.status]]">
                                        <CheckCircle v-if="trail.status === 'success'" class="h-4 w-4" />
                                        <XCircle v-else class="h-4 w-4" />
                                        {{ trail.status === 'success' ? 'Success' : 'Failed' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Empty State -->
                <div v-if="filteredTrails.length === 0" class="px-6 py-12 text-center">
                    <p class="text-gray-500 text-sm">No authentication activities found. Try adjusting your filters.</p>
                </div>
            </div>
        </div>
    </BaseLayout>
</template>

<!-- NavUser.vue -->
<script setup>
import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Sparkles,
} from 'lucide-vue-next'
import { ref } from 'vue'

defineProps({
    user: Object,
    isCollapsed: Boolean
})

const showDropdown = ref(false)
</script>

<template>
    <div class="relative">
        <button @click="showDropdown = !showDropdown" :class="[
            'flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-50',
            isCollapsed ? 'justify-center' : ''
        ]">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-semibold">
                {{ user.name.substring(0, 2).toUpperCase() }}
            </div>
            <div v-if="!isCollapsed" class="flex-1 text-left text-sm">
                <div class="font-medium text-gray-900">{{ user.name }}</div>
                <div class="text-xs text-gray-500">{{ user.email }}</div>
            </div>
            <ChevronsUpDown v-if="!isCollapsed" class="h-4 w-4 text-gray-500" />
        </button>

        <!-- Dropdown menu -->
        <div v-if="showDropdown" class="absolute bottom-full left-0 mb-2 w-56 rounded-lg border bg-white shadow-lg">
            <div class="flex items-center gap-2 border-b px-3 py-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-semibold">
                    {{ user.name.substring(0, 2).toUpperCase() }}
                </div>
                <div class="flex-1 text-sm">
                    <div class="font-semibold text-gray-900">{{ user.name }}</div>
                    <div class="text-xs text-gray-500">{{ user.email }}</div>
                </div>
            </div>

            <div class="border-b py-1">
                <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                    <Sparkles class="h-4 w-4" />
                    <span>Upgrade to Pro</span>
                </button>
            </div>

            <div class="border-b py-1">
                <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                    <BadgeCheck class="h-4 w-4" />
                    <span>Account</span>
                </button>
                <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                    <CreditCard class="h-4 w-4" />
                    <span>Billing</span>
                </button>
                <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                    <Bell class="h-4 w-4" />
                    <span>Notifications</span>
                </button>
            </div>

            <div class="py-1">
                <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                    <LogOut class="h-4 w-4" />
                    <span>Log out</span>
                </button>
            </div>
        </div>
    </div>
</template>
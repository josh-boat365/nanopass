<script setup>
import { Menu } from 'lucide-vue-next'
import { ref } from 'vue'
import AppSidebar from '@/components/AppSideBar.vue'

const sidebarOpen = ref(true)
</script>

<template>
    <div class="flex h-screen">
        <AppSidebar v-if="sidebarOpen" />

        <div class="flex flex-1 flex-col">
            <!-- Header -->
            <header class="flex h-16 items-center justify-between gap-4 border-b bg-slate-100 px-4">
                <div class="flex items-center gap-4">
                    <button @click="sidebarOpen = !sidebarOpen" class="rounded-md p-2 hover:bg-gray-100">
                        <Menu class="h-5 w-5" />
                    </button>

                    <div class="h-4 w-px bg-gray-200"></div>

                    <!-- Breadcrumb -->
                    <nav class="flex items-center gap-2 text-sm">
                        <a href="#" class="text-gray-600 hover:text-gray-900">
                            Building Your Application
                        </a>
                        <span class="text-gray-400">/</span>
                        <span class="text-gray-900">Data Fetching</span>
                    </nav>
                </div>

            </header>

            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto bg-gray-50 p-4">
                <slot />
            </main>
        </div>
    </div>
</template>
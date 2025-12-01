<!-- NavProjects.vue -->
<script setup>
import {
    Folder,
    Forward,
    MoreHorizontal,
    Trash2,
} from 'lucide-vue-next'
import { ref } from 'vue'

defineProps({
    projects: Array
})

const showDropdown = ref(null)
</script>

<template>
    <div class="px-3 py-2">
        <p class="mb-2 px-2 text-xs font-semibold text-gray-500">
            Projects
        </p>
        <nav class="space-y-1">
            <div v-for="item in projects" :key="item.name" class="group relative">
                <a :href="item.url"
                    class="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                    <component :is="item.icon" class="h-4 w-4 flex-shrink-0" />
                    <span class="flex-1">{{ item.name }}</span>
                </a>

                <!-- Dropdown trigger -->
                <button @click="showDropdown = showDropdown === item.name ? null : item.name"
                    class="absolute right-2 top-2 hidden rounded p-1 hover:bg-gray-100 group-hover:block">
                    <MoreHorizontal class="h-4 w-4" />
                </button>

                <!-- Dropdown menu -->
                <div v-if="showDropdown === item.name"
                    class="absolute right-0 top-10 z-50 w-48 rounded-lg border bg-white shadow-lg">
                    <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                        <Folder class="h-4 w-4 text-gray-500" />
                        <span>View Project</span>
                    </button>
                    <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                        <Forward class="h-4 w-4 text-gray-500" />
                        <span>Share Project</span>
                    </button>
                    <div class="border-t"></div>
                    <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                        <Trash2 class="h-4 w-4 text-gray-500" />
                        <span>Delete Project</span>
                    </button>
                </div>
            </div>
        </nav>
    </div>
</template>
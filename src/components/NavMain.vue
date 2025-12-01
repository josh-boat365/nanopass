<!-- NavMain.vue -->
<script setup>
import { ChevronRight } from 'lucide-vue-next'
import { ref } from 'vue'

defineProps({
    items: Array,
    isCollapsed: Boolean
})

const openItems = ref(new Set(['Playground']))

const toggleItem = (title) => {
    if (openItems.value.has(title)) {
        openItems.value.delete(title)
    } else {
        openItems.value.add(title)
    }
}
</script>

<template>
    <div class="px-3 py-2">
        <p class="mb-2 px-2 text-xs font-semibold text-gray-500" v-if="!isCollapsed">
            Platform
        </p>
        <nav class="space-y-1">
            <div v-for="item in items" :key="item.title">
                <button @click="toggleItem(item.title)" :class="[
                    'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                    item.isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                ]" :title="isCollapsed ? item.title : undefined">
                    <component :is="item.icon" v-if="item.icon" class="h-4 w-4 flex-shrink-0" />
                    <span v-if="!isCollapsed" class="flex-1 text-left">{{ item.title }}</span>
                    <ChevronRight v-if="!isCollapsed && item.items" :class="[
                        'h-4 w-4 transition-transform',
                        openItems.has(item.title) ? 'rotate-90' : ''
                    ]" />
                </button>

                <!-- Sub items -->
                <div v-if="!isCollapsed && item.items && openItems.has(item.title)" class="ml-7 mt-1 space-y-1">
                    <a v-for="subItem in item.items" :key="subItem.title" :href="subItem.url"
                        class="block rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                        {{ subItem.title }}
                    </a>
                </div>
            </div>
        </nav>
    </div>
</template>

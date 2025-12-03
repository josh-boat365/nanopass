<!-- NavMain.vue -->
<script setup>
import { ChevronRight } from 'lucide-vue-next'
import { ref } from 'vue'
import { Transition } from 'vue'

const props = defineProps({
    items: Array,
    isCollapsed: Boolean,
    currentRoute: String,
})

const openItems = ref(new Set())

// Auto-expand parent menus if any child matches current route
const initializeOpenItems = () => {
    props.items?.forEach(item => {
        if (item.items?.some(subItem => subItem.url === props.currentRoute)) {
            openItems.value.add(item.title)
        }
    })
}

initializeOpenItems()

const toggleItem = (title) => {
    if (openItems.value.has(title)) {
        openItems.value.delete(title)
    } else {
        openItems.value.add(title)
    }
}

// Check if an item or any of its children match the current route
const isItemActive = (item) => {
    if (item.url && item.url !== '#' && item.url === props.currentRoute) {
        return true
    }
    if (item.items?.some(subItem => subItem.url === props.currentRoute)) {
        return true
    }
    return false
}

const isSubItemActive = (url) => {
    return url !== '#' && url === props.currentRoute
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
                    'group relative flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-all duration-200',
                    isItemActive(item)
                        ? 'bg-gray-100 text-gray-900 border-gray-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                    isCollapsed ? 'justify-center' : ''
                ]" :title="isCollapsed ? item.title : undefined" :aria-label="item.title">
                    <component :is="item.icon" v-if="item.icon" class="h-4 w-4 flex-shrink-0" />
                    <span v-show="!isCollapsed" class="flex-1 text-left transition-all duration-200 ease-in-out">
                        {{ item.title }}
                    </span>
                    <ChevronRight v-show="!isCollapsed && item.items" :class="[
                        'h-4 w-4 transition-transform',
                        openItems.has(item.title) ? 'rotate-90' : ''
                    ]" />

                </button>

                <!-- Sub items -->
                <Transition name="submenu" mode="out-in">
                    <div v-if="!isCollapsed && item.items && openItems.has(item.title)"
                        class="ml-7 mt-1 space-y-1 overflow-hidden">
                        <router-link v-for="subItem in item.items" :key="subItem.title" :to="subItem.url" :class="[
                            'block rounded-md px-2 py-1.5 text-sm transition-all duration-150',
                            isSubItemActive(subItem.url)
                                ? 'bg-gray-100 text-gray-900 font-semibold border-gray-400 pl-1.5'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        ]">
                            {{ subItem.title }}
                        </router-link>
                    </div>
                </Transition>
            </div>
        </nav>
    </div>
</template>

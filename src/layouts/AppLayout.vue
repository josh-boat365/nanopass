<script setup>
import { Menu, PanelRightOpen, ChevronRight } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '@/components/AppSideBar.vue'

const route = useRoute()
const router = useRouter()

// Controls whether the sidebar is collapsed (icons-only) on desktop
const isCollapsed = ref(false)
// Controls mobile sidebar overlay visibility
const mobileOpen = ref(false)

// Generate breadcrumbs from route
const breadcrumbs = computed(() => {
    const routePath = route.path
    const breadcrumbMap = {
        '/dashboard': [{ label: 'Dashboard', path: '/dashboard' }],
        '/dashboard/auth-trails': [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Access Trails', path: '/dashboard/auth-trails' }
        ],
        '/dashboard/settings': [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Settings', path: '/dashboard/settings' }
        ],
        '/dashboard/create-user': [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'User Management', path: '#' },
            { label: 'Users', path: '/dashboard/create-user' }
        ],
        '/dashboard/create-privileges': [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'App Configs', path: '#' },
            { label: 'Privileges', path: '/dashboard/create-privileges' }
        ],
        '/dashboard/create-system-passwords-category': [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'App Configs', path: '#' },
            { label: 'System Categories', path: '/dashboard/create-system-passwords-category' }
        ],
        '/dashboard/create-system-passwords-policy-category': [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'App Configs', path: '#' },
            { label: 'Password Policies', path: '/dashboard/create-system-passwords-policy-category' }
        ],
        '/dashboard/create-system-passwords': [
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'App Configs', path: '#' },
            { label: 'System Setup', path: '/dashboard/create-system-passwords' }
        ],
        '/user/dashboard': [
            { label: 'My Dashboard', path: '/user/dashboard' }
        ],
    }

    return breadcrumbMap[routePath] || [{ label: 'Dashboard', path: '/dashboard' }]
})

const toggleSidebar = () => {
    // if small screen, toggle mobile overlay; else toggle collapse
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        mobileOpen.value = !mobileOpen.value
    } else {
        isCollapsed.value = !isCollapsed.value
    }
}

const navigateTo = (path) => {
    if (path !== '#') {
        router.push(path)
    }
}
</script>

<template>
    <div class="flex h-screen">
        <AppSidebar :is-collapsed="isCollapsed" :is-mobile-open="mobileOpen" />

        <!-- Mobile backdrop when sidebar open -->
        <div v-if="mobileOpen" @click="mobileOpen = false" class="fixed inset-0 z-30 bg-black/40 md:hidden"></div>

        <div class="flex flex-1 flex-col">
            <!-- Header -->
            <header class="flex h-16 items-center justify-between gap-4 border-b bg-white px-4">
                <div class="flex items-center gap-4">
                    <button @click="toggleSidebar" class="rounded-md p-2 hover:bg-gray-100">
                        <PanelRightOpen class="h-5 w-5" />
                    </button>

                    <div class="h-4 w-px bg-gray-200"></div>

                    <!-- Breadcrumb -->
                    <nav class="flex items-center gap-2 text-sm">
                        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
                            <button v-if="crumb.path !== '#'" @click="navigateTo(crumb.path)" :class="[
                                'hover:text-gray-900 transition-colors',
                                index === breadcrumbs.length - 1
                                    ? 'text-gray-900 font-medium'
                                    : 'text-gray-600'
                            ]">
                                {{ crumb.label }}
                            </button>
                            <span v-else class="text-gray-600">{{ crumb.label }}</span>
                            <ChevronRight v-if="index < breadcrumbs.length - 1" class="h-4 w-4 text-gray-400" />
                        </template>
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
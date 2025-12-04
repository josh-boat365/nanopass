<!-- AppSidebar.vue -->

<script setup>
import {
    Frame,
    Settings2,
    LayoutDashboard,
    Users2,
    SettingsIcon,
} from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import NavMain from '@/components/NavMain.vue'
// import NavProjects from '@/components/NavProjects.vue'
import NavUser from '@/components/NavUser.vue'
import AppLogo from '@/components/AppLogo.vue'

const route = useRoute()

defineProps({
    isCollapsed: { type: Boolean, default: false },
    isMobileOpen: { type: Boolean, default: false }
})

const data = {
    user: {
        name: 'Jnboateng',
        email: 'jnboateng@nanopass.com',
        avatar: '../assets/icons/codesandbox.svg',
    },
    navMain: [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutDashboard,
            items: [
                {
                    title: 'Overview',
                    url: '/admin/dashboard',
                },
                {
                    title: 'Access Trails',
                    url: '/admin/dashboard/auth-trails',
                },
                {
                    title: 'My Dashboard',
                    url: '/user/dashboard',
                },
            ],
        },
        {
            title: 'User Management',
            url: '#',
            icon: Users2,
            items: [
                {
                    title: 'Users',
                    url: '/admin/dashboard/create-user',
                }
            ],
        },
        {
            title: 'App Configs',
            url: '#',
            icon: Settings2,
            items: [
                {
                    title: 'Create System User Privileges',
                    url: '/admin/dashboard/create-privileges',
                },
                {
                    title: 'Create System Passwords Category',
                    url: '/admin/dashboard/create-system-passwords-category',
                },
                {
                    title: 'Create System Passwords Policy Category',
                    url: '/admin/dashboard/create-system-passwords-policy-category',
                },
                {
                    title: 'Create System Passwords',
                    url: '/admin/dashboard/create-system-passwords',
                },
            ],
        },
        // {
        //     title: 'Settings',
        //     url: '/dashboard/settings',
        //     icon: SettingsIcon,
        //     items: [],
        // },

    ],
    // projects: [
    //     {
    //         name: 'Design Engineering',
    //         url: '#',
    //         icon: Frame,
    //     },
    // ],
}
</script>

<template>
    <aside :class="[
        // base
        'relative flex flex-col border-r bg-white',
        // animate width only so child content can animate separately
        'transition-[width] duration-300 ease-in-out',
        // width when collapsed or expanded
        isCollapsed ? 'w-16' : 'w-64',
        // layout behavior: hidden on small screens unless mobile open; visible on md+
        isMobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden md:flex',
        // full height for overlay mode
        isMobileOpen ? 'h-full' : 'h-screen'
    ]">
        <!-- Header -->
        <div class="border-b p-4 border-gray-200">
            <button :class="[
                'flex items-center gap-3 rounded-md transition-all duration-300',
                isCollapsed ? 'justify-center' : 'w-full'
            ]">
                <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-black text-white">
                    <AppLogo class="h-4 w-4" />
                </div>
                <div v-show="!isCollapsed" class="flex-1 text-left text-sm transition-all duration-300">
                    <div class="font-medium text-gray-900">NanoPass</div>
                </div>
            </button>
        </div>

        <!-- Content -->
        <div class="relative flex-1 overflow-y-auto">
            <NavMain :items="data.navMain" :is-collapsed="isCollapsed" :current-route="route.path" />
            <!-- <NavProjects v-if="!isCollapsed" :projects="data.projects" /> -->
        </div>

        <!-- Footer -->
        <div class="border-t p-2 border-gray-200">
            <NavUser :user="data.user" :is-collapsed="isCollapsed" />
        </div>
    </aside>
</template>
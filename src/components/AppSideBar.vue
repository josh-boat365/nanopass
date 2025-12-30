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
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/useUserStore';

const route = useRoute()
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

defineProps({
    isCollapsed: { type: Boolean, default: false },
    isMobileOpen: { type: Boolean, default: false }
})

const data = {
    user: {
        name: user.value?.username || 'NanoPass User',
        email: user.value?.email || 'testuser@nanopass.com',
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
                    title: 'My Dashboard',
                    url: '/user/dashboard',
                },
                {
                    title: 'My Dashboard2',
                    url: '/user/dashboard2',
                },
                {
                    title: 'Assigned Keys',
                    url: '/user/assigned-keys',
                },
                {
                    title: 'Personal Keys',
                    url: '/user/personal-keys',
                },
                {
                    title: 'Access Trails',
                    url: '/admin/dashboard/auth-trails',
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
                },
                {
                    title: 'Assign Keys to Users',
                    // url: '/admin/dashboard/assign-keys-to-users',
                    url: '/admin/dashboard/assign-systems-to-users',
                },
                // {
                //     title: 'System Assignments',
                //     url: '/admin/dashboard/system-assignments',
                // },
            ],
        },
        {
            title: 'App Configs',
            url: '#',
            icon: Settings2,
            items: [
                {
                    title: 'Create System Passwords Policy',
                    url: '/admin/dashboard/create-system-passwords-policy',
                },
                {
                    title: 'Create System Category',
                    url: '/admin/dashboard/create-system-category',
                },
                {
                    title: 'Create System/App',
                    url: '/admin/dashboard/create-system',
                },
                {
                    title: 'Create Passwords For Systems/Apps',
                    url: '/admin/dashboard/create-passwords-for-systems',
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
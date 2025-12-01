<!-- AppSidebar.vue -->
<script setup>
import {
    Frame,
    Settings2,
    LayoutDashboard,
} from 'lucide-vue-next'
import { ref } from 'vue'
import NavMain from '../components/NavMain.vue'
import NavProjects from '../components/NavProjects.vue'
import NavUser from '../components/NavUser.vue'
import AppLogo from './AppLogo.vue'

const isCollapsed = ref(false)

const data = {
    user: {
        name: 'NanoPass',
        email: 'm@nanopass.com',
        avatar: '/avatars/shadcn.jpg',
    },
    navMain: [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutDashboard,
            isActive: true,
            items: [
                {
                    title: 'History',
                    url: '#',
                },
                {
                    title: 'Starred',
                    url: '#',
                },
                {
                    title: 'Settings',
                    url: '#',
                },
            ],
        },
        {
            title: 'Settings',
            url: '#',
            icon: Settings2,
            items: [
                {
                    title: 'General',
                    url: '#',
                },
                {
                    title: 'Team',
                    url: '#',
                },
                {
                    title: 'Billing',
                    url: '#',
                },
                {
                    title: 'Limits',
                    url: '#',
                },
            ],
        },
    ],
    projects: [
        {
            name: 'Design Engineering',
            url: '#',
            icon: Frame,
        },
    ],
}
</script>

<template>
    <aside :class="[
        'flex h-screen flex-col border-r bg-slate-100 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
    ]">
        <!-- Header -->
        <div class="border-b p-4 border-gray-200">
            <button class="flex w-full items-center gap-3 rounded-md">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                    <AppLogo class="h-4 w-4" />
                </div>
                <div v-if="!isCollapsed" class="flex-1 text-left text-sm">
                    <div class="font-medium text-gray-900">NanoPass</div>
                </div>
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            <NavMain :items="data.navMain" :is-collapsed="isCollapsed" />
            <NavProjects v-if="!isCollapsed" :projects="data.projects" />
        </div>

        <!-- Footer -->
        <div class="border-t p-2 border-gray-200">
            <NavUser :user="data.user" :is-collapsed="isCollapsed" />
        </div>
    </aside>
</template>
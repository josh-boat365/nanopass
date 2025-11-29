<script setup lang="ts">
import AppLogo from '../components/AppLogo.vue';

</script>


<template>
    <div class="grid min-h-screen lg:grid-cols-2">
        <!-- Left Side - Welcome Content -->
        <div class="hidden lg:flex lg:flex-col lg:p-12 bg-black relative">
            <!-- Logo at top left -->
            <div class="absolute top-12 left-12">
                <router-link to="/" class="flex items-center gap-2 font-medium">
                    <AppLogo />
                    <span class="text-white font-semibold">NanoPass</span>
                </router-link>
            </div>

            <!-- Welcome content centered -->
            <div class="flex flex-1 items-center justify-center">
                <div class="w-full max-w-lg">
                    <div class="text-[13px] leading-[20px]">
                        <h1 class="mb-4 text-3xl font-semibold leading-tight lg:text-4xl text-white">
                            Welcome to NanoPass
                        </h1>
                        <p class="mb-6 text-gray-300">
                            Your secure and user-friendly password manager. Store,
                            manage, and access your passwords with ease and safety.
                        </p>
                        <ul class="space-y-4">
                            <li class="flex items-start">
                                <span class="mr-3 mt-1 inline-block h-2 w-2 rounded-full bg-white" />
                                <span class="text-gray-300">Securely store all your passwords in one place.</span>
                            </li>
                            <li class="flex items-start">
                                <span class="mr-3 mt-1 inline-block h-2 w-2 rounded-full bg-white" />
                                <span class="text-gray-300">Generate strong, unique passwords effortlessly.</span>
                            </li>
                            <li class="flex items-start">
                                <span class="mr-3 mt-1 inline-block h-2 w-2 rounded-full bg-white" />
                                <span class="text-gray-300">Access your passwords anytime, anywhere.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Side - Login Form -->
        <slot />
    </div>
</template>

<script setup>
import AppLogo from '@/components/AppLogo.vue';

</script>


<template>
    <div class="grid min-h-screen lg:grid-cols-2">
        <!-- Left Side - Welcome Content -->
        <div class="hidden lg:flex lg:flex-col lg:p-12 bg-black relative">
            <!-- Logo at top left -->
            <div class="absolute top-12 left-12">
                <router-link to="/" class="flex items-center gap-2 font-medium">
                    <AppLogo />
                    <span class="text-slate-100 font-semibold text-xl">NanoPass</span>
                </router-link>
            </div>

            <!-- Welcome content centered -->
            <div class="flex flex-1 items-center justify-center">
                <div class="w-full max-w-lg">
                    <div class="text-[13px] leading-[20px]">
                        <h1 class="mb-4 text-3xl font-semibold leading-tight lg:text-4xl text-slate-100">
                            Welcome to NanoPass
                        </h1>
                        <p class="mb-6 text-lg text-slate-100">
                            Your secure and user-friendly password manager. Store,
                            manage, and access your passwords with ease and safety.
                        </p>
                        <ul class="space-y-4">
                            <li class="flex items-start">
                                <span class="mr-3 mt-3 inline-block h-2 w-2 rounded-full bg-slate-100" />
                                <span class="text-slate-100 text-lg">Securely store all your passwords in one
                                    place.</span>
                            </li>
                            <li class="flex items-start">
                                <span class="mr-3 mt-3 inline-block h-2 w-2 rounded-full bg-slate-100" />
                                <span class="text-slate-100 text-lg">Generate strong, unique passwords
                                    effortlessly.</span>
                            </li>
                            <li class="flex items-start">
                                <span class="mr-3 mt-3 inline-block h-2 w-2 rounded-full bg-slate-100" />
                                <span class="text-slate-100 text-lg">Access your passwords anytime,
                                    anywhere.</span>
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

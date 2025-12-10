<script setup>
import HomeLayout from '@/layouts/AuthLayout.vue'
import { ref } from 'vue'
import MicrosoftIcon from '@/components/icons/MicrosoftIcon.vue'

const email = ref('')
const password = ref('')

const handleLogin = () => {
    console.log('Login submitted:', {
        email: email.value,
        password: password.value,
    })
    // Add your login logic here
}

const handleMicrosoftLogin = () => {
    console.log('Microsoft login clicked')
    // Add your Microsoft OAuth logic here
}
</script>

<template>
    <HomeLayout>
        <!-- Right Side - Login Form -->
        <div class="flex flex-col gap-4 p-6 md:p-10 bg-white">
            <div class="flex flex-1 items-center justify-center">
                <div class="w-full max-w-md">
                    <div class="flex flex-col gap-6">
                        <!-- Header -->
                        <div class="flex flex-col items-center gap-1 text-center">
                            <h1 class="text-2xl font-bold text-gray-900">Login to your account</h1>
                            <p class="text-md text-gray-600">Enter your email below to login to your account</p>
                        </div>

                        <!-- Email Field -->
                        <div class="flex flex-col gap-2">
                            <label for="email" class="text-md font-medium text-gray-900">Email</label>
                            <input id="email" v-model="email" type="email" placeholder="m@nanopass.com"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                required />
                        </div>

                        <!-- Password Field -->
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between">
                                <label for="password" class="text-md font-medium text-gray-900">Password</label>
                                <a href="#" class="text-sm text-gray-900 underline-offset-4 hover:underline">Forgot your
                                    password?</a>
                            </div>
                            <input id="password" v-model="password" type="password"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                required />
                        </div>

                        <!-- Login Button -->
                        <router-link to="/admin/dashboard">
                            <button @click="handleLogin"
                                class="w-full px-4 py-2 text-md bg-black text-white font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                                Login
                            </button>
                        </router-link>

                        <!-- Separator -->
                        <div class="relative">
                            <div class="absolute inset-0 flex items-center">
                                <div class="w-full border-t border-gray-300"></div>
                            </div>
                            <div class="relative flex justify-center text-xs">
                                <span class="bg-white text-sm px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <!-- Microsoft Button -->
                        <div class="flex flex-col gap-2">
                            <button type="button" @click="handleMicrosoftLogin"
                                class="w-full px-4 py-2 border text-md border-gray-300 bg-white text-gray-900 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center gap-2">
                                <MicrosoftIcon />
                                Login with Microsoft
                            </button>

                            <p class="text-center text-sm text-gray-600">
                                Don't have an account?
                                <router-link to="/register"
                                    class="underline underline-offset-4 text-gray-900 hover:text-gray-900 hover:font-bold">Sign
                                    up</router-link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </HomeLayout>
</template>

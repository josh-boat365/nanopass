<script setup>
import HomeLayout from '@/layouts/AuthLayout.vue'
import { ref, computed } from 'vue'
import MicrosoftIcon from '@/components/icons/MicrosoftIcon.vue'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const passwordError = computed(() => {
    if (confirmPassword.value && password.value !== confirmPassword.value) {
        return 'Passwords do not match'
    }
    return ''
})

const handleRegister = () => {
    if (password.value !== confirmPassword.value) {
        console.error('Passwords do not match')
        return
    }

    console.log('Register submitted:', {
        username: username.value,
        email: email.value,
        password: password.value
    })
    // Add your registration logic here
}

const handleMicrosoftRegister = () => {
    console.log('Microsoft sign up clicked')
    // Add your Microsoft OAuth logic here
}
</script>

<template>
    <HomeLayout>


        <!-- Right Side - Register Form -->
        <div class="flex flex-col gap-4 p-6 md:p-10 bg-white">
            <div class="flex flex-1 items-center justify-center">
                <div class="w-full max-w-md">
                    <div class="flex flex-col gap-6">
                        <!-- Header -->
                        <div class="flex flex-col items-center gap-1 text-center">
                            <h1 class="text-2xl font-bold text-gray-900">
                                Create your account
                            </h1>
                            <p class="text-md text-gray-600">
                                Enter your information to get started
                            </p>
                        </div>

                        <!-- Username Field -->
                        <div class="flex flex-col gap-2">
                            <label for="username" class="text-md font-medium text-gray-900">
                                Username
                            </label>
                            <input id="username" v-model="username" type="text" placeholder="jnboateng"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                required />
                        </div>


                        <!-- Email Field -->
                        <div class="flex flex-col gap-2">
                            <label for="email" class="text-md font-medium text-gray-900">
                                Email
                            </label>
                            <input id="email" v-model="email" type="email" placeholder="jnboateng@nanopass.com"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                required />
                        </div>

                        <!-- Password Field -->
                        <div class="flex flex-col gap-2">
                            <label for="password" class="text-md font-medium text-gray-900">
                                Password
                            </label>
                            <input id="password" v-model="password" type="password"
                                placeholder="Create a strong password"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                required />
                        </div>

                        <!-- Confirm Password Field -->
                        <div class="flex flex-col gap-2">
                            <label for="confirmPassword" class="text-md font-medium text-gray-900">
                                Confirm Password
                            </label>
                            <input id="confirmPassword" v-model="confirmPassword" type="password"
                                placeholder="Re-enter your password"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                required />
                            <p v-if="passwordError" class="text-xs text-red-600">
                                {{ passwordError }}
                            </p>
                        </div>

                        <!-- Register Button -->
                        <button @click="handleRegister"
                            class="w-full px-4 py-2 bg-black text-white text-md font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                            Create Account
                        </button>

                        <!-- Separator -->
                        <div class="relative">
                            <div class="absolute inset-0 flex items-center">
                                <div class="w-full border-t border-gray-300"></div>
                            </div>
                            <div class="relative flex justify-center text-xs">
                                <span class="bg-white text-sm px-2 text-gray-500">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <!-- GitHub Button -->
                        <div class="flex flex-col gap-2">
                            <button type="button" @click="handleMicrosoftRegister"
                                class="w-full px-4 text-md py-2 border border-gray-300 bg-white text-gray-900 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center gap-2">
                                <MicrosoftIcon />
                                Sign up with Microsoft
                            </button>

                            <p class="text-center text-sm text-gray-600">
                                Already have an account?
                                <router-link to="/login" class="underline underline-offset-4 text-gray-900 hover:text-gray-900 hover:font-bold">
                                    Sign in
                                </router-link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </HomeLayout>
</template>



<style scoped>
/* Additional styles if needed */
</style>
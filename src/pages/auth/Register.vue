<script setup>
import HomeLayout from "@/layouts/AuthLayout.vue";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import MicrosoftIcon from "@/components/icons/MicrosoftIcon.vue";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const { success, error } = useToast();
const userStore = useUserStore();
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

// Loading and error states
const loading = ref(false);
const errors = ref({});

const passwordError = computed(() => {
  if (confirmPassword.value && password.value !== confirmPassword.value) {
    return "Passwords do not match";
  }
  return "";
});

const handleRegister = async () => {
  // Reset errors
  errors.value = {};

  // Client-side validation
  if (password.value !== confirmPassword.value) {
    error("Passwords do not match");
    return;
  }

  if (!username.value || !email.value || !password.value) {
    error("Please fill in all fields");
    return;
  }

  loading.value = true;

  try {
    const userData = {
      username: username.value,
      email: email.value,
      password: password.value,
      password_confirmation: confirmPassword.value,
    };

    const response = await userStore.register(userData, true);

    console.log("Registration successful:", response);

    // Show success toast
    success("Account created successfully! Redirecting to login...");

    // Redirect to login page
    setTimeout(() => {
      router.push(import.meta.env.BASE_URL + "login");
    }, 1500);
  } catch (err) {
    console.error("Registration failed:", err);

    // Handle Laravel validation errors
    if (err.data?.errors) {
      errors.value = err.data.errors;

      // Show first error in toast
      const firstError = Object.values(err.data.errors)[0][0];
      error(firstError);
    } else {
      error(err.message || "Registration failed. Please try again.");
    }
  } finally {
    loading.value = false;
  }
};

const handleMicrosoftRegister = () => {
  console.log("Microsoft sign up clicked");
  // Add your Microsoft OAuth logic here
};
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
              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="jnboateng"
                :disabled="loading"
                :class="{ 'border-red-500': errors.name }"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <p v-if="errors.name" class="text-xs text-red-600">
                {{ errors.name[0] }}
              </p>
            </div>

            <!-- Email Field -->
            <div class="flex flex-col gap-2">
              <label for="email" class="text-md font-medium text-gray-900">
                Email
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="jnboateng@nanopass.com"
                :disabled="loading"
                :class="{ 'border-red-500': errors.email }"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <p v-if="errors.email" class="text-xs text-red-600">
                {{ errors.email[0] }}
              </p>
            </div>

            <!-- Password Field -->
            <div class="flex flex-col gap-2">
              <label for="password" class="text-md font-medium text-gray-900">
                Password
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Create a strong password"
                :disabled="loading"
                :class="{ 'border-red-500': errors.password }"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <p v-if="errors.password" class="text-xs text-red-600">
                {{ errors.password[0] }}
              </p>
            </div>

            <!-- Confirm Password Field -->
            <div class="flex flex-col gap-2">
              <label
                for="confirmPassword"
                class="text-md font-medium text-gray-900"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                :disabled="loading"
                :class="{ 'border-red-500': passwordError }"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <p v-if="passwordError" class="text-xs text-red-600">
                {{ passwordError }}
              </p>
            </div>

            <!-- Register Button -->
            <button
              @click="handleRegister"
              :disabled="loading || !!passwordError"
              class="w-full px-4 py-2 bg-black text-white text-md font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span
                v-if="loading"
                class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></span>
              <span>{{
                loading ? "Creating Account..." : "Create Account"
              }}</span>
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

            <!-- Microsoft Button -->
            <div class="flex flex-col gap-2">
              <button
                type="button"
                @click="handleMicrosoftRegister"
                :disabled="loading"
                class="w-full px-4 text-md py-2 border border-gray-300 bg-white text-gray-900 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MicrosoftIcon />
                Sign up with Microsoft
              </button>

              <p class="text-center text-sm text-gray-600">
                Already have an account?
                <router-link
                  to="/login"
                  class="underline underline-offset-4 text-gray-900 hover:text-gray-900 hover:font-bold"
                >
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
/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

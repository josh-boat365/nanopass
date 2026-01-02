<script setup>
import HomeLayout from "@/layouts/AuthLayout.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import MicrosoftIcon from "@/components/icons/MicrosoftIcon.vue";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const { success, error } = useToast();
const userStore = useUserStore();

const username = ref("");
const password = ref("");

// Loading and error states
const loading = ref(false);
const errors = ref({});
const touched = ref({
  username: false,
  password: false,
});

// Mark field as touched when user interacts with it
const handleBlur = (field) => {
  touched.value[field] = true;
};

// Validate individual fields
const validateField = (field) => {
  if (!touched.value[field]) return "";

  if (field === "username") {
    if (!username.value) {
      return "Username is required";
    }
  }

  if (field === "password") {
    if (!password.value) {
      return "Password is required";
    }
  }

  return "";
};

const handleLogin = async () => {
  // Mark all fields as touched
  touched.value.username = true;
  touched.value.password = true;

  // Validate all fields
  const usernameError = validateField("username");
  const passwordError = validateField("password");

  if (usernameError || passwordError) {
    error("Please fill in all required fields");
    return;
  }

  loading.value = true;
  errors.value = {};

  try {
    const credentials = {
      username: username.value,
      password: password.value,
    };

    const response = await userStore.login(credentials);

    console.log("Login successful:", response);

    // Show success toast
    success("Login successful! Redirecting...");

    // Redirect to appropriate dashboard based on user role
    setTimeout(() => {
      const redirectPath = userStore.isAdmin
        ? "/admin/dashboard"
        : "/user/dashboard";
      router.push(redirectPath);
    }, 1000);
  } catch (err) {
    console.error("Login failed:", err);
    console.error("Full error object:", err);
    console.error("Error data:", err.data);
    console.error("Error status:", err.status);
    console.error("Error message:", err.message);

    // Handle different error scenarios
    if (err.data?.errors) {
      // Laravel validation errors
      errors.value = err.data.errors;

      // Show the main error message from API
      if (err.data.message) {
        error(err.data.message);
      } else {
        // Or show first validation error
        const firstError = Object.values(err.data.errors)[0][0];
        error(firstError);
      }
    } else if (err.data?.message === "Invalid credentials") {
      // Invalid credentials from API
      error("Invalid username or password");
    } else if (err.status === 401) {
      // Unauthorized - wrong credentials
      error("Invalid username or password");
    } else if (err.status === 422) {
      // Unprocessable entity
      error("Invalid credentials provided");
    } else if (err.status === 429) {
      // Too many requests
      error("Too many login attempts. Please try again later");
    } else if (err.status === 500) {
      // Server error
      error("Server error. Please try again later");
    } else {
      // Generic error
      error(err.message || "Login failed. Please try again");
    }
  } finally {
    loading.value = false;
  }
};

const handleMicrosoftLogin = () => {
  console.log("Microsoft login clicked");
  // Add your Microsoft OAuth logic here
};
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
              <h1 class="text-2xl font-bold text-gray-900">
                Login to your account
              </h1>
              <p class="text-md text-gray-600">
                Enter your username below to login to your account
              </p>
            </div>

            <!-- Username Field -->
            <div class="flex flex-col gap-2">
              <label for="username" class="text-md font-medium text-gray-900">
                Username <span class="text-red-500">*</span>
              </label>
              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="testuser0"
                :disabled="loading"
                :class="{
                  'border-red-500':
                    errors.username || validateField('username'),
                  'border-gray-300': !(
                    errors.username || validateField('username')
                  ),
                }"
                @blur="handleBlur('username')"
                class="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <p v-if="validateField('username')" class="text-xs text-red-600">
                {{ validateField("username") }}
              </p>
              <p v-else-if="errors.username" class="text-xs text-red-600">
                {{ errors.username[0] }}
              </p>
            </div>

            <!-- Password Field -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <label for="password" class="text-md font-medium text-gray-900">
                  Password <span class="text-red-500">*</span>
                </label>
                <a
                  href="#"
                  class="text-sm text-gray-900 underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Enter your password"
                :disabled="loading"
                :class="{
                  'border-red-500':
                    errors.password || validateField('password'),
                  'border-gray-300': !(
                    errors.password || validateField('password')
                  ),
                }"
                @blur="handleBlur('password')"
                @keyup.enter="handleLogin"
                class="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <p v-if="validateField('password')" class="text-xs text-red-600">
                {{ validateField("password") }}
              </p>
              <p v-else-if="errors.password" class="text-xs text-red-600">
                {{ errors.password[0] }}
              </p>
            </div>

            <!-- Login Button -->
            <button
              @click="handleLogin"
              :disabled="loading"
              class="w-full px-4 py-2 text-md bg-black text-white font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span
                v-if="loading"
                class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></span>
              <span>{{ loading ? "Logging in..." : "Login" }}</span>
            </button>

            <!-- Separator -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-xs">
                <span class="bg-white text-sm px-2 text-gray-500"
                  >Or continue with</span
                >
              </div>
            </div>

            <!-- Microsoft Button -->
            <div class="flex flex-col gap-2">
              <button
                type="button"
                @click="handleMicrosoftLogin"
                :disabled="loading"
                class="w-full px-4 py-2 border text-md border-gray-300 bg-white text-gray-900 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MicrosoftIcon />
                Login with Microsoft
              </button>

              <p class="text-center text-sm text-gray-600">
                Don't have an account?
                <router-link
                  to="/register"
                  class="underline underline-offset-4 text-gray-900 hover:text-gray-900 hover:font-bold"
                >
                  Sign up
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

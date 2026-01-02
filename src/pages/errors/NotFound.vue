<template>
  <div
    class="min-h-screen bg-white flex flex-col items-center justify-center px-4"
  >
    <!-- Logo -->
    <div class="mb-12 flex items-center justify-center gap-3">
      <img
        src="@/assets/icons/codesandbox.svg"
        alt="Nanopass"
        class="h-16 w-16"
      />
      <h1 class="text-4xl sm:text-5xl font-bold text-black">NanoPass</h1>
    </div>

    <!-- Main Content -->
    <div class="w-full max-w-2xl text-center">
      <!-- Error Code -->
      <h1 class="text-9xl sm:text-10xl font-bold text-black mb-6">404</h1>

      <!-- Error Title -->
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
        Page Not Found
      </h2>

      <!-- Error Description -->
      <p class="text-gray-600 text-lg mb-12 max-w-lg mx-auto">
        The page you're looking for doesn't exist or has been moved. Check the
        URL and try again, or return to the home page.
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <router-link
          to="/"
          class="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-300 text-center"
        >
          Go to Home
        </router-link>
        <button
          @click="goBack"
          class="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300 border border-gray-200"
        >
          Go Back
        </button>
      </div>

      <!-- Additional Info -->
      <div class="text-center">
        <p class="text-gray-500 text-sm">
          Error Code: <code class="font-mono text-gray-700">404_NOT_FOUND</code>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>

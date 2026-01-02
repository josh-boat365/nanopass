<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4"
  >
    <div class="text-center">
      <!-- Error Code -->
      <div class="mb-8">
        <h1
          class="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-red-500"
        >
          500
        </h1>
      </div>

      <!-- Error Title -->
      <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
        Server Error
      </h2>

      <!-- Error Description -->
      <p class="text-gray-400 text-lg mb-8 max-w-md mx-auto">
        Something went wrong on our end. Please try again later or contact
        support if the problem persists.
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <router-link
          to="/"
          class="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
        >
          Go Home
        </router-link>
        <button
          @click="goBack"
          class="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 shadow-lg"
        >
          Go Back
        </button>
      </div>

      <!-- Additional Info -->
      <div class="mt-16 pt-8 border-t border-gray-700">
        <p class="text-gray-500 text-sm">
          Error Code:
          <span class="font-mono text-gray-400">500_SERVER_ERROR</span>
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

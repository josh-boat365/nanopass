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
      <!-- Error Code in black (no gradient) -->
      <h1 class="text-9xl sm:text-10xl font-bold text-black mb-6">500</h1>

      <!-- Error Title -->
      <h2 class="text-3xl sm:text-4xl font-bold text-black mb-4">
        Server Error
      </h2>

      <!-- Error Description -->
      <p class="text-gray-700 text-lg mb-8 max-w-lg mx-auto">
        Something went wrong on our end. Our team has been notified of the
        issue. Please try again later or return to the home page.
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <router-link
          to="/"
          class="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-all duration-300"
        >
          Go to Home
        </router-link>
        <button
          @click="goBack"
          class="px-8 py-3 bg-gray-200 text-black font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
        >
          Go Back
        </button>
      </div>

      <!-- Error Code Display -->
      <div class="mt-8 pt-8 border-t border-gray-300">
        <p class="text-gray-600 text-sm mb-2">Error Code</p>
        <code class="text-black text-sm font-mono">500_SERVER_ERROR</code>
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

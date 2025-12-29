<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const getToastIcon = (type) => {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    default:
      return 'ℹ'
  }
}

const getToastClasses = (type) => {
  const baseClasses = 'flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[300px] max-w-md'
  
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-50 border border-green-200 text-green-800`
    case 'error':
      return `${baseClasses} bg-red-50 border border-red-200 text-red-800`
    case 'warning':
      return `${baseClasses} bg-yellow-50 border border-yellow-200 text-yellow-800`
    case 'info':
      return `${baseClasses} bg-blue-50 border border-blue-200 text-blue-800`
    default:
      return `${baseClasses} bg-gray-50 border border-gray-200 text-gray-800`
  }
}

const getIconClasses = (type) => {
  const baseClasses = 'flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold'
  
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-500`
    case 'error':
      return `${baseClasses} bg-red-500`
    case 'warning':
      return `${baseClasses} bg-yellow-500`
    case 'info':
      return `${baseClasses} bg-blue-500`
    default:
      return `${baseClasses} bg-gray-500`
  }
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="getToastClasses(toast.type)"
      >
        <!-- Icon -->
        <div :class="getIconClasses(toast.type)">
          {{ getToastIcon(toast.type) }}
        </div>

        <!-- Message -->
        <div class="flex-1 text-sm font-medium">
          {{ toast.message }}
        </div>

        <!-- Close Button -->
        <button
          @click="removeToast(toast.id)"
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
/* Toast enter/leave animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
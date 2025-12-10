<script setup>
import { PanelRightOpen, ChevronRight } from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();

defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["toggle-sidebar"]);

const navigateTo = (path) => {
  if (path !== "#") {
    router.push(path);
  }
};
</script>

<template>
     <header
        class="flex h-16 items-center justify-between gap-4 border-b bg-white px-4"
      >
        <div class="flex items-center gap-4">
          <button
            @click="$emit('toggle-sidebar')"
            class="rounded-md p-2 hover:bg-gray-100"
          >
            <PanelRightOpen class="h-5 w-5" />
          </button>

          <div class="h-4 w-px bg-gray-200"></div>

          <!-- Breadcrumb -->
          <nav class="flex items-center gap-2 text-sm">
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
              <button
                v-if="crumb.path !== '#'"
                @click="navigateTo(crumb.path)"
                :class="[
                  'hover:text-gray-900 transition-colors',
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-600',
                ]"
              >
                {{ crumb.label }}
              </button>
              <span v-else class="text-gray-600">{{ crumb.label }}</span>
              <ChevronRight
                v-if="index < breadcrumbs.length - 1"
                class="h-4 w-4 text-gray-400"
              />
            </template>
          </nav>
        </div>
      </header>
</template>
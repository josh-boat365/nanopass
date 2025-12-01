<script setup>
import BaseLayout from '@/layouts/AppLayout.vue'
</script>

<template>
    <BaseLayout>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-4 mb-4 text-gray-700">
            Welcome to your dashboard! Here you can find an overview of your activities and statistics.
        </p>
        <div class="mb-4 grid gap-4 md:grid-cols-3">
            <div class="aspect-video rounded-xl bg-gray-200"></div>
            <div class="aspect-video rounded-xl bg-gray-200"></div>
            <div class="aspect-video rounded-xl bg-gray-200"></div>
        </div>
        <div class="min-h-[100vh] rounded-xl bg-gray-200"></div>
    </BaseLayout>
</template>
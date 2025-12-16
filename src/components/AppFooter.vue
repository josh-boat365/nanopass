<script setup>
const currentYear = new Date().getFullYear();
</script>

<template>
    <footer class="border-t bg-white p-2 text-center text-sm text-gray-500">
        &copy; 2025 - <span>{{ currentYear }}</span> NanoPass. All rights reserved. Developed with ❤️ by IT BPSL Team.
    </footer>
</template>
<template>
  <router-view v-if="isFloatingRoute" />
  <AppLayout v-else />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'

const route = useRoute()
const isFloatingRoute = computed(() => route.path === '/floating')
</script>

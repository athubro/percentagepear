<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from './stores/appStore'
import AppShell from './components/AppShell.vue'
import VisitCounter from './components/VisitCounter.vue'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const isLanding = ref(true)

watch(
  () => route.name,
  (name) => {
    isLanding.value = name === 'landing'
  },
  { immediate: true }
)

onMounted(() => {
  store.applyTheme()
  // A hard page reload should return to the main login/landing page instead
  // of resuming mid-session on the dashboard or a nested route.
  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined
  if (nav?.type === 'reload') {
    router.push('/')
  }
})
</script>

<template>
  <VisitCounter />
  <router-view v-if="isLanding" />
  <AppShell v-else>
    <router-view />
  </AppShell>
</template>

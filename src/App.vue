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
const showBanner = ref(false)

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
  // Show iPhone shortcut banner on desktop only, dismissible
  if (window.innerWidth > 700 && !localStorage.getItem('pp-iphone-banner-dismissed')) {
    showBanner.value = true
  }
})

function dismissBanner() {
  showBanner.value = false
  localStorage.setItem('pp-iphone-banner-dismissed', '1')
}
</script>

<template>
  <VisitCounter />
  <div v-if="showBanner" class="iphone-banner">
    <span>You can now use PercentagePear as a shortcut on iPhone — tap Share → Add to Home Screen.</span>
    <button class="iphone-banner-close" @click="dismissBanner" aria-label="Dismiss">×</button>
  </div>
  <router-view v-if="isLanding" />
  <AppShell v-else>
    <router-view />
  </AppShell>
</template>

<style scoped>
.iphone-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--primary, #22c55e);
  color: #fff;
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
}
.iphone-banner-close {
  background: transparent;
  border: 0;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}
</style>

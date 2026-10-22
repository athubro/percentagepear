<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/appStore'
import AppShell from './components/AppShell.vue'
import VisitCounter from './components/VisitCounter.vue'

const store = useAppStore()
const route = useRoute()
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
})
</script>

<template>
  <VisitCounter />
  <router-view v-if="isLanding" />
  <AppShell v-else>
    <router-view />
  </AppShell>
</template>

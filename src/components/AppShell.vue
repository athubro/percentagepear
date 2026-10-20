<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()
const sidebarOpen = ref(false)

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/gradebook', label: 'Gradebook', icon: '▤' },
  { to: '/assignments', label: 'Assignments', icon: '☑' },
  { to: '/scenarios', label: 'Scenarios', icon: '◎' },
  { to: '/schedule', label: 'Schedule', icon: '◷' },
  { to: '/attendance', label: 'Attendance', icon: '◷' },
  { to: '/documents', label: 'Documents', icon: '📄' },
  { to: '/analytics', label: 'Analytics', icon: '▥' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">
        <div class="pear-logo" aria-hidden="true" />
        <span>PercentagePear</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          @click="sidebarOpen = false"
        >
          <span aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div v-if="store.isDemo" class="badge badge-demo" style="margin-bottom:0.5rem">Demo Data</div>
        <div>{{ store.student?.name }}</div>
        <div style="opacity:.7">{{ store.student?.school }}</div>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="mobile-toggle" aria-label="Open menu" @click="sidebarOpen = !sidebarOpen">☰</button>
          <span v-if="store.isDemo" class="badge badge-demo">Demo Data — not official records</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-ghost btn-sm" @click="store.setTheme(store.preferences.theme === 'dark' ? 'light' : 'dark')">
            {{ store.preferences.theme === 'dark' ? '☀' : '☾' }}
          </button>
          <router-link to="/connect" class="btn btn-secondary btn-sm">Connect StudentVUE</router-link>
        </div>
      </header>
      <main class="page-content">
        <slot />
      </main>
    </div>

    <!-- mobile overlay -->
    <div
      v-if="sidebarOpen"
      style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:35"
      @click="sidebarOpen = false"
    />
  </div>
</template>

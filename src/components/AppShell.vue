<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import SettingsView from '../views/SettingsView.vue'

const store = useAppStore()
const router = useRouter()
const sidebarOpen = ref(false)
const showSettings = ref(false)

const nav = [
  { to: '/schedule', label: 'Schedule', icon: '◷' },
  { to: '/dashboard', label: 'Gradebook', icon: '▣' },
  { to: '/attendance', label: 'Attendance', icon: '□' },
  { to: '/assignments', label: 'Assignments', icon: '☑' },
  { to: '/analytics', label: 'Insights', icon: '◔' },
  { to: '/scenarios', label: 'Scenarios', icon: '◎' },
]

function signOut() {
  store.logoutStudentVue()
  router.push('/')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <router-link to="/dashboard" class="sidebar-brand" @click="sidebarOpen = false"><div class="pear-logo" aria-hidden="true" /><span>Percentage Pear</span></router-link>
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
        <button class="nav-item nav-button" @click="showSettings = true; sidebarOpen = false"><span>⚙</span>Settings</button>
        <button class="nav-item nav-button" @click="signOut"><span>↪</span>Sign out</button>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-start"><button class="mobile-toggle" aria-label="Open menu" @click="sidebarOpen = !sidebarOpen">☰</button><span class="mobile-brand">Percentage Pear</span><span class="desktop-brand"><span class="pear-logo" aria-hidden="true" />Percentage Pear</span></div>
        <div class="topbar-actions">
          <span v-if="store.isDemo" class="badge badge-demo">Guest</span>
          <button class="icon-button" :aria-label="store.preferences.theme === 'dark' ? 'Use light theme' : 'Use dark theme'" @click="store.setTheme(store.preferences.theme === 'dark' ? 'light' : 'dark')">
            {{ store.preferences.theme === 'dark' ? '☀' : '☾' }}
          </button>
          <button class="avatar" :title="store.student?.name" @click="showSettings = true">{{ store.student?.name?.slice(0, 1) || 'P' }}</button>
        </div>
      </header>
      <main class="page-content">
        <slot />
      </main>
    </div>

    <!-- mobile overlay -->
    <div v-if="sidebarOpen" class="mobile-overlay" @click="sidebarOpen = false" />
    <div v-if="showSettings" class="modal-backdrop" @click.self="showSettings = false">
      <section class="modal settings-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <button class="settings-close" aria-label="Close settings" @click="showSettings = false">×</button>
        <SettingsView />
      </section>
    </div>
  </div>
</template>

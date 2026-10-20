<script setup lang="ts">
import { useAppStore } from '../stores/appStore'
import { useRouter } from 'vue-router'

const store = useAppStore()
const router = useRouter()

function clearAll() {
  if (confirm('Clear all local scenarios and reset demo data?')) {
    localStorage.removeItem('percentagepear-state-v1')
    store.enterGuestMode()
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Settings</h1>
        <p>Preferences and data controls</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem;max-width:480px">
      <h2 style="font-size:1rem;margin-bottom:1rem">Appearance</h2>
      <div class="form-group">
        <label>Theme</label>
        <select class="select" :value="store.preferences.theme" @change="store.setTheme(($event.target as HTMLSelectElement).value as any)">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div class="form-group">
        <label>Grade decimal places</label>
        <select
          class="select"
          :value="store.preferences.gradeRounding"
          @change="store.preferences.gradeRounding = Number(($event.target as HTMLSelectElement).value); store.persist()"
        >
          <option :value="0">0</option>
          <option :value="1">1</option>
          <option :value="2">2</option>
        </select>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem;max-width:480px">
      <h2 style="font-size:1rem;margin-bottom:1rem">Data</h2>
      <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:0.75rem">
        Mode: <strong>{{ store.mode }}</strong>
        · Scenarios stored: {{ store.scenarios.length }}
      </p>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button class="btn btn-secondary" @click="store.resetDemo">Reset Demo Data</button>
        <button class="btn btn-secondary" @click="clearAll">Clear Local Storage</button>
        <button class="btn btn-ghost" @click="router.push('/')">Back to Landing</button>
      </div>
    </div>

    <div class="card" style="max-width:480px">
      <h2 style="font-size:1rem;margin-bottom:0.5rem">Privacy</h2>
      <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.5">
        Guest mode data stays in your browser only. Hypothetical changes are never sent to StudentVUE.
        When connected, credentials are used only for authenticated requests and are not stored permanently
        in this client implementation.
      </p>
    </div>
  </div>
</template>

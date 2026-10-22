<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../stores/appStore'
import { useRouter } from 'vue-router'
import { isValidHex, resolveColorVars } from '../styles/colorThemes'

const store = useAppStore()
const router = useRouter()

/** Text field for a custom hex color; empty means "use the theme default". */
const customHex = ref(store.preferences.customPrimary ?? '')

const hexIsValid = computed(
  () => customHex.value.trim() === '' || isValidHex(customHex.value)
)

/** The primary color actually in effect right now. */
const activePrimary = computed(
  () =>
    resolveColorVars(store.preferences.colorTheme, store.preferences.customPrimary)[
      '--primary'
    ]
)

const activeContrast = computed(
  () =>
    resolveColorVars(store.preferences.colorTheme, store.preferences.customPrimary)[
      '--primary-contrast'
    ]
)

function applyCustomHex() {
  if (!hexIsValid.value) return
  store.setCustomPrimary(customHex.value.trim() === '' ? null : customHex.value)
  customHex.value = store.preferences.customPrimary ?? ''
}

function clearCustom() {
  customHex.value = ''
  store.setCustomPrimary(null)
}

function updateLetterBound(index: number, bound: 'lower' | 'upper', value: string) {
  const number = Number(value)
  if (!Number.isFinite(number)) return
  const scale = store.preferences.letterScale.map((entry) => ({ ...entry }))
  scale[index][bound] = number
  store.setLetterScale(scale)
}

// Keep the text field in sync when the color picker or a theme click changes
// the stored custom color.
watch(
  () => store.preferences.customPrimary,
  (val) => {
    customHex.value = val ?? ''
  }
)

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

    <div class="card letter-scale-card" style="margin-bottom:1rem;max-width:620px">
      <div class="letter-scale-title"><div><h2>Letter Scale</h2><p>Set the percentage range used for each displayed letter grade.</p></div><button class="btn btn-secondary btn-sm" @click="store.resetLetterScale">Reset</button></div>
      <div class="table-wrap">
        <table class="letter-scale-table">
          <thead><tr><th>Letter</th><th>Lower</th><th>Upper</th></tr></thead>
          <tbody><tr v-for="(entry, index) in store.preferences.letterScale" :key="entry.letter">
            <td><span class="letter-token" :class="'grade-' + entry.letter">{{ entry.letter }}</span></td>
            <td><input class="input" type="number" min="0" max="100" step="0.01" :value="entry.lower" @change="updateLetterBound(index, 'lower', ($event.target as HTMLInputElement).value)" /></td>
            <td><input class="input" type="number" min="0" max="100" step="0.01" :value="entry.upper" @change="updateLetterBound(index, 'upper', ($event.target as HTMLInputElement).value)" /></td>
          </tr></tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem;max-width:480px">
      <h2 style="font-size:1rem;margin-bottom:1rem">Colors</h2>

      <div class="form-group">
        <label>Color theme</label>
        <div class="theme-grid">
          <button
            v-for="t in store.colorThemes"
            :key="t.id"
            type="button"
            class="theme-option"
            :class="{ active: store.preferences.colorTheme === t.id && !store.preferences.customPrimary }"
            :aria-pressed="store.preferences.colorTheme === t.id && !store.preferences.customPrimary"
            @click="store.setColorTheme(t.id)"
          >
            <span class="theme-swatch" :style="{ background: t.swatch }" aria-hidden="true" />
            <span>{{ t.label }}</span>
          </button>
        </div>
      </div>

      <div class="form-group">
        <label>Custom brand color</label>
        <div class="color-custom-row">
          <input
            type="color"
            :value="activePrimary"
            aria-label="Pick a custom brand color"
            @input="store.setCustomPrimary(($event.target as HTMLInputElement).value)"
          />
          <input
            class="input"
            type="text"
            placeholder="#16a34a"
            :value="customHex"
            :aria-invalid="!hexIsValid"
            @input="customHex = ($event.target as HTMLInputElement).value"
            @blur="applyCustomHex"
            @keyup.enter="applyCustomHex"
          />
          <button
            v-if="store.preferences.customPrimary"
            type="button"
            class="btn btn-secondary btn-sm"
            @click="clearCustom"
          >
            Use theme color
          </button>
        </div>
        <p v-if="!hexIsValid" style="font-size:0.8rem;color:var(--danger);margin-top:0.4rem">
          Enter a valid hex color (for example #16a34a).
        </p>
        <div class="color-preview" style="margin-top:0.6rem">
          <span class="chip" :style="{ background: activePrimary }" aria-hidden="true" />
          <span>Primary {{ activePrimary }} · text {{ activeContrast }}</span>
        </div>
      </div>

      <button type="button" class="btn btn-secondary btn-sm" @click="store.resetColorTheme">
        Reset colors
      </button>
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

<style scoped>
.letter-scale-title { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1rem; }.letter-scale-title h2 { font-size:1rem; margin-bottom:.25rem; }.letter-scale-title p { color:var(--text-muted); font-size:.82rem; }.letter-scale-table .input { min-width:82px; padding:.4rem .55rem; }.letter-token { display:inline-grid; min-width:2.5rem; place-items:center; padding:.2rem .5rem; border:1px solid var(--border); border-radius:8px; font-weight:750; }.letter-token.grade-A { color:#166534; }.letter-token.grade-B { color:#1e40af; }.letter-token.grade-C { color:#854d0e; }.letter-token.grade-D { color:#9a3412; }.letter-token.grade-E { color:#991b1b; }
</style>

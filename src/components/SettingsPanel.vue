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

const activeVars = computed(() =>
  resolveColorVars(
    store.preferences.colorTheme,
    store.preferences.customPrimary,
    store.preferences.gradeColors
  )
)

/** The primary color actually in effect right now. */
const activePrimary = computed(() => activeVars.value['--primary'])
const activeContrast = computed(() => activeVars.value['--primary-contrast'])

/** The color in effect for each letter grade. */
const activeGradeColors = computed(() => {
  const out: Record<string, string> = {}
  for (const letter of store.gradeLetters) {
    out[letter] = activeVars.value[`--grade-${letter}`]
  }
  return out
})

function applyCustomHex() {
  if (!hexIsValid.value) return
  store.setCustomPrimary(customHex.value.trim() === '' ? null : customHex.value)
  customHex.value = store.preferences.customPrimary ?? ''
}

function clearCustom() {
  customHex.value = ''
  store.setCustomPrimary(null)
}

// Keep the text field in sync when the color picker changes the stored color.
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
  <div class="settings-panel">
    <div class="card" style="margin-bottom:1rem">
      <h2 style="font-size:1rem;margin-bottom:1rem">Appearance</h2>
      <div class="form-group">
        <label>Theme</label>
        <select
          class="select"
          :value="store.preferences.theme"
          @change="store.setTheme(($event.target as HTMLSelectElement).value as any)"
        >
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

    <div class="card" style="margin-bottom:1rem">
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

    <div class="card" style="margin-bottom:1rem">
      <h2 style="font-size:1rem;margin-bottom:1rem">Grade colors</h2>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.75rem">
        Choose the color used for each letter grade badge.
      </p>
      <div class="grade-color-grid">
        <div v-for="letter in store.gradeLetters" :key="letter" class="grade-color-item">
          <span
            class="grade-pill grade-preview"
            :class="'grade-' + letter"
            aria-hidden="true"
          >
            {{ letter }}
          </span>
          <input
            type="color"
            :value="activeGradeColors[letter]"
            :aria-label="'Pick a color for grade ' + letter"
            @input="store.setGradeColor(letter, ($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="store.preferences.gradeColors[letter]"
            type="button"
            class="btn btn-ghost btn-sm"
            @click="store.setGradeColor(letter, null)"
          >
            Reset
          </button>
        </div>
      </div>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        style="margin-top:0.75rem"
        @click="store.resetGradeColors"
      >
        Reset grade colors
      </button>
    </div>

    <div class="card" style="margin-bottom:1rem">
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

    <div class="card">
      <h2 style="font-size:1rem;margin-bottom:0.5rem">Privacy</h2>
      <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.5">
        Guest mode data stays in your browser only. Hypothetical changes are never sent to StudentVUE.
        When connected, credentials are used only for authenticated requests and are not stored permanently
        in this client implementation.
      </p>
    </div>
  </div>
</template>



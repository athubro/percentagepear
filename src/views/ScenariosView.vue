<script setup lang="ts">
import { useAppStore } from '../stores/appStore'
import { formatGrade } from '../engine/gradeCalculator'
import { useRouter } from 'vue-router'

const store = useAppStore()
const router = useRouter()

function courseName(id: string) {
  return store.getCourse(id)?.name || id
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Scenarios</h1>
        <p>Saved what-if simulations · persisted in this browser</p>
      </div>
    </div>
    <div v-if="!store.scenarios.length" class="empty-state card">
      <h3>No scenarios yet</h3>
      <p>Open a course gradebook and click “Save Scenario” after adding hypothetical assignments.</p>
      <button class="btn btn-primary" style="margin-top:1rem" @click="router.push('/gradebook')">Go to Gradebook</button>
    </div>
    <div class="grid-cards">
      <div v-for="s in store.scenarios" :key="s.id" class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <strong>{{ s.name }}</strong>
            <div style="font-size:0.85rem;color:var(--text-muted)">{{ courseName(s.courseId) }}</div>
          </div>
          <span class="badge" :class="store.activeScenarioId === s.id ? 'badge-success' : ''">
            {{ store.activeScenarioId === s.id ? 'Active' : 'Saved' }}
          </span>
        </div>
        <div style="margin:0.75rem 0;font-size:0.9rem">
          Baseline: {{ formatGrade(s.baselineSnapshot.grade, 1) }}% {{ s.baselineSnapshot.letter }}
          · Hyp: {{ s.hypotheticalAssignments.length }} · Edits: {{ Object.keys(s.modifiedScores).length }}
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted)">Updated {{ new Date(s.updatedAt).toLocaleString() }}</div>
        <div style="display:flex;gap:0.4rem;margin-top:0.85rem;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" @click="store.setActiveScenario(s.id); router.push({ name: 'gradebook', params: { courseId: s.courseId } })">Open</button>
          <button class="btn btn-secondary btn-sm" @click="store.duplicateScenario(s.id)">Duplicate</button>
          <button class="btn btn-ghost btn-sm" @click="store.deleteScenario(s.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

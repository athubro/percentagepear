<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { formatGrade } from '../engine/gradeCalculator'
import type { Assignment } from '../types'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const selectedId = ref((route.params.courseId as string) || store.courses[0]?.id || '')
const search = ref('')
const statusFilter = ref('all')
const isAdding = ref(false)

// Add form
const newName = ref('')
const newCat = ref('')
const newPts = ref(100)
const newScore = ref<number | null>(90)
const newDue = ref(new Date().toISOString().slice(0, 10))

watch(
  () => route.params.courseId,
  (id) => {
    if (id) selectedId.value = id as string
  }
)

const course = computed(() => store.getCourse(selectedId.value))
const comparison = computed(() => { void store.simVersion; return store.getGradeComparison(selectedId.value) })
const assignments = computed(() => {
  void store.simVersion
  let list = store.getSimulatedAssignments(selectedId.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((a) => a.name.toLowerCase().includes(q))
  }
  if (statusFilter.value !== 'all') {
    list = list.filter((a) => a.status === statusFilter.value || (statusFilter.value === 'hypothetical' && a.isHypothetical))
  }
  return list
})

const scenariosForCourse = computed(() =>
  store.scenarios.filter((s) => s.courseId === selectedId.value)
)

function goBack() {
  router.push('/dashboard')
}

function openAdd() {
  if (!course.value) return
  newCat.value = course.value.categories[0]?.id || ''
  newName.value = ''
  newPts.value = 100
  newScore.value = 90
  isAdding.value = true
}

function submitAdd() {
  if (!course.value || !newName.value.trim()) return
  store.addHypothetical(selectedId.value, {
    name: newName.value.trim(),
    categoryId: newCat.value,
    pointsPossible: Number(newPts.value) || 0,
    score: newScore.value,
    dueDate: newDue.value,
  })
  isAdding.value = false
}

function onScoreEdit(a: Assignment, val: string) {
  const num = val === '' ? null : Number(val)
  if (num !== null && Number.isNaN(num)) return
  store.updateHypotheticalScore(selectedId.value, a.id, num)
}

function removeHyp(a: Assignment) {
  store.deleteHypothetical(selectedId.value, a.id)
}

function createQuickScenario() {
  const name = prompt('Scenario name', 'What-If Simulation')
  if (name) store.createScenario(selectedId.value, name)
}

function catName(id: string) {
  return course.value?.categories.find((c) => c.id === id)?.name || id
}
</script>

<template>
  <div v-if="course">
    <div class="page-header gradebook-header">
      <div>
        <button class="back-to-classes" @click="goBack">← All classes</button>
        <h1>{{ course.name }}</h1>
        <p>{{ course.teacher.name }} · Period {{ course.period }}</p>
      </div>
      <div class="course-actions">
        <button class="icon-button icon-button-primary" title="Add assignment" aria-label="Add hypothetical assignment" @click="openAdd">＋</button>
        <button class="btn btn-secondary btn-sm" @click="createQuickScenario">Save scenario</button>
        <button class="btn btn-ghost btn-sm" @click="store.resetSimulation(selectedId)">Reset</button>
      </div>
    </div>

    <!-- Grade summary -->
    <div class="card" style="margin-bottom:1.25rem" v-if="comparison">
      <div style="display:flex;flex-wrap:wrap;gap:2rem;align-items:center">
        <div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.25rem">Original</div>
          <span class="grade-pill" :class="'grade-' + comparison.original.letter">
            {{ formatGrade(comparison.original.percentage, store.preferences.gradeRounding) }}%
            {{ comparison.original.letter }}
          </span>
        </div>
        <div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.25rem">Projected</div>
          <span class="grade-pill" :class="'grade-' + comparison.projected.letter">
            {{ formatGrade(comparison.projected.percentage, store.preferences.gradeRounding) }}%
            {{ comparison.projected.letter }}
          </span>
        </div>
        <div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.25rem">Change</div>
          <span :class="comparison.delta >= 0 ? 'delta-pos' : 'delta-neg'" style="font-size:1.25rem">
            {{ comparison.delta >= 0 ? '+' : '' }}{{ formatGrade(comparison.delta, 1) }} pts
          </span>
        </div>
        <div style="margin-left:auto;font-size:0.85rem;color:var(--text-muted)">
          Model: {{ comparison.projected.method === 'weighted_categories' ? 'Weighted categories' : 'Total points' }}
        </div>
      </div>
      <div v-if="comparison.projected.byCategory.length" style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:0.75rem">
        <div
          v-for="cat in comparison.projected.byCategory"
          :key="cat.categoryId"
          style="font-size:0.8rem;padding:0.35rem 0.6rem;background:var(--bg);border-radius:6px;border:1px solid var(--border)"
        >
          <strong>{{ cat.name }}</strong> ({{ cat.weight }}%):
          {{ formatGrade(cat.percentage, 1) }}%
          · {{ cat.earned }}/{{ cat.possible }}
        </div>
      </div>
    </div>

    <!-- Scenario switcher -->
    <div v-if="scenariosForCourse.length" style="margin-bottom:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
      <span style="font-size:0.85rem;color:var(--text-muted)">Scenarios:</span>
      <button
        class="btn btn-sm"
        :class="!store.activeScenarioId ? 'btn-primary' : 'btn-secondary'"
        @click="store.setActiveScenario(null)"
      >Baseline</button>
      <button
        v-for="s in scenariosForCourse"
        :key="s.id"
        class="btn btn-sm"
        :class="store.activeScenarioId === s.id ? 'btn-primary' : 'btn-secondary'"
        @click="store.setActiveScenario(s.id)"
      >{{ s.name }}</button>
    </div>

    <!-- Filters -->
    <div style="display:flex;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap">
      <input v-model="search" class="input" placeholder="Search assignments…" style="max-width:240px" />
      <select v-model="statusFilter" class="select" style="max-width:160px">
        <option value="all">All statuses</option>
        <option value="graded">Graded</option>
        <option value="missing">Missing</option>
        <option value="upcoming">Upcoming</option>
        <option value="hypothetical">Hypothetical</option>
      </select>
    </div>

    <!-- Assignment table -->
    <div class="card table-wrap assignment-table">
      <table>
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Category</th>
            <th>Due</th>
            <th>Score</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isAdding" class="new-assignment-row">
            <td><input v-model="newName" class="input" placeholder="New assignment" @keyup.enter="submitAdd" /></td>
            <td><select v-model="newCat" class="select"><option v-for="cat in course.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option></select></td>
            <td><input v-model="newDue" class="input" type="date" /></td>
            <td><input v-model.number="newScore" class="input score-input" type="number" min="0" placeholder="Score" /><span class="score-divider"> / </span><input v-model.number="newPts" class="input points-input" type="number" min="0" placeholder="Pts" /></td>
            <td><span class="badge badge-hyp">New</span></td>
            <td class="draft-actions"><button class="btn btn-primary btn-sm" @click="submitAdd">Add</button><button class="btn btn-ghost btn-sm" @click="isAdding = false">Cancel</button></td>
          </tr>
          <tr v-for="a in assignments" :key="a.id">
            <td>
              {{ a.name }}
              <span v-if="a.isHypothetical" class="badge badge-hyp" style="margin-left:0.35rem">Hypothetical</span>
            </td>
            <td>{{ catName(a.categoryId) }}</td>
            <td>{{ a.dueDate }}</td>
            <td>
              <input
                type="number"
                class="input"
                style="width:5rem;padding:0.25rem 0.4rem"
                :value="a.score ?? ''"
                :max="a.extraCredit ? undefined : a.pointsPossible"
                min="0"
                step="0.5"
                @input="onScoreEdit(a, ($event.target as HTMLInputElement).value)"
              />
              <span style="color:var(--text-muted);font-size:0.85rem"> / {{ a.pointsPossible }}</span>
            </td>
            <td>
              <span
                class="badge"
                :class="{
                  'badge-missing': a.status === 'missing',
                  'badge-hyp': a.isHypothetical,
                  'badge-success': a.status === 'graded' && !a.isHypothetical,
                }"
              >{{ a.status }}</span>
            </td>
            <td>
              <button
                v-if="a.isHypothetical"
                class="btn btn-ghost btn-sm"
                title="Delete hypothetical"
                @click="removeHyp(a)"
              >✕</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!assignments.length" class="empty-state">No assignments match your filters.</div>
    </div>

  </div>
  <div v-else class="empty-state">
    <h3>No course selected</h3>
    <p>Choose a course from the dashboard.</p>
  </div>
</template>

<style scoped>
.gradebook-header { margin-bottom:1rem; }.back-to-classes { border:0; background:none; color:var(--primary); cursor:pointer; font-size:.85rem; font-weight:650; padding:0; margin-bottom:.35rem; }.course-actions { display:flex; gap:.45rem; flex-wrap:wrap; align-items:center; }.new-assignment-row td { background:var(--primary-soft); vertical-align:middle; }.score-input { width:4.25rem; display:inline-block; padding:.35rem; }.points-input { width:3.75rem; display:inline-block; padding:.35rem; }.score-divider { color:var(--text-muted); }.draft-actions { white-space:nowrap; }
@media (max-width:700px) { .assignment-table table { font-size:.82rem; }.assignment-table th:nth-child(2),.assignment-table td:nth-child(2),.assignment-table th:nth-child(5),.assignment-table td:nth-child(5) { display:none; }.assignment-table th,.assignment-table td { padding:.55rem .4rem; }.assignment-table th:nth-child(1) { min-width:130px; }.assignment-table th:nth-child(3) { min-width:94px; }.assignment-table .input { max-width:100%; }.new-assignment-row td:nth-child(4) { min-width:130px; }.draft-actions .btn { padding:.3rem .4rem; }.course-actions { width:100%; }.course-actions .btn-secondary { flex:1; justify-content:center; } }
@media (max-width:700px) { .gradebook-header .course-actions { width:100%; } }
</style>

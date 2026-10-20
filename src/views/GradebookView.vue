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
const showAddModal = ref(false)

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

function selectCourse(id: string) {
  selectedId.value = id
  router.replace({ name: 'gradebook', params: { courseId: id } })
}

function openAdd() {
  if (!course.value) return
  newCat.value = course.value.categories[0]?.id || ''
  newName.value = ''
  newPts.value = 100
  newScore.value = 90
  showAddModal.value = true
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
  showAddModal.value = false
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
    <div class="page-header">
      <div>
        <h1>Gradebook</h1>
        <p>{{ course.name }} · {{ course.teacher.name }} · Period {{ course.period }}</p>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button class="btn btn-primary" @click="openAdd">+ Hypothetical Assignment</button>
        <button class="btn btn-secondary" @click="createQuickScenario">Save Scenario</button>
        <button class="btn btn-ghost" @click="store.resetSimulation(selectedId)">Reset Sim</button>
      </div>
    </div>

    <!-- Course selector -->
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.25rem">
      <button
        v-for="c in store.courses"
        :key="c.id"
        class="btn btn-sm"
        :class="c.id === selectedId ? 'btn-primary' : 'btn-secondary'"
        @click="selectCourse(c.id)"
      >
        {{ c.name }}
      </button>
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
    <div class="card table-wrap">
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

    <!-- Add modal -->
    <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
      <div class="modal">
        <h2>Add Hypothetical Assignment</h2>
        <div class="form-group">
          <label>Name</label>
          <input v-model="newName" class="input" placeholder="e.g. Final Exam" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select v-model="newCat" class="select">
            <option v-for="cat in course.categories" :key="cat.id" :value="cat.id">{{ cat.name }} ({{ cat.weight }}%)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Points Possible</label>
          <input v-model.number="newPts" type="number" class="input" min="0" />
        </div>
        <div class="form-group">
          <label>Score (leave empty for ungraded)</label>
          <input v-model.number="newScore" type="number" class="input" min="0" />
        </div>
        <div class="form-group">
          <label>Due Date</label>
          <input v-model="newDue" type="date" class="input" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
          <button class="btn btn-primary" @click="submitAdd">Add & Recalculate</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    <h3>No course selected</h3>
    <p>Choose a course from the dashboard.</p>
  </div>
</template>

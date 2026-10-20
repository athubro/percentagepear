<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { formatGrade } from '../engine/gradeCalculator'

const store = useAppStore()
const router = useRouter()

const courseCards = computed(() =>
  store.courses.map((c) => {
    void store.simVersion
    const grade = store.getCourseGrade(c.id)
    const cmp = store.getGradeComparison(c.id)
    return {
      course: c,
      grade,
      delta: cmp?.delta ?? 0,
      hasSim: !!store.getActiveSimulation(c.id),
    }
  })
)

const upcoming = computed(() => {
  const items: { name: string; course: string; due: string; courseId: string }[] = []
  for (const c of store.courses) {
    for (const a of store.getSimulatedAssignments(c.id)) {
      if (a.status === 'upcoming' || a.score === null) {
        items.push({ name: a.name, course: c.name, due: a.dueDate, courseId: c.id })
      }
    }
  }
  return items.sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6)
})

const missing = computed(() => {
  const items: { name: string; course: string; courseId: string }[] = []
  for (const c of store.courses) {
    for (const a of store.getSimulatedAssignments(c.id)) {
      if (a.status === 'missing') {
        items.push({ name: a.name, course: c.name, courseId: c.id })
      }
    }
  }
  return items
})

function openCourse(id: string) {
  router.push({ name: 'gradebook', params: { courseId: id } })
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>
          Welcome, {{ store.student?.name }}.
          <span v-if="store.isDemo">You are viewing demo data for {{ store.student?.school }}.</span>
        </p>
      </div>
    </div>

    <section style="margin-bottom: 1.75rem">
      <h2 style="font-size:1.1rem;margin-bottom:0.85rem">Courses</h2>
      <div class="grid-cards">
        <div
          v-for="card in courseCards"
          :key="card.course.id"
          class="card course-card"
          :style="{ '--course-color': card.course.color }"
          @click="openCourse(card.course.id)"
        >
          <div class="course-name">{{ card.course.name }}</div>
          <div class="teacher">{{ card.course.teacher.name }} · Period {{ card.course.period }}</div>
          <div class="grade-row">
            <span
              v-if="card.grade"
              class="grade-pill"
              :class="'grade-' + card.grade.letter"
            >
              {{ formatGrade(card.grade.percentage, store.preferences.gradeRounding) }}%
              {{ store.preferences.showLetterGrades ? card.grade.letter : '' }}
            </span>
            <span v-if="card.hasSim && card.delta !== 0" :class="card.delta > 0 ? 'delta-pos' : 'delta-neg'">
              {{ card.delta > 0 ? '+' : '' }}{{ formatGrade(card.delta, 1) }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem" class="dash-panels">
      <section class="card">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">Upcoming Assignments</h2>
        <ul v-if="upcoming.length" style="list-style:none">
          <li
            v-for="(u, i) in upcoming"
            :key="i"
            style="padding:0.45rem 0;border-bottom:1px solid var(--border);cursor:pointer"
            @click="openCourse(u.courseId)"
          >
            <div style="font-weight:500">{{ u.name }}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">{{ u.course }} · Due {{ u.due }}</div>
          </li>
        </ul>
        <div v-else class="empty-state" style="padding:1.5rem">No upcoming assignments.</div>
      </section>

      <section class="card">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">Missing Work</h2>
        <ul v-if="missing.length" style="list-style:none">
          <li
            v-for="(m, i) in missing"
            :key="i"
            style="padding:0.45rem 0;border-bottom:1px solid var(--border);cursor:pointer"
            @click="openCourse(m.courseId)"
          >
            <div style="font-weight:500">{{ m.name }}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">{{ m.course }}</div>
          </li>
        </ul>
        <div v-else class="empty-state" style="padding:1.5rem">No missing assignments. Nice!</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 700px) {
  .dash-panels { grid-template-columns: 1fr !important; }
}
</style>

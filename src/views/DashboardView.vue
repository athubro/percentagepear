<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { formatGrade } from '../engine/gradeCalculator'

const store = useAppStore()
const router = useRouter()
const view = ref<'cards' | 'table'>('cards')

const courseCards = computed(() =>
  store.courses.map((c) => {
    void store.simVersion
    const grade = store.getCourseGrade(c.id)
    const cmp = store.getGradeComparison(c.id)
    return {
      course: c,
      grade,
      semesterAverage: grade ? Math.round(grade.percentage) : null,
      delta: cmp?.delta ?? 0,
      hasSim: !!store.getActiveSimulation(c.id),
    }
  })
)

function openCourse(id: string) {
  router.push({ name: 'gradebook', params: { courseId: id } })
}
</script>

<template>
  <div>
    <div class="page-header compact-header">
      <div>
        <p class="eyebrow">{{ store.student?.school }}</p>
        <h1>Hi, {{ store.student?.name?.split(' ')[0] }}.</h1>
        <p>Your classes at a glance.</p>
      </div>
      <div class="view-toggle" aria-label="Course display">
        <button class="btn btn-sm" :class="view === 'cards' ? 'btn-primary' : 'btn-secondary'" @click="view = 'cards'">Cards</button>
        <button class="btn btn-sm" :class="view === 'table' ? 'btn-primary' : 'btn-secondary'" @click="view = 'table'">Table</button>
      </div>
    </div>

    <section class="classes-section">
      <div v-if="view === 'cards'" class="grid-cards">
        <div
          v-for="card in courseCards"
          :key="card.course.id"
          class="card course-card"
          :style="{ '--course-color': card.course.color }"
          @click="openCourse(card.course.id)"
        >
          <div class="course-name">{{ card.course.name }}</div>
          <div class="teacher">{{ card.course.teacher.name }} · P{{ card.course.period }}</div>
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
          <div v-if="card.semesterAverage != null" class="semester-average">Semester average: {{ card.semesterAverage }}%</div>
        </div>
      </div>
      <div v-else class="card table-wrap course-table">
        <table>
          <thead><tr><th>Class</th><th>Teacher</th><th>Period</th><th>Grade</th><th></th></tr></thead>
          <tbody><tr v-for="card in courseCards" :key="card.course.id" class="course-row" @click="openCourse(card.course.id)">
            <td><span class="course-dot" :style="{ background: card.course.color }" />{{ card.course.name }}</td>
            <td>{{ card.course.teacher.name }}</td><td>{{ card.course.period }}</td>
            <td><span v-if="card.grade" class="table-grade" :class="'grade-' + card.grade.letter">{{ card.grade.letter }} · {{ card.semesterAverage }}%</span></td>
            <td class="open-class">Open →</td>
          </tr></tbody>
        </table>
      </div>
    </section>

  </div>
</template>

<style scoped>
.eyebrow { color:var(--primary) !important; font-size:.75rem !important; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.compact-header { margin-bottom:1.25rem; }.classes-section { margin-bottom:1.5rem; }.view-toggle { display:flex; gap:.35rem; }.course-row { cursor:pointer; }.course-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:.55rem; }.table-grade { font-weight:700; }.open-class { color:var(--primary); font-weight:600; font-size:.85rem; text-align:right; }.semester-average { margin-top:.6rem; color:var(--text-muted); font-size:.78rem; }
</style>

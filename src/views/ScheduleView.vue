<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '../stores/appStore'
const store = useAppStore()
const semester = ref<1 | 2>(1)
const entries = computed(() => store.schedule.filter((entry) => (entry.semester ?? 1) === semester.value))
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Schedule</h1>
        <p v-if="store.isDemo">Demo timetable for PercentagePear Demo High School</p>
      </div>
      <div class="view-toggle" aria-label="Select semester">
        <button class="btn btn-sm" :class="semester === 1 ? 'btn-primary' : 'btn-secondary'" @click="semester = 1">Semester 1</button>
        <button class="btn btn-sm" :class="semester === 2 ? 'btn-primary' : 'btn-secondary'" @click="semester = 2">Semester 2</button>
      </div>
    </div>
    <div v-if="entries.length" class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Course</th>
            <th>Teacher</th>
            <th>Room</th>
            <th>Time</th>
            <th>Days</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in entries" :key="s.id">
            <td>{{ s.period }}</td>
            <td>{{ s.courseName }}</td>
            <td>{{ s.teacherName }}</td>
            <td>{{ s.room }}</td>
            <td>{{ s.startTime }} – {{ s.endTime }}</td>
            <td>{{ s.days.join(' ') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="card schedule-empty"><h2>Semester {{ semester }} schedule</h2><p>This semester’s schedule is not available yet.</p></div>
  </div>
</template>

<style scoped>
.view-toggle { display:flex; gap:.4rem; }.schedule-empty { max-width:500px; }.schedule-empty h2 { font-size:1rem; margin-bottom:.35rem; }.schedule-empty p { color:var(--text-muted); font-size:.9rem; }
</style>

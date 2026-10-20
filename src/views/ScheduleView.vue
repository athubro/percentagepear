<script setup lang="ts">
import { useAppStore } from '../stores/appStore'
const store = useAppStore()
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Schedule</h1>
        <p v-if="store.isDemo">Demo timetable for PercentagePear Demo High School</p>
      </div>
    </div>
    <div class="card table-wrap">
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
          <tr v-for="s in store.schedule" :key="s.id">
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
  </div>
</template>

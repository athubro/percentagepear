<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores/appStore'
const store = useAppStore()

const summary = computed(() => {
  const counts = { present: 0, absent: 0, tardy: 0, excused: 0, unexcused: 0 }
  for (const r of store.attendance) {
    if (r.status in counts) (counts as any)[r.status]++
  }
  return counts
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Attendance</h1>
        <p v-if="store.isDemo">Sample attendance records (demo only)</p>
      </div>
    </div>
    <div class="grid-cards" style="margin-bottom:1.25rem">
      <div class="card"><div style="color:var(--text-muted);font-size:0.85rem">Present</div><div style="font-size:1.5rem;font-weight:700">{{ summary.present }}</div></div>
      <div class="card"><div style="color:var(--text-muted);font-size:0.85rem">Absent</div><div style="font-size:1.5rem;font-weight:700">{{ summary.absent }}</div></div>
      <div class="card"><div style="color:var(--text-muted);font-size:0.85rem">Tardy</div><div style="font-size:1.5rem;font-weight:700">{{ summary.tardy }}</div></div>
      <div class="card"><div style="color:var(--text-muted);font-size:0.85rem">Excused</div><div style="font-size:1.5rem;font-weight:700">{{ summary.excused }}</div></div>
    </div>
    <div class="card table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Status</th><th>Course</th><th>Reason</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in store.attendance" :key="r.id">
            <td>{{ r.date }}</td>
            <td><span class="badge" :class="{ 'badge-missing': r.status === 'absent' || r.status === 'unexcused' }">{{ r.status }}</span></td>
            <td>{{ r.courseName || '—' }}</td>
            <td>{{ r.reason || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

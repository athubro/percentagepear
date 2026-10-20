<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()
const router = useRouter()
const filter = ref('all')

const all = computed(() => {
  const rows: { a: any; courseName: string; courseId: string; color: string }[] = []
  for (const c of store.courses) {
    for (const a of store.getSimulatedAssignments(c.id)) {
      rows.push({ a, courseName: c.name, courseId: c.id, color: c.color })
    }
  }
  let list = rows
  if (filter.value === 'missing') list = list.filter((r) => r.a.status === 'missing')
  if (filter.value === 'upcoming') list = list.filter((r) => r.a.status === 'upcoming' || r.a.score == null)
  if (filter.value === 'hypothetical') list = list.filter((r) => r.a.isHypothetical)
  return list.sort((x, y) => (x.a.dueDate || '').localeCompare(y.a.dueDate || ''))
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>All Assignments</h1>
        <p>Across every course · click a row to open the gradebook</p>
      </div>
      <select v-model="filter" class="select" style="max-width:180px">
        <option value="all">All</option>
        <option value="upcoming">Upcoming</option>
        <option value="missing">Missing</option>
        <option value="hypothetical">Hypothetical</option>
      </select>
    </div>
    <div class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Course</th>
            <th>Due</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in all"
            :key="i"
            style="cursor:pointer"
            @click="router.push({ name: 'gradebook', params: { courseId: row.courseId } })"
          >
            <td>
              {{ row.a.name }}
              <span v-if="row.a.isHypothetical" class="badge badge-hyp">Hyp</span>
            </td>
            <td>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px" :style="{ background: row.color }" />
              {{ row.courseName }}
            </td>
            <td>{{ row.a.dueDate }}</td>
            <td>{{ row.a.score != null ? `${row.a.score}/${row.a.pointsPossible}` : '—' }}</td>
            <td><span class="badge" :class="{ 'badge-missing': row.a.status === 'missing' }">{{ row.a.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

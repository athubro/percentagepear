<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores/appStore'
import { formatGrade } from '../engine/gradeCalculator'

const store = useAppStore()

const rows = computed(() =>
  store.courses.map((c) => {
    const g = store.getCourseGrade(c.id)
    const cmp = store.getGradeComparison(c.id)
    return {
      name: c.name,
      color: c.color,
      pct: g?.percentage ?? 0,
      letter: g?.letter ?? 'N/A',
      delta: cmp?.delta ?? 0,
    }
  })
)

const avg = computed(() => {
  if (!rows.value.length) return 0
  return rows.value.reduce((s, r) => s + r.pct, 0) / rows.value.length
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Analytics</h1>
        <p>Course comparison · average {{ formatGrade(avg, 1) }}%</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:1.25rem">
      <div v-for="r in rows" :key="r.name" style="margin-bottom:0.85rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;font-size:0.9rem">
          <span>{{ r.name }}</span>
          <span>
            <strong>{{ formatGrade(r.pct, 1) }}%</strong> {{ r.letter }}
            <span v-if="r.delta" :class="r.delta > 0 ? 'delta-pos' : 'delta-neg'" style="margin-left:0.35rem">
              {{ r.delta > 0 ? '+' : '' }}{{ formatGrade(r.delta, 1) }}
            </span>
          </span>
        </div>
        <div style="height:10px;background:var(--border);border-radius:5px;overflow:hidden">
          <div
            :style="{
              width: Math.min(100, r.pct) + '%',
              height: '100%',
              background: r.color,
              borderRadius: '5px',
              transition: 'width .3s',
            }"
          />
        </div>
      </div>
    </div>
    <p style="font-size:0.85rem;color:var(--text-muted)">
      Bars reflect current projected grades (including any active simulations). Historical trends require multi-period data from StudentVUE.
    </p>
  </div>
</template>

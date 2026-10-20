<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/appStore'
import { openStudentDocument } from '../api/studentvue'

const store = useAppStore()
const busyId = ref('')
const error = ref('')

async function openDoc(gu?: string, id?: string) {
  if (!gu) return
  busyId.value = id || gu
  error.value = ''
  try {
    await openStudentDocument(gu)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Documents</h1>
        <p v-if="store.isDemo">Sample documents — clearly labeled as demo</p>
        <p v-else>Documents available through the connected integration</p>
      </div>
    </div>
    <div class="grid-cards">
      <div v-for="d in store.documents" :key="d.id" class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <strong>{{ d.title }}</strong>
          <span v-if="d.isDemo" class="badge badge-demo">Demo</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-muted);margin:0.4rem 0">{{ d.description }}</p>
        <div style="font-size:0.8rem;color:var(--text-muted)">{{ d.type }} · {{ d.date }}</div>
        <button
          v-if="d.documentGU && !d.isDemo"
          class="btn btn-secondary btn-sm"
          style="margin-top:0.6rem"
          :disabled="busyId === d.id"
          @click="openDoc(d.documentGU, d.id)"
        >
          {{ busyId === d.id ? 'Opening…' : 'Open PDF' }}
        </button>
      </div>
    </div>
    <p v-if="error" style="color:var(--danger);margin-top:0.75rem">{{ error }}</p>
    <p v-if="!store.documents.length" class="empty-state">No documents available from the current data source.</p>
  </div>
</template>

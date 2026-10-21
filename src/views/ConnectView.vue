<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { MCPS_HOST, DEFAULT_CORS_PROXY } from '../api/studentvue'

const store = useAppStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const host = ref(MCPS_HOST)
const proxyUrl = ref(DEFAULT_CORS_PROXY)
const status = ref<'idle' | 'loading' | 'error' | 'success'>('idle')
const message = ref('')

async function attemptConnect() {
  if (!username.value.trim() || !password.value) {
    status.value = 'error'
    message.value = 'Enter your Student ID and password.'
    return
  }
  status.value = 'loading'
  message.value = 'Connecting with Grademelon-compatible mobile API…'
  try {
    const session = await store.loginStudentVue(
      username.value,
      password.value,
      host.value,
      proxyUrl.value
    )
    status.value = 'success'
    message.value =
      `Signed in as ${session.student.name}. Loaded ${session.courses.length} courses` +
      (session.method ? ` via ${session.method}` : '') +
      (session.debug ? ` (${session.debug})` : '') +
      '.'
    password.value = ''
    setTimeout(() => router.push('/dashboard'), 700)
  } catch (e) {
    status.value = 'error'
    message.value = e instanceof Error ? e.message : String(e)
  }
}

function goGuest() {
  store.enterGuestMode()
  router.push('/dashboard')
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Connect StudentVUE</h1>
        <p>MCPS · tries multiple methods (same SOAP path as Grademelon website)</p>
      </div>
    </div>

    <div class="card" style="max-width:480px">
      <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:1rem;line-height:1.5">
        Use your <strong>6- or 8-digit Student ID</strong> and StudentVUE password
        (not your Google password). After MCPS Synergy 2027, third-party access is restricted;
        if live grades fail, Guest mode still has the full simulator.
      </p>
      <div class="form-group">
        <label>District host</label>
        <input v-model="host" class="input" />
      </div>
      <div class="form-group">
        <label>Student ID</label>
        <input v-model="username" class="input" autocomplete="username" placeholder="12345678" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input v-model="password" type="password" class="input" autocomplete="current-password" @keyup.enter="attemptConnect" />
      </div>
      <div class="form-group">
        <label>CORS proxy</label>
        <input v-model="proxyUrl" class="input" placeholder="https://studentvuelib.up.railway.app/fulfillRest" />
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.35rem;line-height:1.4">
          Requests are tunnelled through this proxy because the StudentVUE API does not send CORS headers.
          Your credentials are sent to it. Ignored on localhost.
        </p>
      </div>
      <button class="btn btn-primary" style="width:100%" :disabled="status==='loading'||store.loading" @click="attemptConnect">
        {{ status === 'loading' || store.loading ? 'Connecting…' : 'Connect & Load Grades' }}
      </button>
      <p v-if="message" style="margin-top:1rem;font-size:0.9rem;line-height:1.5"
         :style="{ color: status==='error' ? 'var(--danger)' : status==='success' ? 'var(--success)' : 'var(--text-muted)' }">
        {{ message }}
      </p>
      <button class="btn btn-secondary" style="width:100%;margin-top:0.75rem" @click="goGuest">
        Continue as Guest instead
      </button>
    </div>

    <div class="card" style="max-width:480px;margin-top:1rem">
      <h2 style="font-size:0.95rem;margin-bottom:0.5rem">How this connects</h2>
      <ul style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;padding-left:1.1rem">
        <li>Uses the same mobile JSON API + <code>edupointkeyversion</code> header as <a href="https://www.grademelon.org/grades" target="_blank" rel="noopener">grademelon.org</a></li>
        <li>Log in with your 6- or 8-digit Student ID and StudentVUE password</li>
        <li>If it still fails, use Guest mode — the grade simulator works offline</li>
      </ul>
    </div>
  </div>
</template>

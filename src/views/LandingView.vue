<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { MCPS_HOST, DEFAULT_CORS_PROXY } from '../api/studentvue'

const router = useRouter()
const store = useAppStore()
const username = ref('')
const password = ref('')
const showStudentForm = ref(false)
const status = ref<'idle' | 'loading' | 'error'>('idle')
const message = ref('')

function continueAsGuest() { store.enterGuestMode(); router.push('/dashboard') }
async function signIn() {
  if (!username.value.trim() || !password.value) { status.value = 'error'; message.value = 'Enter your student ID and password.'; return }
  status.value = 'loading'; message.value = ''
  try {
    await store.loginStudentVue(username.value, password.value, MCPS_HOST, DEFAULT_CORS_PROXY)
    password.value = ''; router.push('/dashboard')
  } catch (error) {
    status.value = 'error'; message.value = error instanceof Error ? error.message : 'We could not sign you in. Please try again.'
  }
}
</script>

<template>
  <main class="landing">
    <header class="landing-header"><div class="brand-lockup"><div class="pear-logo pear-logo-lg" aria-hidden="true" /><span>Percentage Pear</span></div></header>
    <section class="signin-card" aria-labelledby="signin-title">
      <div class="signin-intro"><div class="pear-mark" aria-hidden="true">%</div><h1 id="signin-title">Your grades, clearly.</h1><p>Sign in to see your classes and explore grade projections.</p></div>
      <div v-if="!showStudentForm" class="signin-actions">
        <button class="btn btn-primary signin-choice" @click="showStudentForm = true">Sign in as student</button>
        <button class="btn btn-secondary signin-choice" @click="continueAsGuest">Sign in as guest</button>
      </div>
      <form v-else class="signin-form" @submit.prevent="signIn">
        <button type="button" class="back-link" @click="showStudentForm = false">← Back</button>
        <label class="form-group"><span>Student ID</span><input v-model="username" class="input" autocomplete="username" inputmode="numeric" placeholder="Student ID" autofocus /></label>
        <label class="form-group"><span>Password</span><input v-model="password" class="input" type="password" autocomplete="current-password" placeholder="Password" /></label>
        <button class="btn btn-primary signin-choice" type="submit" :disabled="status === 'loading' || store.loading">{{ status === 'loading' || store.loading ? 'Signing in…' : 'Sign in' }}</button>
        <p v-if="message" class="signin-message">{{ message }}</p>
      </form>
      <p class="signin-note">Guest mode opens a full sample gradebook. No account is required.</p>
    </section>
    <footer class="landing-footer">Percentage Pear · Grade planning made simple</footer>
  </main>
</template>

<style scoped>
.landing { min-height:100vh; display:flex; flex-direction:column; color:#f8fafc; background:radial-gradient(circle at 10% 12%,rgba(174,225,74,.24),transparent 27rem),radial-gradient(circle at 94% 88%,rgba(62,180,112,.28),transparent 30rem),linear-gradient(135deg,#102b26,#173d31 52%,#0e251f); }
.landing-header { width:100%; padding:1rem max(1.25rem, calc((100vw - 1180px) / 2)); background:rgba(9,34,27,.34); border-bottom:1px solid rgba(255,255,255,.12); }.brand-lockup { display:inline-flex; align-items:center; gap:.65rem; font-weight:800; font-size:1.1rem; }.pear-logo-lg { width:34px; height:34px; }
.signin-card { width:min(100% - 2.5rem,420px); margin:auto; padding:2rem; background:rgba(255,255,255,.96); color:#18352b; border:1px solid rgba(255,255,255,.45); border-radius:18px; box-shadow:0 24px 70px rgba(0,0,0,.25); }
.signin-intro { text-align:center; margin-bottom:1.75rem; }.pear-mark { display:grid; place-items:center; width:44px; height:44px; margin:0 auto .85rem; border-radius:14px; color:white; font-weight:800; font-size:1.35rem; background:var(--primary); }.signin-intro h1 { color:#18352b; font-size:1.65rem; margin-bottom:.35rem; }.signin-intro p,.signin-note { color:#5d7169; font-size:.9rem; line-height:1.5; }
.signin-actions,.signin-form { display:grid; gap:.75rem; }.signin-choice { justify-content:center; width:100%; padding:.75rem 1rem; }.signin-actions .btn-secondary { color:#18352b; background:#edf4ef; border-color:#cbdcd0; }.signin-actions .btn-secondary:hover { background:#e0ece3; }.signin-note { margin-top:1.25rem; text-align:center; font-size:.78rem; }.signin-form .form-group { margin:0; color:#345247; font-weight:600; font-size:.85rem; }.signin-form .input { margin-top:.35rem; background:#f6faf7; border-color:#d9e4dc; }.back-link { justify-self:start; background:none; border:0; color:var(--primary); cursor:pointer; font-weight:600; padding:0; }.signin-message { color:var(--danger); font-size:.85rem; line-height:1.4; }.landing-footer { padding:1rem 1.25rem; text-align:center; color:rgba(255,255,255,.66); border-top:1px solid rgba(255,255,255,.12); font-size:.75rem; }
@media (max-width:500px) { .signin-card { padding:1.5rem; } }
</style>

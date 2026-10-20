<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'

const router = useRouter()
const store = useAppStore()

function continueAsGuest() {
  store.enterGuestMode()
  router.push('/dashboard')
}
</script>

<template>
  <div class="landing">
    <div class="landing-inner">
      <div class="landing-brand">
        <div class="pear-logo" style="width:48px;height:48px" />
        <h1>PercentagePear</h1>
      </div>
      <p class="tagline">
        A modern student dashboard and grade simulator.
        Explore realistic sample data instantly, or connect your MCPS StudentVUE account.
      </p>

      <div class="cta-row">
        <button class="btn btn-primary" style="padding:0.75rem 1.5rem;font-size:1.05rem" @click="continueAsGuest">
          Continue as Guest
        </button>
        <router-link to="/connect" class="btn btn-secondary" style="padding:0.75rem 1.5rem;font-size:1.05rem">
          Connect StudentVUE
        </router-link>
      </div>

      <div class="feature-grid">
        <div class="feature">
          <strong>Interactive Gradebook</strong>
          <p>Add hypothetical assignments and watch your projected grade update instantly.</p>
        </div>
        <div class="feature">
          <strong>What-If Scenarios</strong>
          <p>Save, compare, and restore multiple grade experiments per course.</p>
        </div>
        <div class="feature">
          <strong>Attendance</strong>
          <p>Pulls the attendance history StudentVUE exposes for your account.</p>
        </div>
        <div class="feature">
          <strong>Guest Mode</strong>
          <p>No signup required. Full demo experience with fictional school data.</p>
        </div>
      </div>

      <p class="disclaimer">
        PercentagePear is an independent educational tool and is not affiliated with,
        endorsed by, or connected to Edupoint, Synergy, or Montgomery County Public Schools.
        Guest mode uses entirely fictional data from “PercentagePear Demo High School.”
      </p>
    </div>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%);
}
.dark .landing {
  background: linear-gradient(160deg, #052e16 0%, #0f172a 50%, #0c4a6e 100%);
}
.landing-inner {
  max-width: 640px;
  text-align: center;
}
.landing-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
}
.landing-brand h1 {
  font-size: 2rem;
  font-weight: 800;
}
.tagline {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}
.cta-row {
  display: flex;
  gap: 0.85rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  text-align: left;
  margin-bottom: 2rem;
}
.feature {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  box-shadow: var(--shadow);
}
.feature strong { display: block; margin-bottom: 0.35rem; }
.feature p { font-size: 0.875rem; color: var(--text-muted); }
.disclaimer {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;
}
@media (max-width: 560px) {
  .feature-grid { grid-template-columns: 1fr; }
}
</style>

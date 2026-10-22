<script setup lang="ts">
const counterUrl = 'https://hitscounter.dev/api/hit?url=https%3A%2F%2Fathubro.github.io%2Fpercentagepear%2F&label=site+visits&icon=github&color=%23198754&message=&style=flat&tz=UTC'
</script>

<template>
  <a class="visit-counter" href="https://hitscounter.dev" target="_blank" rel="noopener" aria-label="Site visit count">
    <img :src="counterUrl" alt="Site visits" />
  </a>
</template>

<style scoped>
.visit-counter { position:fixed; left:1rem; bottom:1rem; z-index:90; display:block; line-height:0; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,.2); }.visit-counter img { display:block; height:20px; }
@media (max-width:700px) { .visit-counter { left:.75rem; bottom:.75rem; } }
</style>

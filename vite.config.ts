import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Dev proxy so the browser can call MCPS StudentVUE without CORS errors.
 * All /svue-proxy/* requests are forwarded to https://md-mcps-psv.edupoint.com/*
 */
export default defineConfig({
  // GitHub Pages serves the site from /percentagepear/. The deploy workflow
  // passes VITE_BASE=/percentagepear/ so built asset URLs resolve correctly;
  // locally (no env var) the base stays '/' as before.
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
  server: {
    proxy: {
      '/svue-proxy': {
        target: 'https://md-mcps-psv.edupoint.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/svue-proxy/, ''),
      },
    },
  },
})

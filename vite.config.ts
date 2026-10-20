import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Dev proxy so the browser can call MCPS StudentVUE without CORS errors.
 * All /svue-proxy/* requests are forwarded to https://md-mcps-psv.edupoint.com/*
 */
export default defineConfig({
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

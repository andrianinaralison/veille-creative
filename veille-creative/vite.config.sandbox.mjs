// Config temporaire pour captures (sandbox) — supprimable
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  cacheDir: '/tmp/vite-cache',
  plugins: [react()],
})

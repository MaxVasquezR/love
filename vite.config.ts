import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative paths so the build also works inside game portal iframes/subfolders.
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
})

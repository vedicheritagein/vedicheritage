import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // React changes far less often than the page does. Splitting it out means a
    // content edit only invalidates the small app chunk, leaving the framework
    // cached in returning visitors' browsers.
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Matches react and react-dom (plus scheduler, which react-dom pulls in)
          // without catching lucide-react.
          if (/node_modules[/\\](react|react-dom|scheduler)[/\\]/.test(id)) {
            return 'react'
          }
        },
      },
    },
  },
})

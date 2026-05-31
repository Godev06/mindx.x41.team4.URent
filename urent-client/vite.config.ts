import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Dòng quan trọng

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunk
          vendor: (id) => id.includes('node_modules'),
        },
      },
    },
    // Set chunk size warning limit to 600 KB (adjust as needed)
    chunkSizeWarningLimit: 600,
  },
})
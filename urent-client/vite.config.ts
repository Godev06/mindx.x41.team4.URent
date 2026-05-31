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
        // Separate vendor libraries into their own chunk
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
    // Set chunk size warning limit to 600 KB (adjust as needed)
    chunkSizeWarningLimit: 600,
  },
})
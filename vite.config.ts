import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Dòng quan trọng

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  
  ],
})   
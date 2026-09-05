import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      "@/components": resolve(import.meta.dirname, "./src/components"),
      "@/pages": resolve(import.meta.dirname, "./src/pages"),
      "@/hooks": resolve(import.meta.dirname, "./src/hooks"),
      "@/utils": resolve(import.meta.dirname, "./src/utils"),
      "@/api": resolve(import.meta.dirname, "./src/api"),
      "@/types": resolve(import.meta.dirname, "./src/types"),
      "@/stores": resolve(import.meta.dirname, "./src/stores"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
})

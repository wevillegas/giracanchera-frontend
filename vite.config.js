import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En desarrollo la API se llama por /api, igual que en producción (rewrite de Vercel):
  // la cookie de sesión queda en el mismo origen que el frontend
  server: { proxy: { '/api': 'http://localhost:5000' } },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En producción se sirve bajo /beddy/ (GitHub Pages); en local, en la raíz.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/beddy/' : '/',
  plugins: [react()],
  server: { port: 5173, open: true },
}))

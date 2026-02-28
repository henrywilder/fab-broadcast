import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for the FAB Broadcast Tool frontend.
// The /api routes are handled by Vercel serverless functions — not Vite.
// When running locally with `vercel dev`, Vercel proxies /api calls automatically.
export default defineConfig({
  plugins: [react()],
})

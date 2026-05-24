import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // cPanel subfolder deploys should use an absolute base like /taskflow/
    // Fallback to root for local/dev safety.
    base: env.VITE_BASE_PATH || '/',
    server: {
      host: true,
      port: 5173,
    },
  }
})

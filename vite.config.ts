import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/engagements/COM-CON-Dec312024/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: parseInt(process.env.PORT ?? '5173'),
  },
  optimizeDeps: {
    include: ['xlsx']
  }
})

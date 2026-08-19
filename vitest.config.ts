import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./resources/client/test_setup.ts'],
    include: ['resources/client/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'build'],
  },
})

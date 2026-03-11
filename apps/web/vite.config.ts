import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@what2eat/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@what2eat/constants': path.resolve(__dirname, '../../packages/constants/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    fs: {
      strict: false,
    },
  },
  publicDir: 'public',
})


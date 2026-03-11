import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Serve .wasm files with correct MIME type before SPA fallback
    {
      name: 'wasm-content-type',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith('.wasm')) {
            const wasmPath = path.join(__dirname, 'public', path.basename(req.url))
            if (fs.existsSync(wasmPath)) {
              res.setHeader('Content-Type', 'application/wasm')
              fs.createReadStream(wasmPath).pipe(res)
              return
            }
          }
          next()
        })
      },
    },
  ],
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

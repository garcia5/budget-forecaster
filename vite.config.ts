import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataFilePath = path.resolve(__dirname, 'budget-data.json')

function budgetDiskStoragePlugin(): Plugin {
  const handleApi = (req: any, res: any, next: any) => {
    const url = req.url?.split('?')[0]
    if (url === '/api/budget-config') {
      if (req.method === 'GET') {
        if (fs.existsSync(dataFilePath)) {
          try {
            const content = fs.readFileSync(dataFilePath, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(content)
            return
          } catch (err: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to read disk config', details: err.message }))
            return
          }
        } else {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'No disk config found' }))
          return
        }
      } else if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: any) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            fs.writeFileSync(dataFilePath, JSON.stringify(parsed, null, 2), 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }))
          } catch (err: any) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid JSON', details: err.message }))
          }
        })
        return
      }
    }
    next()
  }

  return {
    name: 'budget-disk-storage',
    configureServer(server) {
      server.middlewares.use(handleApi)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    budgetDiskStoragePlugin(),
  ],
  server: {
    watch: {
      ignored: ['**/budget-data.json', '**/budget-data*.json'],
    },
  },
})

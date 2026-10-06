import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

let latestWebhookData = null

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'sepay-webhook-receiver',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/payments/sepay/webhook')) {
            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', () => {
                try {
                  const data = JSON.parse(body || '{}')
                  console.log('🔔 [SePay Webhook Received]:', data)
                  latestWebhookData = data
                } catch (e) {
                  console.error('Webhook JSON parse error:', e)
                }
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: true, message: 'SePay Webhook received successfully' }))
              })
              return
            }
            if (req.method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ status: 'ready', latest: latestWebhookData }))
              return
            }
          }
          next()
        })
      }
    }
  ],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/sepay-api': {
        target: 'https://my.sepay.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sepay-api/, '')
      },
      '/momo-api': {
        target: 'https://test-payment.momo.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/momo-api/, '')
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        bypass: (req) => {
          if (req.url && req.url.startsWith('/api/payments/sepay')) {
            return req.url
          }
        }
      }
    }
  }
})

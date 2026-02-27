import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './src/config/swagger.js'
import userRoutes from './src/routes/user.routes.js'
import authRoutes from './src/routes/auth.routes.js'
import productRoutes from './src/routes/product.routes.js'
import categoryRoutes from './src/routes/category.routes.js'
import orderRoutes from './src/routes/order.routes.js'
import webhookRoutes from './src/routes/webhook.routes.js'
import feedbackRoutes from './src/routes/feedback.routes.js'
import debugRoutes from './src/routes/debug.routes.js'
import favoriteRoutes from './src/routes/favorite.routes.js'
import enderecoRoutes from './src/routes/endereco.routes.js'
import variacaoRoutes from './src/routes/variacao.routes.js'
import shippingRoutes from './src/routes/shipping.routes.js'
import * as orderService from './src/service/order.service.js'
import { initIo } from './src/utils/io.js'
import http from 'http'
import { melhorenvioRoutes } from './src/routes/melhorenvio.routes.js'
import cron from 'node-cron'

const app = express()

// Allow configuring max body size via env (in MB). Default to 50MB which
// covers multipart/base64 product creations with multiple images.
const BODY_LIMIT_MB = process.env.BODY_LIMIT_MB ? Number(process.env.BODY_LIMIT_MB) : 100

// CORS configuration
// Allow configuring a comma-separated list of allowed origins via CORS_ORIGINS
// Example for local dev: CORS_ORIGINS="http://127.0.0.1:5500,http://localhost:5500"
const rawOrigins = process.env.CORS_ORIGINS || ''
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean)
// sensible defaults when none provided (includes common Live Server origin)
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000')
}

// CORS: permissive when developing locally, stricter in production
// Support wildcard entries like *.vercel.app in allowed origins
const isOriginAllowed = (origin) => {
  if (!origin) return true
  try {
    const url = new URL(origin)
    const host = url.host // hostname with port if present
    // exact match or global wildcard
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true
    // check wildcard entries like *.vercel.app or vercel.app
    for (const entry of allowedOrigins) {
      if (!entry) continue
      if (entry.includes('*')) {
        // support patterns like *.vercel.app (match any subdomain)
        const pattern = entry.replace('*', '')
        if (host === pattern || host.endsWith(pattern)) return true
      } else {
        // entries without scheme may be host-only (e.g., example.com)
        try {
          const entryUrl = new URL(entry)
          if (entry === origin || entryUrl.host === host) return true
        } catch (e) {
          // not a full url, compare host only
          if (host === entry || host.endsWith(entry)) return true
        }
      }
    }
    return false
  } catch (e) {
    // if origin is not a valid URL, reject
    return false
  }
}

if (process.env.NODE_ENV === 'production') {
  console.log('CORS allowedOrigins:', allowedOrigins)
  app.use(cors({
    origin: (origin, callback) => {
      // allow non-browser requests like curl/postman (no origin)
      if (!origin) return callback(null, true)
      // useful debug log to inspect actual origin sent by browser
      console.log('CORS origin request:', origin)
      if (isOriginAllowed(origin)) return callback(null, true)
      console.warn('Blocked CORS origin:', origin, 'allowed:', allowedOrigins)
      return callback(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
  }))
} else {
  // development: allow all origins to avoid CORS friction when testing from local files/servers
  app.use(cors({ origin: true, credentials: true }))
}
// Allow larger request bodies for bulk operations (products, uploads base64)
app.use(express.json({ limit: `${BODY_LIMIT_MB}mb` }))
app.use(express.urlencoded({ extended: true, limit: `${BODY_LIMIT_MB}mb` }))
app.use(cookieParser())

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    tryItOutEnabled: true,
  },
}))

app.use('/webhooks/melhorenvio', melhorenvioRoutes)

// Rotas de autenticação
app.use('/api/auth', authRoutes)

// Rotas de usuários
app.use('/api/users', userRoutes)

// Rotas de produtos
app.use('/api/products', productRoutes)

// Rotas de categorias
app.use('/api/categories', categoryRoutes)

// Rotas de categorias
app.use('/api/favorites', favoriteRoutes)

// Rotas de pedido/carrinho
app.use('/api/orders', orderRoutes)

// Rotas de avaliações
app.use('/api/feedback', feedbackRoutes)

// Rotas de endereços
app.use('/api/enderecos', enderecoRoutes)

// Rotas de variações (estoque)
app.use('/api/variacoes', variacaoRoutes)

// Rotas de frete / Melhor Envio
app.use('/api/shipping', shippingRoutes)

// Webhooks
app.use('/webhooks', webhookRoutes)

// Debug / util
app.use('/debug', debugRoutes)

// Global error handler: catch payload-too-large from body-parser/express or Multer
app.use((err, req, res, next) => {
  try {
    // Multer file size error: err.code === 'LIMIT_FILE_SIZE'
    if (err && (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_PART_COUNT' || err.code === 'LIMIT_FILE_COUNT')) {
      console.warn('Upload rejected - file too large or too many files', err.code)
      return res.status(413).json({ error: 'Arquivo muito grande. Aumente UPLOAD_MAX_FILE_MB ou envie um arquivo menor.' })
    }

    // body-parser / express PayloadTooLargeError
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      console.warn('Request rejected - payload too large')
      return res.status(413).json({ error: 'Payload muito grande. Aumente BODY_LIMIT_MB ou envie um payload menor.' })
    }

    // If it's not a payload size error, forward to default error handler
    return next(err)
  } catch (e) {
    return next(err)
  }
})


const PORT = process.env.PORT || 3000
const server = http.createServer(app)

// Initialize Socket.IO
try {
  initIo(server)
} catch (e) {
  console.warn('Socket.IO init failed:', e?.message || e)
}

server.listen(PORT, () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`)

  cron.schedule('0 * * * *', async () => {
    await orderService.syncTracking();
  });
})

// Scheduled cleanup: remove PENDENTE payments older than 24 hours
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60 // every hour
setInterval(async () => {
  try {
    const res = await orderService.deletePendingOrdersOlderThan(24)
    if (res && (res.count || res)) {
      const count = res.count || res
      console.log(`Cleanup: removed ${count} pending pedidos older than 24h`)
    }
  } catch (e) {
    console.error('Cleanup job error:', e)
  }
}, CLEANUP_INTERVAL_MS)

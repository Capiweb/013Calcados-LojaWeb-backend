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
const app = express()

// CORS configuration
// Allow configuring a comma-separated list of allowed origins via CORS_ORIGINS
// Example for local dev: CORS_ORIGINS="http://127.0.0.1:5500,http://localhost:5500"
const rawOrigins = process.env.CORS_ORIGINS || ''
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean)
// sensible defaults when none provided (includes common Live Server origin)
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000')
}

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return callback(null, true)
    console.warn('Blocked CORS origin:', origin)
    return callback(new Error('Not allowed by CORS'), false)
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    tryItOutEnabled: true,
  },
}))

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


const PORT = process.env.PORT || 3000
const server = http.createServer(app)

// Initialize Socket.IO
try {
  initIo(server)
} catch (e) {
  console.warn('Socket.IO init failed:', e?.message || e)
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`)
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

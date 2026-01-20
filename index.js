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
import * as orderService from './src/service/order.service.js'
const app = express()

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN_PROD
    : '*',
  credentials: true
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

// Webhooks
app.use('/webhooks', webhookRoutes)

// Debug / util
app.use('/debug', debugRoutes)


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`)
})

// Scheduled cleanup: remove PENDENTE payments older than 24 hours
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60 // every hour
setInterval(async () => {
  try {
    const res = await orderService.deletePendingPaymentsOlderThan(24)
    if (res && res.count) console.log(`Cleanup: removed ${res.count} pending pagamentos older than 24h`)
  } catch (e) {
    console.error('Cleanup job error:', e)
  }
}, CLEANUP_INTERVAL_MS)

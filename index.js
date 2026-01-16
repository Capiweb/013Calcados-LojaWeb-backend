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

// Rotas de pedido/carrinho
app.use('/api/orders', orderRoutes)

// Rotas de avaliações
app.use('/api/feedback', feedbackRoutes)

// Webhooks
app.use('/webhooks', webhookRoutes)

// Debug / util
app.use('/debug', debugRoutes)


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`)
})

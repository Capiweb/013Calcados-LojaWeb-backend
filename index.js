import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import userRoutes from './src/routes/user.routes.js'

dotenv.config()
const app = express()

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN_PROD
    : '*',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/users', userRoutes)


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`)
})

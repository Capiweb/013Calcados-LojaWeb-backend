import express from 'express'
import { setVariacaoEstoque } from '../controllers/admin.controller.js'
import { ensureAuth, ensureAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Protected admin route: set estoque for a product variation
router.put('/produto-variacao/:id/estoque', ensureAuth, ensureAdmin, setVariacaoEstoque)

export default router

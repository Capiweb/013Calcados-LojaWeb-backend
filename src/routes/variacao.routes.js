import express from 'express'
import variacaoController from '../controllers/variacao.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/variacoes/:id
router.get('/:id', variacaoController.getVariacao)

// PUT /api/variacoes/:id/estoque - admin only
router.put('/:id/estoque', authMiddleware, variacaoController.updateEstoque)

export default router

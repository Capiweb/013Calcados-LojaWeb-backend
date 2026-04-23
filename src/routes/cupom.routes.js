import express from 'express'
import * as cupomController from '../controllers/cupom.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/cupons/meus:
 *   get:
 *     summary: Listar cupons do usuário autenticado
 *     tags:
 *       - Cupons
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cupons do usuário
 */
router.get('/meus', authMiddleware, cupomController.getMeusCupons)

/**
 * @swagger
 * /api/cupons/validar:
 *   post:
 *     summary: Validar um cupom de desconto
 *     tags:
 *       - Cupons
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *             properties:
 *               codigo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cupom válido
 *       400:
 *         description: Cupom inválido ou já utilizado
 */
router.post('/validar', authMiddleware, cupomController.validarCupom)

export default router

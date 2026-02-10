import express from 'express'
import * as shippingController from '../controllers/shipping.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/shipping/calculate:
 *   post:
 *     summary: Calcular frete via Melhor Envio
 *     tags:
 *       - Frete
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destination_postal_code:
 *                 type: string
 *             example:
 *               destination_postal_code: '02000-000'

 *     responses:
 *       200:
 *         description: Resultado do cálculo de frete
 */
router.post('/calculate', authMiddleware, shippingController.calculate)
// only calculate endpoint remains; OAuth routes removed — service uses MELHOR_ENVIO_TOKEN from .env

export default router

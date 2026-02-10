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
 *               origin_postal_code:
 *                 type: string
 *               destination_postal_code:
 *                 type: string
 *               quantity:
 *                 type: number
 *             example:
 *               destination_postal_code: '02000-000'
 *               items:
 *                 - quantity: 1
 *                   insurance_value: 100
 *                 - quantity: 2
 *                   insurance_value: 200

 *     responses:
 *       200:
 *         description: Resultado do cálculo de frete
 */
router.post('/calculate', authMiddleware, shippingController.calculate)
// only calculate endpoint remains; OAuth routes removed — service uses MELHOR_ENVIO_TOKEN from .env

export default router

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
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *             example:
 *               origin_postal_code: '01000-000'
 *               destination_postal_code: '02000-000'
 *               items:
 *                 - weight: 1000
 *                   length: 20
 *                   height: 10
 *                   width: 15
 *                   quantity: 1
 *     responses:
 *       200:
 *         description: Resultado do cálculo de frete
 */
router.post('/calculate', authMiddleware, shippingController.calculate)
// only calculate endpoint remains; OAuth routes removed — service uses MELHOR_ENVIO_TOKEN from .env

export default router

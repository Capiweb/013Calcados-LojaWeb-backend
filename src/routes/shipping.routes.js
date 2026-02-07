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

/**
 * Initiate OAuth authorization with Melhor Envio (redirect to provider)
 * GET /api/shipping/authorize
 */
router.get('/authorize', authMiddleware, shippingController.authorize)

/**
 * OAuth callback endpoint (configured as redirect_uri in Melhor Envio app settings)
 * GET /api/shipping/callback
 */
// callback must be reachable by provider (no auth required)
router.get('/callback', shippingController.callback)

export default router

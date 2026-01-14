import express from 'express'
import { mpNotification } from '../controllers/webhook.controller.js'

const router = express.Router()

/**
 * @swagger
 * /webhooks/mercadopago:
 *   post:
 *     summary: Recebe notificações do Mercado Pago (webhook)
 *     tags:
 *       - Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notificação processada
 */
router.post('/mercadopago', mpNotification)

export default router

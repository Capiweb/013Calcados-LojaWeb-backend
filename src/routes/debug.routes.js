import express from 'express'
import { paymentsByOrder } from '../controllers/debug.controller.js'

const router = express.Router()

/**
 * GET /debug/mp/payments-by-order/:orderId
 * Consulta o Mercado Pago por pagamentos associados a external_reference = orderId
 */
router.get('/mp/payments-by-order/:orderId', paymentsByOrder)

export default router

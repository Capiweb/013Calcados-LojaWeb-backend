import express from 'express'
import * as orderController from '../controllers/order.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import { CheckoutSchema } from '../validators/order.validator.js'

const router = express.Router()

/**
 * @swagger
 * /api/orders/cart:
 *   get:
 *     summary: Obter carrinho do usuário autenticado
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrinho com itens
 *
 *   post:
 *     summary: Adicionar item ao carrinho
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               produtoId:
 *                 type: string
 *               variacaoId:
 *                 type: string
 *               quantidade:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item adicionado/atualizado no carrinho
 *
 * /api/orders/checkout:
 *   post:
 *     summary: Criar pedido e preference do Mercado Pago
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutRequest'
 *     responses:
 *       200:
 *         description: Retorna link de checkout do Mercado Pago
 */
// Gerenciar carrinho (autenticado)
router.get('/cart', authMiddleware, orderController.getCart)
router.post('/cart/items', authMiddleware, orderController.addItem)
router.delete('/cart/items/:id', authMiddleware, orderController.removeItem)

// Checkout -> cria pedido e preference MP
router.post('/checkout', authMiddleware, validate(CheckoutSchema), orderController.checkout)

export default router

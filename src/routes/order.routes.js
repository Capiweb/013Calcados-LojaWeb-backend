import express from 'express'
import * as orderController from '../controllers/order.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { adminMiddleware } from '../middleware/adminMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import { CheckoutSchema } from '../validators/order.validator.js'

const router = express.Router()

/**
 * @swagger
 * /api/orders/cart:
 *   get:
 *     summary: Get user cart
 *     tags:
 *       - Carrinho
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
router.get('/cart', authMiddleware, orderController.getCart)

/**
 * @swagger
 * /api/orders/cart/items:
 *   post:
 *     summary: Add or update cart item
 *     tags:
 *       - Carrinho
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               produtoVariacaoId:
 *                 type: string
 *               quantidade:
 *                 type: number
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/cart/items', authMiddleware, orderController.addItem)

/**
 * @swagger
 * /api/orders/cart/items/{id}:
 *   delete:
 *     summary: Remove cart item
 *     tags:
 *       - Carrinho
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No Content
 */
router.delete('/cart/items/:id', authMiddleware, orderController.removeItem)

/**
 * @swagger
 * /api/orders/checkout:
 *   post:
 *     summary: Create order and generate payment link
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
 *               endereco:
 *                 type: object
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/checkout', authMiddleware, validate(CheckoutSchema), orderController.checkout)

/**
 * @swagger
 * /api/orders/admin:
 *   get:
 *     summary: List all orders (admin)
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/admin', authMiddleware, adminMiddleware, orderController.getAllOrders)

export default router

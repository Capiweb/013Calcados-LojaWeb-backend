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
 *     summary: Obter carrinho do usuário
 *     description: Retorna o carrinho completo do usuário autenticado com todos os itens, quantidades e informações do produto
 *     tags:
 *       - Carrinho
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Carrinho obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Carrinho'
 *       401:
 *         description: Não autenticado ou token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro ao obter carrinho
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Adicionar ou atualizar item no carrinho
 *     description: Adiciona um novo item ao carrinho ou atualiza a quantidade se já existe
 *     tags:
 *       - Carrinho
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *     responses:
 *       201:
 *         description: Item adicionado ou atualizado no carrinho com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarrinhoItem'
 *       400:
 *         description: Dados inválidos ou produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro ao adicionar item ao carrinho
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/orders/cart/items/{id}:
 *   delete:
 *     summary: Remover item do carrinho
 *     description: Remove um item específico do carrinho do usuário
 *     tags:
 *       - Carrinho
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do item do carrinho a remover
 *     responses:
 *       204:
 *         description: Item removido com sucesso
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Item não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro ao remover item do carrinho
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/orders/checkout:
 *   post:
 *     summary: Finalizar compra e gerar payment link
 *     description: Cria um pedido a partir do carrinho e gera um link de pagamento no Mercado Pago
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutRequest'
 *     responses:
 *       200:
 *         description: Pedido criado e link de pagamento gerado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutResponse'
 *       400:
 *         description: Carrinho vazio ou dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro ao processar checkout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Gerenciar carrinho (autenticado)
router.get('/cart', authMiddleware, orderController.getCart)
router.post('/cart/items', authMiddleware, orderController.addItem)
router.delete('/cart/items/:id', authMiddleware, orderController.removeItem)

// Checkout -> cria pedido e preference MP
router.post('/checkout', authMiddleware, validate(CheckoutSchema), orderController.checkout)

export default router

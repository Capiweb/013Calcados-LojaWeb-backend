import express from 'express'
import * as productController from '../controllers/product.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { adminMiddleware } from '../middleware/adminMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import { ProductCreateSchema, ProductBulkSchema } from '../validators/product.validator.js'

const router = express.Router()

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Criar um novo produto (admin)
 *     tags:
 *       - Produtos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreate'
 *     responses:
 *       201:
 *         description: Produto criado
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   get:
 *     summary: Listar produtos com filtros e paginação
 *     tags:
 *       - Produtos
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Texto para busca no nome/descrição
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria (slug)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página (padrão 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Itens por página (padrão 10)
 *     responses:
 *       200:
 *         description: Lista paginada de produtos
 *
 */
router.post('/', authMiddleware, adminMiddleware, validate(ProductCreateSchema), productController.create)
router.post('/bulk', authMiddleware, adminMiddleware, validate(ProductBulkSchema), productController.createBulk)
router.get('/', productController.getAll)
router.get('/:id', productController.getById)
router.put('/:id', authMiddleware, adminMiddleware, productController.update)
router.delete('/:id', authMiddleware, adminMiddleware, productController.remove)

export default router

import express from 'express'
import * as productController from '../controllers/product.controller.js'
import * as variacaoController from '../controllers/variacao.controller.js'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *
 */
import { uploadSingle, uploadArray } from '../middleware/uploadMiddleware.js'

// Accept either application/json with imagemUrl or multipart/form-data with file field 'image'
router.post('/', authMiddleware, adminMiddleware, uploadArray('image', 6), productController.create)
router.post('/bulk', authMiddleware, adminMiddleware, validate(ProductBulkSchema), productController.createBulk)
router.get('/', productController.getAll)
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obter produto por id (com variacoes e cores)
 *     tags:
 *       - Produtos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductDetailResponse'
 */

/**
 * @swagger
 * /api/products/variacoes/todas:
 *   get:
 *     summary: Listar todas as variações de produtos
 *     description: Retorna todas as variações disponíveis com informações do produto
 *     tags:
 *       - Produtos
 *     responses:
 *       200:
 *         description: Lista de variações
 *       404:
 *         description: Nenhuma variação encontrada
 */

/**
 * @swagger
 * /api/products/variacoes/{id}:
 *   get:
 *     summary: Obter variação específica
 *     tags:
 *       - Produtos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */

// Move variacoes endpoints above the dynamic :id route to avoid accidental capture
router.get('/variacoes/todas', variacaoController.getAllVariacoes)
router.get('/variacoes/:id', variacaoController.getVariacao)

router.get('/:id', productController.getById)
router.put('/:id', authMiddleware, adminMiddleware, uploadArray('image', 6), productController.update)
router.delete('/:id', authMiddleware, adminMiddleware, productController.remove)

// Admin route to decrement variation stock by 1
router.post('/admin/:produtoId/variacoes/:variacaoId/decrement-stock', authMiddleware, adminMiddleware, productController.decrementVariationStock)

export default router

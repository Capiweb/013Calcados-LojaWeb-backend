import express from 'express'
import * as categoryController from '../controllers/category.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { adminMiddleware } from '../middleware/adminMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import { CategoryCreateSchema } from '../validators/category.validator.js'

const router = express.Router()

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Criar uma categoria (admin)
 *     tags:
 *       - Categorias
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryCreate'
 *     responses:
 *       201:
 *         description: Categoria criada
 *   get:
 *     summary: Listar categorias
 *     tags:
 *       - Categorias
 *     responses:
 *       200:
 *         description: Lista de categorias
 */
router.post('/', authMiddleware, adminMiddleware, validate(CategoryCreateSchema), categoryController.create)
router.get('/', categoryController.list)
router.get('/:id', categoryController.getById)
router.put('/:id', authMiddleware, adminMiddleware, categoryController.update)
router.delete('/:id', authMiddleware, adminMiddleware, categoryController.remove)

export default router

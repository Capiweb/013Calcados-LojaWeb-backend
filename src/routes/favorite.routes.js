import express from 'express'
import * as favoriteController from '../controllers/favorite.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
//import { validate } from '../middleware/validateMiddleware.js'

const router = express.Router()

/*Todas as rotas de favoritos exigem autenticação JWT
O middleware garante que req.user esteja preenchido com o ID do usuário.
 */

// POST /api/favorites - Favoritar um produto
/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Adiciona um produto aos favoritos do usuário autenticado
 *     tags:
 *       - Favoritos
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
 *     responses:
 *       201:
 *         description: Favorito criado
 */
router.post(
  '/', 
  authMiddleware, 
  favoriteController.createFavorite
);

// DELETE /api/favorites/:produtoId - Desfavoritar um produto
/**
 * @swagger
 * /api/favorites/{produtoId}:
 *   delete:
 *     summary: Remove um produto dos favoritos do usuário
 *     tags:
 *       - Favoritos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: produtoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorito removido
 */
router.delete(
  '/:produtoId', 
  authMiddleware, 
  favoriteController.deleteFavorite
)
// GET /api/favorites - Listar favoritos do usuário autenticado
/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Lista os produtos favoritos do usuário autenticado
 *     tags:
 *       - Favoritos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de favoritos
 */
router.get(
  '/', 
  authMiddleware, 
  favoriteController.listFavorite
);

export default router;


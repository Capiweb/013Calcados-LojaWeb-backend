import express from 'express'
import * as favoriteController from '../controllers/favorite.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
//import { validate } from '../middleware/validateMiddleware.js'

const router = express.Router()

/*Todas as rotas de favoritos exigem autenticação JWT
O middleware garante que req.user esteja preenchido com o ID do usuário.
 */

// POST /api/favorites - Favoritar um produto
router.post(
  '/', 
  authMiddleware, 
  favoriteController.createFavorite
);

// DELETE /api/favorites/:produtoId - Desfavoritar um produto
router.delete(
  '/:produtoId', 
  authMiddleware, 
  favoriteController.deleteFavorite
)
// GET /api/favorites - Listar favoritos do usuário autenticado
router.get(
  '/', 
  authMiddleware, 
  favoriteController.listFavorite
);

export default router;


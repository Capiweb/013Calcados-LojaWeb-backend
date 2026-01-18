import * as favoriteService from '../service/favorite.service.js'

/**
 * Adiciona um produto aos favoritos
 */
export const createFavorite = async (req, res, next) => {
  try {
    const { produtoId } = req.body; // O ID vem do corpo da requisição
    const usuarioId = req.user.id; // Extraído do token JWT pelo middleware de auth [3, 4]

    const favorito = await favoriteService.createFavorite({ usuarioId, produtoId });

    return res.status(201).json({
      message: 'Produto adicionado aos favoritos com sucesso',
      favorito
    });
  } catch (error) {
    // O erro é passado para o middleware de tratamento de erros global do projeto
    next(error);
  }
};

/**
 * Remove um produto dos favoritos
 */
export const deleteFavorite = async (req, res, next) => {
  try {
    const { produtoId } = req.params; // Geralmente passado via URL: /api/products/favorite/:produtoId
    const usuarioId = req.user.id;

    await favoriteService.deleteFavorite(usuarioId, produtoId);

    return res.status(200).json({ message: 'Produto removido dos favoritos' });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista todos os favoritos do usuário autenticado
 */
export const listFavorite = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;
    const favoritos = await favoriteService.listFavorite(usuarioId);

    return res.status(200).json(favoritos);
  } catch (error) {
    next(error);
  }
};
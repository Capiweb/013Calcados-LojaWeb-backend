import express from 'express'
import * as feedbackController from '../controllers/feedback.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import { CreateFeedbackSchema } from '../validators/feedback.validator.js'

const router = express.Router()

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Criar uma avaliação de produto ⭐
 *     description: Permite que usuários autenticados que compraram o produto avaliem-o com estrelas (0.5 a 5.5). Cada usuário pode avaliar um produto apenas uma vez.
 *     tags:
 *       - Avaliações
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - produtoId
 *               - estrelas
 *             properties:
 *               produtoId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do produto a avaliar
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               estrelas:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 5.5
 *                 description: Avaliação em estrelas (incrementos de 0.5 - 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5)
 *                 example: 4.5
 *               comentario:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Comentário opcional sobre o produto
 *                 example: "Produto excelente! Recomendo muito."
 *     responses:
 *       201:
 *         description: Avaliação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Avaliação criada com sucesso"
 *                 feedback:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     usuarioId:
 *                       type: string
 *                       format: uuid
 *                     produtoId:
 *                       type: string
 *                       format: uuid
 *                     estrelas:
 *                       type: number
 *                       example: 4.5
 *                     comentario:
 *                       type: string
 *                     criadoEm:
 *                       type: string
 *                       format: date-time
 *                     atualizadoEm:
 *                       type: string
 *                       format: date-time
 *                     usuario:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         nome:
 *                           type: string
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Avaliação deve ser em incrementos de 0.5"
 *       401:
 *         description: Usuário não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token não fornecido ou inválido"
 *       403:
 *         description: Usuário não comprou o produto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Você precisa ter comprado o produto para avaliá-lo"
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Produto não encontrado"
 *       409:
 *         description: Usuário já avaliou este produto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Você já avaliou este produto"
 */
router.post(
  '/',
  authMiddleware,
  validate(CreateFeedbackSchema),
  feedbackController.createFeedback
)

/**
 * @swagger
 * /api/feedback/product/{produtoId}:
 *   get:
 *     summary: Listar avaliações de um produto 📋
 *     description: Retorna lista paginada de todas as avaliações de um produto específico, ordenadas por mais recentes primeiro
 *     tags:
 *       - Avaliações
 *     parameters:
 *       - in: path
 *         name: produtoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Quantidade de itens por página
 *     responses:
 *       200:
 *         description: Lista de avaliações obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedbacks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       usuarioId:
 *                         type: string
 *                         format: uuid
 *                       produtoId:
 *                         type: string
 *                         format: uuid
 *                       estrelas:
 *                         type: number
 *                         example: 4.5
 *                       comentario:
 *                         type: string
 *                       criadoEm:
 *                         type: string
 *                         format: date-time
 *                       atualizadoEm:
 *                         type: string
 *                         format: date-time
 *                       usuario:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nome:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Produto não encontrado"
 */
router.get('/product/:produtoId', feedbackController.getProductFeedbacks)

/**
 * @swagger
 * /api/feedback/product/{produtoId}/stats:
 *   get:
 *     summary: Obter estatísticas de avaliação 📊
 *     description: Retorna a média de avaliações, quantidade total de feedbacks e distribuição de estrelas do produto
 *     tags:
 *       - Avaliações
 *     parameters:
 *       - in: path
 *         name: produtoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   type: number
 *                   description: Média das avaliações
 *                   example: 4.35
 *                 total:
 *                   type: integer
 *                   description: Total de avaliações
 *                   example: 20
 *                 distribution:
 *                   type: object
 *                   description: Distribuição de avaliações por número de estrelas
 *                   properties:
 *                     '0.5':
 *                       type: integer
 *                       example: 0
 *                     '1.0':
 *                       type: integer
 *                       example: 0
 *                     '1.5':
 *                       type: integer
 *                       example: 0
 *                     '2.0':
 *                       type: integer
 *                       example: 0
 *                     '2.5':
 *                       type: integer
 *                       example: 1
 *                     '3.0':
 *                       type: integer
 *                       example: 2
 *                     '3.5':
 *                       type: integer
 *                       example: 3
 *                     '4.0':
 *                       type: integer
 *                       example: 5
 *                     '4.5':
 *                       type: integer
 *                       example: 6
 *                     '5.0':
 *                       type: integer
 *                       example: 3
 *                     '5.5':
 *                       type: integer
 *                       example: 0
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Produto não encontrado"
 */
router.get('/product/:produtoId/stats', feedbackController.getProductRatingStats)

export default router

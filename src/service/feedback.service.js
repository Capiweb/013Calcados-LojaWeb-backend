import * as feedbackRepo from '../repositories/feedback.repository.js'
import * as productRepo from '../repositories/product.repository.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Verifica se um usuário já comprou um produto específico
 * @param {string} usuarioId - ID do usuário
 * @param {string} produtoId - ID do produto
 * @returns {Promise<boolean>} - true se o usuário comprou, false caso contrário
 */
export const userHasPurchasedProduct = async (usuarioId, produtoId) => {
  const purchase = await prisma.pedidoItem.findFirst({
    where: {
      pedido: {
        usuarioId,
        status: {
          in: ['PAGO', 'ENVIADO', 'ENTREGUE'], // Apenas pedidos confirmados
        },
      },
      produtoVariacao: {
        produtoId,
      },
    },
  })

  return !!purchase
}

/**
 * Cria um novo feedback/avaliação de produto
 * @param {string} usuarioId - ID do usuário
 * @param {Object} payload - Dados do feedback
 * @returns {Promise<Object>} - Feedback criado
 * @throws {Error} - Se houver erro na validação ou criação
 */
export const createFeedback = async (usuarioId, payload) => {
  const { produtoId, estrelas, comentario } = payload

  // 1. Verificar se o produto existe
  const produto = await productRepo.findProductById(produtoId)
  if (!produto) {
    const error = new Error('Produto não encontrado')
    error.statusCode = 404
    throw error
  }

  // 2. Verificar se o usuário já avaliou este produto
  const existingFeedback = await feedbackRepo.findFeedbackByUserAndProduct(
    usuarioId,
    produtoId
  )
  if (existingFeedback) {
    const error = new Error('Você já avaliou este produto')
    error.statusCode = 409
    throw error
  }

  // 3. Verificar se o usuário comprou o produto
  const hasPurchased = await userHasPurchasedProduct(usuarioId, produtoId)
  if (!hasPurchased) {
    const error = new Error('Você precisa ter comprado o produto para avaliá-lo')
    error.statusCode = 403
    throw error
  }

  // 4. Criar o feedback dentro de uma transação
  const result = await prisma.$transaction(async (tx) => {
    // Criar feedback
    const feedback = await tx.feedback.create({
      data: {
        usuarioId,
        produtoId,
        estrelas,
        comentario: comentario || null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    })

    // Recalcular média de avaliações
    const novaMedia = await tx.feedback.aggregate({
      where: { produtoId },
      _avg: {
        estrelas: true,
      },
    })

    const mediaArredondada = novaMedia._avg.estrelas || 0

    // Atualizar campo estrelas do produto
    await tx.produto.update({
      where: { id: produtoId },
      data: { estrelas: mediaArredondada },
    })

    return feedback
  })

  return result
}

/**
 * Obtém feedbacks de um produto
 * @param {string} produtoId - ID do produto
 * @param {Object} pagination - Dados de paginação
 * @returns {Promise<Object>} - Feedbacks e informações de paginação
 */
export const getProductFeedbacks = async (
  produtoId,
  { page = 1, limit = 10 } = {}
) => {
  const skip = (page - 1) * limit

  // Verificar se o produto existe
  const produto = await productRepo.findProductById(produtoId)
  if (!produto) {
    const error = new Error('Produto não encontrado')
    error.statusCode = 404
    throw error
  }

  const feedbacks = await feedbackRepo.findFeedbacksByProductId(produtoId, {
    skip,
    take: limit,
  })

  const total = await feedbackRepo.countFeedbacksByProductId(produtoId)

  return {
    feedbacks,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Obtém estatísticas de avaliação de um produto
 * @param {string} produtoId - ID do produto
 * @returns {Promise<Object>} - Estatísticas de avaliação
 */
export const getProductRatingStats = async (produtoId) => {
  // Verificar se o produto existe
  const produto = await productRepo.findProductById(produtoId)
  if (!produto) {
    const error = new Error('Produto não encontrado')
    error.statusCode = 404
    throw error
  }

  // Contar feedbacks por estrelas
  const feedbacks = await prisma.feedback.findMany({
    where: { produtoId },
    select: { estrelas: true },
  })

  const total = feedbacks.length
  const media = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.estrelas, 0) / feedbacks.length
    : 0

  // Agrupar por número de estrelas
  const distribution = {
    0.5: 0,
    1.0: 0,
    1.5: 0,
    2.0: 0,
    2.5: 0,
    3.0: 0,
    3.5: 0,
    4.0: 0,
    4.5: 0,
    5.0: 0,
    5.5: 0,
  }

  feedbacks.forEach((feedback) => {
    distribution[feedback.estrelas] = (distribution[feedback.estrelas] || 0) + 1
  })

  return {
    media,
    total,
    distribution,
  }
}

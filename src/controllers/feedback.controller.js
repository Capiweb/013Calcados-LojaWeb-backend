import * as feedbackService from '../service/feedback.service.js'

export const createFeedback = async (req, res) => {
  try {
    const usuarioId = req.user.id // Vem do middleware de autenticação
    const payload = req.body

    const feedback = await feedbackService.createFeedback(usuarioId, payload)

    return res.status(201).json({
      message: 'Avaliação criada com sucesso',
      feedback,
    })
  } catch (error) {
    console.error('Erro ao criar feedback:', error)

    const statusCode = error.statusCode || 500
    const message = error.message || 'Erro ao criar avaliação'

    return res.status(statusCode).json({ error: message })
  }
}

export const getProductFeedbacks = async (req, res) => {
  try {
    const { produtoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const result = await feedbackService.getProductFeedbacks(produtoId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    })

    return res.status(200).json(result)
  } catch (error) {
    console.error('Erro ao listar feedbacks:', error)

    const statusCode = error.statusCode || 500
    const message = error.message || 'Erro ao listar avaliações'

    return res.status(statusCode).json({ error: message })
  }
}

export const getProductRatingStats = async (req, res) => {
  try {
    const { produtoId } = req.params

    const stats = await feedbackService.getProductRatingStats(produtoId)

    return res.status(200).json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)

    const statusCode = error.statusCode || 500
    const message = error.message || 'Erro ao obter estatísticas de avaliação'

    return res.status(statusCode).json({ error: message })
  }
}

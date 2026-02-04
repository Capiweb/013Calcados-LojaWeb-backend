import * as variacaoService from '../service/variacao.service.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

export const getAllVariacoes = async (req, res) => {
  try {
    const variacoes = await variacaoService.getAllVariacoes()
    if (!variacoes || variacoes.length === 0) {
      return res.status(404).json({ error: 'Nenhuma variação de produto encontrada', message: 'Você precisa criar produtos e suas variações primeiro' })
    }
    return res.status(200).json({ total: variacoes.length, variacoes })
  } catch (error) {
    console.error('Erro ao buscar variações:', error)
    return res.status(500).json({ error: 'Erro ao buscar variações de produtos' })
  }
}

export const getVariacao = async (req, res) => {
  try {
    const { id } = req.params
    const v = await variacaoService.getVariacaoById(id)
    if (!v) return res.status(404).json({ error: 'Variação não encontrada' })
    return res.status(200).json(v)
  } catch (e) {
    console.error('getVariacao error:', e)
    return res.status(500).json({ error: 'Erro' })
  }
}

export const updateEstoque = async (req, res) => {
  try {
    const userId = req.userId
    const isAdmin = req.userRole === 'ADMIN'
    const { id } = req.params
    const { estoque } = req.body
    if (estoque === undefined || isNaN(Number(estoque))) return res.status(400).json({ error: 'Estoque inválido' })
    try {
      const updated = await variacaoService.updateEstoqueVariacao(id, Number(estoque), userId, isAdmin)
      return res.status(200).json(updated)
    } catch (e) {
      if (String(e.message).includes('Não autorizado')) return res.status(403).json({ error: 'Não autorizado' })
      return res.status(500).json({ error: 'Erro ao atualizar estoque', details: String(e.message) })
    }
  } catch (err) {
    console.error('updateEstoque error:', err)
    return res.status(500).json({ error: 'Erro' })
  }
}

export default {
  getAllVariacoes,
  getVariacao,
  updateEstoque
}

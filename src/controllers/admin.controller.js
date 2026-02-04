import * as productRepo from '../repositories/product.repository.js'

// PUT /api/admin/produto-variacao/:id/estoque
export const setVariacaoEstoque = async (req, res) => {
  try {
    const { id } = req.params
    const { estoque } = req.body
    if (typeof estoque === 'undefined') return res.status(400).json({ error: 'estoque é obrigatório' })
    const updated = await productRepo.setStock(id, Number(estoque))
    if (!updated) return res.status(404).json({ error: 'Variacao não encontrada' })
    return res.status(200).json({ ok: true, updated })
  } catch (err) {
    console.error('setVariacaoEstoque error:', err)
    return res.status(500).json({ error: 'Erro ao atualizar estoque' })
  }
}

export default {}

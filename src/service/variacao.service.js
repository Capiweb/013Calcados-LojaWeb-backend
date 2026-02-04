import * as variacaoRepo from '../repositories/variacao.repository.js'

export const getAllVariacoes = async () => {
  return await variacaoRepo.getAllVariacoes()
}

export const getVariacaoById = async (id) => {
  return await variacaoRepo.getVariacaoById(id)
}

export const updateEstoqueVariacao = async (produtoVariacaoId, novoEstoque, requestingUserId, isAdmin = false) => {
  // only admin may adjust stock through this endpoint
  if (!isAdmin) throw new Error('Não autorizado')
  if (isNaN(Number(novoEstoque))) throw new Error('Estoque inválido')
  return await variacaoRepo.updateVariacaoEstoque(produtoVariacaoId, Number(novoEstoque))
}

import * as variacaoRepo from '../repositories/variacao.repository.js'

export const getAllVariacoes = async () => {
  return await variacaoRepo.getAllVariacoes()
}

export const getVariacaoById = async (id) => {
  return await variacaoRepo.getVariacaoById(id)
}

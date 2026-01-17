import * as enderecoRepo from '../repositories/endereco.repository.js'

export const createEndereco = async (usuarioId, data) => {
  if (!usuarioId) throw new Error('Usuário ID é obrigatório')
  
  return enderecoRepo.createEndereco({
    ...data,
    usuarioId
  })
}

export const listEnderecosDoUsuario = async (usuarioId) => {
  if (!usuarioId) throw new Error('Usuário ID é obrigatório')
  
  return enderecoRepo.findEnderecosByUsuario(usuarioId)
}

export const getEndereco = async (id) => {
  const endereco = await enderecoRepo.findEnderecoById(id)
  if (!endereco) throw new Error('Endereço não encontrado')
  
  return endereco
}

export const updateEndereco = async (id, usuarioId, data) => {
  // Validar se o endereço pertence ao usuário
  const endereco = await enderecoRepo.verificaEnderecoDoUsuario(id, usuarioId)
  if (!endereco) throw new Error('Endereço não encontrado ou não pertence ao usuário')
  
  return enderecoRepo.updateEndereco(id, data)
}

export const deleteEndereco = async (id, usuarioId) => {
  // Validar se o endereço pertence ao usuário
  const endereco = await enderecoRepo.verificaEnderecoDoUsuario(id, usuarioId)
  if (!endereco) throw new Error('Endereço não encontrado ou não pertence ao usuário')
  
  return enderecoRepo.deleteEndereco(id)
}

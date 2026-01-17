import * as enderecoService from '../service/endereco.service.js'

export const create = async (req, res) => {
  try {
    const { id: usuarioId } = req.user
    const data = req.body

    const endereco = await enderecoService.createEndereco(usuarioId, data)
    return res.status(201).json(endereco)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro ao criar endereço' })
  }
}

export const list = async (req, res) => {
  try {
    const { id: usuarioId } = req.user

    const enderecos = await enderecoService.listEnderecosDoUsuario(usuarioId)
    return res.status(200).json(enderecos)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao listar endereços' })
  }
}

export const getById = async (req, res) => {
  try {
    const { id } = req.params
    const endereco = await enderecoService.getEndereco(id)
    return res.status(200).json(endereco)
  } catch (error) {
    if (error.message === 'Endereço não encontrado') return res.status(404).json({ error: error.message })
    console.error(error)
    return res.status(500).json({ error: 'Erro ao buscar endereço' })
  }
}

export const update = async (req, res) => {
  try {
    const { id } = req.params
    const { id: usuarioId } = req.user
    const data = req.body

    const endereco = await enderecoService.updateEndereco(id, usuarioId, data)
    return res.status(200).json(endereco)
  } catch (error) {
    if (error.message.includes('não encontrado')) return res.status(404).json({ error: error.message })
    console.error(error)
    return res.status(500).json({ error: 'Erro ao atualizar endereço' })
  }
}

export const remove = async (req, res) => {
  try {
    const { id } = req.params
    const { id: usuarioId } = req.user

    await enderecoService.deleteEndereco(id, usuarioId)
    return res.status(204).send()
  } catch (error) {
    if (error.message.includes('não encontrado')) return res.status(404).json({ error: error.message })
    console.error(error)
    return res.status(500).json({ error: 'Erro ao deletar endereço' })
  }
}

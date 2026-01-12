import * as categoryService from '../service/category.service.js'

export const create = async (req, res) => {
  try {
    const { nome, slug } = req.body
    if (!nome || !slug) return res.status(400).json({ error: 'nome e slug são obrigatórios' })

    const categoria = await categoryService.createCategory({ nome, slug })
    return res.status(201).json(categoria)
  } catch (error) {
    if (error.message === 'Slug já em uso') return res.status(409).json({ error: error.message })
    console.error(error)
    return res.status(500).json({ error: 'Erro ao criar categoria' })
  }
}

export const list = async (req, res) => {
  try {
    const categorias = await categoryService.listCategories()
    return res.status(200).json(categorias)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao listar categorias' })
  }
}

export const getById = async (req, res) => {
  try {
    const { id } = req.params
    const categoria = await categoryService.getCategory(id)
    if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada' })
    return res.status(200).json(categoria)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao buscar categoria' })
  }
}

export const update = async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    const categoria = await categoryService.updateCategory(id, data)
    return res.status(200).json(categoria)
  } catch (error) {
    if (error.message === 'Slug já em uso') return res.status(409).json({ error: error.message })
    console.error(error)
    return res.status(500).json({ error: 'Erro ao atualizar categoria' })
  }
}

export const remove = async (req, res) => {
  try {
    const { id } = req.params
    await categoryService.deleteCategory(id)
    return res.status(204).send()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao deletar categoria' })
  }
}

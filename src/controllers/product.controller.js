import * as productService from '../service/product.service.js'

export const create = async (req, res) => {
  try {
    const payload = req.body
    const produto = await productService.createProduct(payload)

    return res.status(201).json(produto)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao criar produto' })
  }
}

export const createBulk = async (req, res) => {
  try {
    const produtos = req.body
    const created = await productService.createProductsBulk(produtos)
    return res.status(201).json(created)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao criar produtos em massa' })
  }
}

export const getAll = async (req, res) => {
  try {
    const result = await productService.listProducts(req.query)
    return res.status(200).json(result)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao listar produtos' })
  }
}

export const getById = async (req, res) => {
  try {
    const { id } = req.params
    const produto = await productService.getProductById(id)
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' })
    return res.status(200).json(produto)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao buscar produto' })
  }
}

export const update = async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    const produto = await productService.updateProduct(id, data)
    return res.status(200).json(produto)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao atualizar produto' })
  }
}

export const remove = async (req, res) => {
  try {
    const { id } = req.params
    await productService.deleteProduct(id)
    return res.status(204).send()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao deletar produto' })
  }
}

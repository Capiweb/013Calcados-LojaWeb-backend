import * as productService from '../service/product.service.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'

export const create = async (req, res) => {
  try {
    const payload = { ...req.body }
    // if file uploaded, upload to cloudinary and set imagemUrl + imagemPublicId
    if (req.file && req.file.buffer) {
      const uploaded = await uploadToCloudinary(req.file.buffer)
      payload.imagemUrl = uploaded.secure_url
      payload.imagemPublicId = uploaded.public_id
    }

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
    const data = { ...req.body }
    // handle new uploaded image
    if (req.file && req.file.buffer) {
      const uploaded = await uploadToCloudinary(req.file.buffer)
      data.imagemUrl = uploaded.secure_url
      data.imagemPublicId = uploaded.public_id

      // delete old image if exists
      try {
        const existing = await productService.getProductById(id)
        if (existing && existing.imagemPublicId) {
          await deleteFromCloudinary(existing.imagemPublicId)
        }
      } catch (err) {
        console.error('Erro ao apagar imagem antiga do Cloudinary', err)
      }
    }

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
    // delete image from cloudinary if present
    try {
      const existing = await productService.getProductById(id)
      if (existing && existing.imagemPublicId) await deleteFromCloudinary(existing.imagemPublicId)
    } catch (err) {
      console.error('Erro ao apagar imagem no Cloudinary antes de deletar produto', err)
    }

    await productService.deleteProduct(id)
    return res.status(204).send()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao deletar produto' })
  }
}

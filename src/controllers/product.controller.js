import * as productService from '../service/product.service.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'

export const create = async (req, res) => {
  try {
    const payload = { ...req.body }
    // Support up to 6 images. Priority: multipart files (req.files) -> imagemBase64 (array) -> imagemUrl (single)
    payload.imagemUrls = payload.imagemUrls || []
    payload.imagemPublicIds = payload.imagemPublicIds || []

    // multipart files (multer) - support req.files (array) or req.file (fallback single)
    const files = req.files && Array.isArray(req.files) ? req.files.slice(0, 6) : (req.file ? [req.file] : [])
    if (files.length) {
      for (const f of files.slice(0, 6)) {
        if (f && f.buffer) {
          const uploaded = await uploadToCloudinary(f.buffer)
          payload.imagemUrls.push(uploaded.secure_url)
          payload.imagemPublicIds.push(uploaded.public_id)
        }
      }
    } else if (Array.isArray(payload.imagemBase64) && payload.imagemBase64.length) {
      for (const item of payload.imagemBase64.slice(0, 6)) {
        const matches = String(item || '').match(/data:(image\/[a-zA-Z]+);base64,(.*)$/)
        let b64 = item
        if (matches) b64 = matches[2]
        const buffer = Buffer.from(b64, 'base64')
        const uploaded = await uploadToCloudinary(buffer)
        payload.imagemUrls.push(uploaded.secure_url)
        payload.imagemPublicIds.push(uploaded.public_id)
      }
      delete payload.imagemBase64
    } else if (payload.imagemUrl) {
      // single imagemUrl provided
      payload.imagemUrls.push(payload.imagemUrl)
      if (payload.imagemPublicId) payload.imagemPublicIds.push(payload.imagemPublicId)
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
    // handle up to 6 new uploaded images
    data.imagemUrls = data.imagemUrls || []
    data.imagemPublicIds = data.imagemPublicIds || []
    const files = req.files && Array.isArray(req.files) ? req.files.slice(0, 6) : (req.file ? [req.file] : [])
    if (files.length) {
      for (const f of files.slice(0, 6)) {
        if (f && f.buffer) {
          const uploaded = await uploadToCloudinary(f.buffer)
          data.imagemUrls.push(uploaded.secure_url)
          data.imagemPublicIds.push(uploaded.public_id)
        }
      }
    } else if (Array.isArray(data.imagemBase64) && data.imagemBase64.length) {
      for (const item of data.imagemBase64.slice(0, 6)) {
        const matches = String(item || '').match(/data:(image\/[a-zA-Z]+);base64,(.*)$/)
        let b64 = item
        if (matches) b64 = matches[2]
        const buffer = Buffer.from(b64, 'base64')
        const uploaded = await uploadToCloudinary(buffer)
        data.imagemUrls.push(uploaded.secure_url)
        data.imagemPublicIds.push(uploaded.public_id)
      }
      delete data.imagemBase64
    } else if (data.imagemUrl) {
      data.imagemUrls.push(data.imagemUrl)
      if (data.imagemPublicId) data.imagemPublicIds.push(data.imagemPublicId)
    }

    // delete old images if we replaced them (imagemPublicIds present)
    if (data.imagemPublicIds && data.imagemPublicIds.length) {
      try {
        const existing = await productService.getProductById(id)
        if (existing && Array.isArray(existing.imagemPublicIds)) {
          for (const pid of existing.imagemPublicIds) {
            try { await deleteFromCloudinary(pid) } catch (e) { /* swallow */ }
          }
        } else if (existing && existing.imagemPublicId) {
          // fallback for older records
          try { await deleteFromCloudinary(existing.imagemPublicId) } catch (e) { /* swallow */ }
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

// Admin: decrement estoque da variação (subtrai 1)
export const decrementVariationStock = async (req, res) => {
  try {
    const { produtoId, variacaoId } = req.params
    if (!variacaoId) return res.status(400).json({ error: 'variacaoId é obrigatório' })

    // repository function returns number of rows updated
    const updated = await productService.decrementStock(variacaoId, 1)
    if (typeof updated === 'number' && updated > 0) {
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Não foi possível decrementar o estoque (talvez estoque insuficiente ou variação não encontrada)' })
  } catch (err) {
    console.error('Erro ao decrementar estoque da variação', err)
    return res.status(500).json({ error: 'Erro ao decrementar estoque' })
  }
}

// Admin: increment estoque da variação (soma 1)
export const incrementVariationStock = async (req, res) => {
  try {
    const { produtoId, variacaoId } = req.params
    if (!variacaoId) return res.status(400).json({ error: 'variacaoId é obrigatório' })

    const updated = await productService.incrementStock(variacaoId, 1)
    if (typeof updated === 'number' && updated > 0) {
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Não foi possível incrementar o estoque (variação não encontrada)' })
  } catch (err) {
    console.error('Erro ao incrementar estoque da variação', err)
    return res.status(500).json({ error: 'Erro ao incrementar estoque' })
  }
}

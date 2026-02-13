import * as productRepo from '../repositories/product.repository.js'

export const createProduct = async (payload) => {
  return productRepo.createProduct(payload)
}

export const createProductsBulk = async (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Payload inválido: espere um array de produtos')
  }

  // Process in batches to avoid very long sequential processing and to limit DB connections
  const BATCH_SIZE = 10
  const created = []
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE)
    // map to normalized payloads
    const ops = chunk.map(p => {
      const payload = { ...p }
      if (Array.isArray(p.variacoes)) payload.variacoes = { create: p.variacoes }
      return productRepo.createProduct(payload)
    })
    const results = await Promise.all(ops)
    created.push(...results)
  }

  return created
}

// Monta where a partir dos filtros query
const buildWhere = (query) => {
  const where = {}

  if (query.categoria) where.categoria = { slug: query.categoria }
  if (query.emPromocao) where.emPromocao = query.emPromocao === 'true'
  if (query.q) where.nome = { contains: query.q, mode: 'insensitive' }
  if (query.precoMin || query.precoMax) {
    where.preco = {}
    if (query.precoMin) where.preco.gte = Number(query.precoMin)
    if (query.precoMax) where.preco.lte = Number(query.precoMax)
  }
  if (query.tamanho) {
    where.variacoes = { some: { tamanho: query.tamanho } }
  }
  if (query.emEstoque) {
    where.variacoes = { some: { estoque: { gt: 0 } } }
  }

  return where
}

export const listProducts = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.max(Number(query.limit) || 10, 1)
  const skip = (page - 1) * limit

  const where = buildWhere(query)

  const total = await productRepo.countProducts(where)
  const produtos = await productRepo.findProducts({ where, skip, take: limit })

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    produtos,
  }
}

export const getProductById = async (id) => {
  return productRepo.findProductById(id)
}

export const updateProduct = async (id, data) => {
  return productRepo.updateProduct(id, data)
}

export const deleteProduct = async (id) => {
  return productRepo.deleteProduct(id)
}

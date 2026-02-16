import * as productRepo from '../repositories/product.repository.js'

export function mapProductCreateInput(raw) {
  return {
    nome: raw.nome,
    slug: raw.slug,
    descricao: raw.descricao,

    preco: Number(raw.preco),

    categoriaId: raw.categoriaId,

    emPromocao:
      raw.emPromocao === true ||
      raw.emPromocao === 'true',

    imagemUrl: raw.imagemUrl ?? null,
      // support multiple images arrays (from controller) or single imagemUrl/imagemPublicId
      imagemUrls: (() => {
        if (!raw.imagemUrls && !raw.imagemUrl) return undefined
        try {
          if (typeof raw.imagemUrls === 'string') return JSON.parse(raw.imagemUrls)
          if (Array.isArray(raw.imagemUrls)) return raw.imagemUrls
        } catch (e) {
          // ignore parse error
        }
        return raw.imagemUrl ? [raw.imagemUrl] : undefined
      })(),
      imagemPublicIds: (() => {
        if (!raw.imagemPublicIds && !raw.imagemPublicId) return undefined
        try {
          if (typeof raw.imagemPublicIds === 'string') return JSON.parse(raw.imagemPublicIds)
          if (Array.isArray(raw.imagemPublicIds)) return raw.imagemPublicIds
        } catch (e) {
          // ignore
        }
        return raw.imagemPublicId ? [raw.imagemPublicId] : undefined
      })(),
      imagemPublicId: raw.imagemPublicId ?? null,

    variacoes: raw.variacoes
      ? {
        create: JSON.parse(raw.variacoes).map((v) => ({
          tipoTamanho: v.tipoTamanho,
          tamanho: v.tamanho,
          estoque: Number(v.estoque),
          sku: v.sku,
          cores: v.cores
        }))
      }
      : undefined
  };
}


export const createProduct = async (payload) => {
  return productRepo.createProduct(mapProductCreateInput(payload))
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
    // only match products that have at least one variation with the requested size and in stock
    where.variacoes = { some: { tamanho: query.tamanho, estoque: { gt: 0 } } }
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

  // parse sort param: accept formats like "-createdAt" or "createdAt"
  let orderBy
  if (query.sort) {
    const raw = String(query.sort)
    const dir = raw.startsWith('-') ? 'desc' : 'asc'
    const fieldRaw = raw.replace(/^-/, '')
    // map common API field names to DB fields
    const fieldMap = {
      createdAt: 'criadoEm',
      criadoEm: 'criadoEm',
      price: 'preco',
      preco: 'preco',
      nome: 'nome',
      estrelas: 'estrelas'
    }
    const mapped = fieldMap[fieldRaw]
    if (mapped) orderBy = { [mapped]: dir }
  }

  const total = await productRepo.countProducts(where)
  const produtos = await productRepo.findProducts({ where, skip, take: limit, orderBy })

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

export const decrementStock = async (produtoVariacaoId, amount = 1) => {
  return productRepo.decrementStock(produtoVariacaoId, amount)
}

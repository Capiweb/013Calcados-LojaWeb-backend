import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createProduct = async (data) => {
  try {
    // Normalize variacoes: accept either an array or already nested { create: [...] }
    const payload = { ...data }
    // support variacoes passed as JSON string from multipart/form-data
    const variacoesParsed = (() => {
      if (!data.variacoes) return undefined
      if (typeof data.variacoes === 'string') {
        try { return JSON.parse(data.variacoes) } catch (e) { return data.variacoes }
      }
      return data.variacoes
    })()
    // Normalize categories early so transactions don't receive categoriaIds
    // Use `connect` for create operations (`set` is not valid in create payloads)
    if (payload.categoriaIds && Array.isArray(payload.categoriaIds)) {
      payload.categorias = { connect: payload.categoriaIds.map(id => ({ id })) }
      delete payload.categoriaIds
    } else if (payload.categoriaId) {
      payload.categorias = { connect: [{ id: payload.categoriaId }] }
      delete payload.categoriaId
    }
  if (Array.isArray(variacoesParsed)) {
      // sanitize each variação to allowed fields only
      const create = variacoesParsed.map(v => {
        const cores = Array.isArray(v.cores) ? v.cores : undefined
        return {
          tipoTamanho: v.tipoTamanho,
          tamanho: v.tamanho,
          estoque: typeof v.estoque === 'number' ? v.estoque : (v.estoque ? Number(v.estoque) : 0),
          sku: v.sku,
          ...(cores ? { cores } : {})
        }
      })
      payload.variacoes = { create }
    }

    // Support multiple categories: if categoriaIds provided (array of uuids), connect them
    if (payload.categoriaIds && Array.isArray(payload.categoriaIds) && payload.categoriaIds.length) {
      payload.categorias = { connect: payload.categoriaIds.map(id => ({ id })) }
      delete payload.categoriaIds
    } else if (payload.categoriaId) {
      // legacy single-category support
      payload.categorias = { connect: [{ id: payload.categoriaId }] }
      delete payload.categoriaId
    }

    // Ensure imagemUrl (required in schema) is set: prefer first imagemUrls
    if (!payload.imagemUrl) {
      if (Array.isArray(payload.imagemUrls) && payload.imagemUrls.length) payload.imagemUrl = payload.imagemUrls[0]
      else payload.imagemUrl = ''
    }

    return await prisma.produto.create({
      data: payload,
      include: {
        categorias: true,
        variacoes: true,
      },
    })
  } catch (err) {
    // If the DB doesn't have the 'cores' column yet, retry without it
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      // remove cores from nested variacoes if present
      // Build safeData: support both array and nested create structures
      const safeVariacoes = (() => {
        if (!data.variacoes) return undefined
        // attempt to parse string if necessary
        const dv = (typeof data.variacoes === 'string') ? (() => { try { return JSON.parse(data.variacoes) } catch (e) { return data.variacoes } })() : data.variacoes
        // if variacoes is nested { create: [...] }
        if (dv && dv.create && Array.isArray(dv.create)) {
          return dv.create.map(v => ({ tipoTamanho: v.tipoTamanho, tamanho: v.tamanho, estoque: v.estoque, sku: v.sku }))
        }
        // if variacoes is an array
        if (Array.isArray(dv)) {
          return dv.map(v => ({ tipoTamanho: v.tipoTamanho, tamanho: v.tamanho, estoque: v.estoque, sku: v.sku }))
        }
        return undefined
      })()

      const safeData = {
        ...data,
        variacoes: safeVariacoes ? { create: safeVariacoes } : undefined
      }
      // same safeguards for safeData: connect categoria and ensure imagemUrl
      if (safeData.categoriaIds && Array.isArray(safeData.categoriaIds) && safeData.categoriaIds.length) {
        safeData.categorias = { connect: safeData.categoriaIds.map(id => ({ id })) }
        delete safeData.categoriaIds
      } else if (safeData.categoriaId) {
        safeData.categorias = { connect: [{ id: safeData.categoriaId }] }
        delete safeData.categoriaId
      }
      if (!safeData.imagemUrl) {
        if (Array.isArray(safeData.imagemUrls) && safeData.imagemUrls.length) safeData.imagemUrl = safeData.imagemUrls[0]
        else safeData.imagemUrl = ''
      }
      return prisma.produto.create({
        data: safeData,
        include: { categorias: true, variacoes: true }
      })
    }
    throw err
  }
}

export const findProductById = async (id) => {
  try {
    return await prisma.produto.findUnique({
      where: { id },
      include: {
        categorias: true,
        variacoes: true,
        feedbacks: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            criadoEm: 'desc',
          },
        },
      },
    })
  } catch (err) {
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      // fallback: don't request the cores field
      return prisma.produto.findUnique({
        where: { id },
        include: {
          categorias: true,
          variacoes: {
            select: {
              id: true,
              produtoId: true,
              tipoTamanho: true,
              tamanho: true,
              estoque: true,
              sku: true,
              criadoEm: true
            }
          },
          feedbacks: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
            orderBy: {
              criadoEm: 'desc',
            },
          },
        }
      })
    }
    throw err
  }
}

export const countProducts = async (where) => {
  return prisma.produto.count({ where })
}

export const findProducts = async ({ where, skip, take, orderBy }) => {
  return prisma.produto.findMany({
    where,
    skip,
    take,
    orderBy,
    select: {
      id: true,
      nome: true,
      slug: true,
      imagemUrl: true,
      imagemUrls: true,
      imagemPublicIds: true,
      preco: true,
      emPromocao: true,
      precoPromocional: true,
      estrelas: true,
      criadoEm: true,
      variacoes: true,
    },
  })
}

export const updateProduct = async (id, data) => {
  try {
    // Normalize variacoes: accept array of variacoes and convert to nested update/create
    const payload = { ...data }
    // Normalize categories early so we never pass `categoriaIds` directly to Prisma.
    // This is important for the transactional variacoes flow below.
    if (payload.categoriaIds && Array.isArray(payload.categoriaIds)) {
      payload.categorias = { set: payload.categoriaIds.map(id => ({ id })) }
      delete payload.categoriaIds
    } else if (payload.categoriaId) {
      payload.categorias = { set: [{ id: payload.categoriaId }] }
      delete payload.categoriaId
    }
    // support variacoes passed as JSON string from multipart/form-data
    const variacoesParsed = (() => {
      if (!data.variacoes) return undefined
      if (typeof data.variacoes === 'string') {
        try { return JSON.parse(data.variacoes) } catch (e) { return data.variacoes }
      }
      return data.variacoes
    })()
    if (Array.isArray(variacoesParsed)) {
      // if client provided an array (possibly empty) we treat it as the source of truth:
      // - items with id -> update
      // - items without id -> create
      // - existing items not present in the sent array -> delete
      const create = []
      const update = []
      const incomingIds = []
      for (const v of variacoesParsed) {
        const vid = v.id
        if (vid) incomingIds.push(vid)
        const cores = Array.isArray(v.cores) ? v.cores : undefined
        const sanitized = {
          tipoTamanho: v.tipoTamanho,
          tamanho: v.tamanho,
          estoque: typeof v.estoque === 'number' ? v.estoque : (v.estoque ? Number(v.estoque) : undefined),
          sku: v.sku,
          ...(cores ? { cores } : {})
        }
        if (vid) {
          update.push({ where: { id: vid }, data: sanitized })
        } else {
          create.push(sanitized)
        }
      }
      // compute deletions: existing variation ids not present in incomingIds
      const existing = await prisma.produtoVariacao.findMany({ where: { produtoId: id }, select: { id: true } })
      const existingIds = existing.map(e => e.id)
      const idsToDelete = existingIds.filter(eid => !incomingIds.includes(eid))

      // perform operations in a transaction to avoid unique constraint issues (sku)
      // prepare product-level payload (exclude variacoes nested operations)
      const productPayload = { ...payload }
      delete productPayload.variacoes

      const result = await prisma.$transaction(async (tx) => {
        // 1) delete obsolete variations
        if (idsToDelete.length) {
          await tx.produtoVariacao.deleteMany({ where: { id: { in: idsToDelete } } })
        }
        // 2) update existing
        for (const u of update) {
          await tx.produtoVariacao.update({ where: u.where, data: u.data })
        }
        // 3) create new ones (attach produtoId)
        for (const c of create) {
          await tx.produtoVariacao.create({ data: { ...c, produtoId: id } })
        }
        // 4) update produto fields (categories, name, price, imagemUrl etc.)
        return tx.produto.update({ where: { id }, data: productPayload, include: { categorias: true, variacoes: true } })
      })

      return result
    }


    // Ensure imagemUrl (required in schema) is set: prefer first imagemUrls
    if (!payload.imagemUrl) {
      if (Array.isArray(payload.imagemUrls) && payload.imagemUrls.length) payload.imagemUrl = payload.imagemUrls[0]
      else payload.imagemUrl = undefined
    }

    return await prisma.produto.update({
      where: { id },
      data: payload,
      include: {
        categorias: true,
        variacoes: true,
      },
    })
  } catch (err) {
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      // remove cores from any nested variacoes payload before retry
      // build safePayload using async-friendly flow (we may need to query existing variacoes)
      let safePayload = { ...data }
      // attempt to transform variacoes similar to the normal flow but without cores
      const dv = (typeof data.variacoes === 'string') ? (() => { try { return JSON.parse(data.variacoes) } catch (e) { return data.variacoes } })() : data.variacoes
      if (Array.isArray(dv)) {
        const create = []
        const update = []
        const incomingIds = []
        for (const v of dv) {
          const vid = v.id
          if (vid) incomingIds.push(vid)
          const sanitized = {
            tipoTamanho: v.tipoTamanho,
            tamanho: v.tamanho,
            estoque: typeof v.estoque === 'number' ? v.estoque : (v.estoque ? Number(v.estoque) : undefined),
            sku: v.sku
          }
          if (vid) update.push({ where: { id: vid }, data: sanitized })
          else create.push(sanitized)
        }
        const existing = await prisma.produtoVariacao.findMany({ where: { produtoId: id }, select: { id: true } })
        const existingIds = existing.map(e => e.id)
        const idsToDelete = existingIds.filter(eid => !incomingIds.includes(eid))

        // perform transaction: delete -> update -> create -> update produto
        const productPayload = { ...safePayload }
        delete productPayload.variacoes
        const result = await prisma.$transaction(async (tx) => {
          if (idsToDelete.length) await tx.produtoVariacao.deleteMany({ where: { id: { in: idsToDelete } } })
          for (const u of update) await tx.produtoVariacao.update({ where: u.where, data: u.data })
          for (const c of create) await tx.produtoVariacao.create({ data: { ...c, produtoId: id } })
          return tx.produto.update({ where: { id }, data: productPayload, include: { categorias: true, variacoes: true } })
        })
        return result
      } else if (data.variacoes && data.variacoes.create) {
        // if already nested, strip cores from create array
        safePayload.variacoes = { ...data.variacoes }
        safePayload.variacoes.create = (safePayload.variacoes.create || []).map(v => ({ tipoTamanho: v.tipoTamanho, tamanho: v.tamanho, estoque: typeof v.estoque === 'number' ? v.estoque : (v.estoque ? Number(v.estoque) : undefined), sku: v.sku }))
        if (safePayload.variacoes.update) {
          safePayload.variacoes.update = safePayload.variacoes.update.map(u => ({ where: u.where, data: (() => { const v = u.data; return { tipoTamanho: v.tipoTamanho, tamanho: v.tamanho, estoque: typeof v.estoque === 'number' ? v.estoque : (v.estoque ? Number(v.estoque) : undefined), sku: v.sku } })() }))
        }
      }
      // also normalize categories in the safePayload (same logic as above)
      if (safePayload.categoriaIds && Array.isArray(safePayload.categoriaIds)) {
        safePayload.categorias = { set: safePayload.categoriaIds.map(id => ({ id })) }
        delete safePayload.categoriaIds
      } else if (safePayload.categoriaId) {
        safePayload.categorias = { set: [{ id: safePayload.categoriaId }] }
        delete safePayload.categoriaId
      }
      // ensure imagemUrl fallback
      if (!safePayload.imagemUrl) {
        if (Array.isArray(safePayload.imagemUrls) && safePayload.imagemUrls.length) safePayload.imagemUrl = safePayload.imagemUrls[0]
        else safePayload.imagemUrl = undefined
      }

      return prisma.produto.update({ where: { id }, data: safePayload, include: { categorias: true, variacoes: true } })
    }
    throw err
  }
}

export const deleteProduct = async (id) => {
  return prisma.produto.delete({ where: { id } })
}

export const decrementStock = async (produtoVariacaoId, amount) => {
  const res = await prisma.produtoVariacao.updateMany({
    where: { id: produtoVariacaoId, estoque: { gte: amount } },
    data: { estoque: { decrement: amount } }
  })
  // return number of rows affected for easier checks upstream
  return res.count ?? 0
}

export const incrementStock = async (produtoVariacaoId, amount) => {
  const res = await prisma.produtoVariacao.updateMany({
    where: { id: produtoVariacaoId },
    data: { estoque: { increment: amount } }
  })
  return res.count ?? 0
}

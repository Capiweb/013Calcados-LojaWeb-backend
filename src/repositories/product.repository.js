import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createProduct = async (data) => {
  try {
    // Normalize variacoes: accept either an array or already nested { create: [...] }
    const payload = { ...data }
    if (Array.isArray(data.variacoes)) {
      payload.variacoes = { create: data.variacoes }
    }

    return await prisma.produto.create({
      data: payload,
      include: {
        categoria: true,
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
        // if variacoes is nested { create: [...] }
        if (data.variacoes.create && Array.isArray(data.variacoes.create)) {
          return data.variacoes.create.map(v => ({
            tipoTamanho: v.tipoTamanho,
            tamanho: v.tamanho,
            estoque: v.estoque,
            sku: v.sku
          }))
        }
        // if variacoes is an array
        if (Array.isArray(data.variacoes)) {
          return data.variacoes.map(v => ({
            tipoTamanho: v.tipoTamanho,
            tamanho: v.tamanho,
            estoque: v.estoque,
            sku: v.sku
          }))
        }
        return undefined
      })()

      const safeData = {
        ...data,
        variacoes: safeVariacoes ? { create: safeVariacoes } : undefined
      }
      return prisma.produto.create({
        data: safeData,
        include: { categoria: true, variacoes: true }
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
        categoria: true,
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
          categoria: true,
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
      preco: true,
      emPromocao: true,
      precoPromocional: true,
      estrelas: true,
    },
  })
}

export const updateProduct = async (id, data) => {
  try {
    // Normalize variacoes: accept array of variacoes and convert to nested update/create
    const payload = { ...data }
    if (Array.isArray(data.variacoes)) {
      const create = []
      const update = []
      for (const v of data.variacoes) {
        const { id: vid, cores, ...rest } = v
        // include cores in data if present; prisma will accept it when DB has column
        if (vid) {
          update.push({ where: { id: vid }, data: { ...rest, ...(cores ? { cores } : {}) } })
        } else {
          create.push({ ...rest, ...(cores ? { cores } : {}) })
        }
      }
      const nested = {}
      if (create.length) nested.create = create
      if (update.length) nested.update = update
      payload.variacoes = nested
    }

    return await prisma.produto.update({
      where: { id },
      data: payload,
      include: {
        categoria: true,
        variacoes: true,
      },
    })
  } catch (err) {
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      // remove cores from any nested variacoes payload before retry
      const safePayload = (() => {
        // start from previously normalized payload if available
        const base = { ...data }
        // if original data was array, it was transformed above to nested in `payload`
        // try to reconstruct nested shape without cores
        if (Array.isArray(data.variacoes)) {
          const create = []
          const update = []
          for (const v of data.variacoes) {
            const { id: vid, cores, ...rest } = v
            if (vid) update.push({ where: { id: vid }, data: rest })
            else create.push(rest)
          }
          const nested = {}
          if (create.length) nested.create = create
          if (update.length) nested.update = update
          base.variacoes = nested
        } else if (data.variacoes && data.variacoes.create) {
          // if already nested, strip cores from create array
          base.variacoes = { ...data.variacoes }
          base.variacoes.create = base.variacoes.create.map(v => {
            const { cores, ...rest } = v
            return rest
          })
          if (base.variacoes.update) {
            base.variacoes.update = base.variacoes.update.map(u => ({ where: u.where, data: (() => { const { cores, ...rest } = u.data; return rest })() }))
          }
        }
        return base
      })()
      return prisma.produto.update({ where: { id }, data: safePayload, include: { categoria: true, variacoes: true } })
    }
    throw err
  }
}

export const deleteProduct = async (id) => {
  return prisma.produto.delete({ where: { id } })
}

export const decrementStock = async (produtoVariacaoId, amount) => {
  return prisma.produtoVariacao.updateMany({
    where: { id: produtoVariacaoId, estoque: { gte: amount } },
    data: { estoque: { decrement: amount } }
  })
}

export const incrementStock = async (produtoVariacaoId, amount) => {
  return prisma.produtoVariacao.updateMany({
    where: { id: produtoVariacaoId },
    data: { estoque: { increment: amount } }
  })
}

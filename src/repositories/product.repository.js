import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createProduct = async (data) => {
  try {
    return await prisma.produto.create({
      data,
      include: {
        categoria: true,
        variacoes: true,
      },
    })
  } catch (err) {
    // If the DB doesn't have the 'cores' column yet, retry without it
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      // remove cores from nested variacoes if present
      const safeData = {
        ...data,
        variacoes: data.variacoes ? { create: data.variacoes.create.map(v => ({
          tipoTamanho: v.tipoTamanho,
          tamanho: v.tamanho,
          estoque: v.estoque,
          sku: v.sku
        })) } : undefined
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
          }
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
    },
  })
}

export const updateProduct = async (id, data) => {
  try {
    return await prisma.produto.update({
      where: { id },
      data,
      include: {
        categoria: true,
        variacoes: true,
      },
    })
  } catch (err) {
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      // remove cores from any nested variacoes data before retry
      const safeData = { ...data }
      if (safeData.variacoes && Array.isArray(safeData.variacoes)) {
        safeData.variacoes = safeData.variacoes.map(v => {
          const { cores, ...rest } = v
          return rest
        })
      }
      return prisma.produto.update({ where: { id }, data: safeData, include: { categoria: true, variacoes: true } })
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

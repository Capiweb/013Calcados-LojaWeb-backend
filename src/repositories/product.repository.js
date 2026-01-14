import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createProduct = async (data) => {
  return prisma.produto.create({
    data,
    include: {
      categoria: true,
      variacoes: true,
    },
  })
}

export const findProductById = async (id) => {
  return prisma.produto.findUnique({
    where: { id },
    include: {
      categoria: true,
      variacoes: true,
    },
  })
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
  return prisma.produto.update({
    where: { id },
    data,
    include: {
      categoria: true,
      variacoes: true,
    },
  })
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

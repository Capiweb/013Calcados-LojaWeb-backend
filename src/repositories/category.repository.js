import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createCategory = async (data) => {
  return prisma.categoria.create({ data })
}

export const findCategoryById = async (id) => {
  return prisma.categoria.findUnique({ where: { id } })
}

export const findCategoryBySlug = async (slug) => {
  return prisma.categoria.findUnique({ where: { slug } })
}

export const findAllCategories = async () => {
  return prisma.categoria.findMany({ orderBy: { nome: 'asc' } })
}

export const updateCategory = async (id, data) => {
  return prisma.categoria.update({ where: { id }, data })
}

export const deleteCategory = async (id) => {
  return prisma.categoria.delete({ where: { id } })
}

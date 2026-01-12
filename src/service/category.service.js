import * as categoryRepo from '../repositories/category.repository.js'

export const createCategory = async ({ nome, slug }) => {
  // garantir slug único
  const existing = await categoryRepo.findCategoryBySlug(slug)
  if (existing) throw new Error('Slug já em uso')

  return categoryRepo.createCategory({ nome, slug })
}

export const listCategories = async () => {
  return categoryRepo.findAllCategories()
}

export const getCategory = async (id) => {
  return categoryRepo.findCategoryById(id)
}

export const updateCategory = async (id, data) => {
  if (data.slug) {
    const existing = await categoryRepo.findCategoryBySlug(data.slug)
    if (existing && existing.id !== id) throw new Error('Slug já em uso')
  }
  return categoryRepo.updateCategory(id, data)
}

export const deleteCategory = async (id) => {
  return categoryRepo.deleteCategory(id)
}

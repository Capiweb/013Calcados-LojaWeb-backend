import prisma from '../utils/prisma.js'

export const createEndereco = async (data) => {
  return prisma.endereco.create({ data })
}

export const findEnderecoById = async (id) => {
  return prisma.endereco.findUnique({ where: { id } })
}

export const findEnderecosByUsuario = async (usuarioId) => {
  return prisma.endereco.findMany({ where: { usuarioId }, orderBy: { criadoEm: 'desc' } })
}

export const updateEndereco = async (id, data) => {
  return prisma.endereco.update({ where: { id }, data })
}

export const deleteEndereco = async (id) => {
  return prisma.endereco.delete({ where: { id } })
}

export const verificaEnderecoDoUsuario = async (id, usuarioId) => {
  return prisma.endereco.findUnique({ where: { id, usuarioId } })
}

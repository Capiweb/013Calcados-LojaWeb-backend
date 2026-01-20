import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

console.log('[favorite.repository] Prisma instance created:', !!prisma)

/*Cria o vínculo de favorito entre um usuário e um produto. */
export const create = async (usuarioId, produtoId) => {
  return await prisma.favorito.create({
    data: {
      usuarioId,
      produtoId,
    },
  });
};

/*Busca uma relação específica para evitar duplicidade, utiliza a chave composta definida no schema*/
export const findSpecific = async (usuarioId, produtoId) => {
  console.log('[findSpecific] prisma:', !!prisma, 'usuarioId:', usuarioId, 'produtoId:', produtoId)
  return await prisma.favorito.findUnique({
    where: {
      usuarioId_produtoId: {
        usuarioId,
        produtoId,
      },
    },
  });
};

/*Lista todos os favoritos de um usuário com os dados dos produtos. O 'include' permite retornar o payload enxuto solicitado na tarefa.*/
export const findByUsuario = async (usuarioId) => {
  return await prisma.favorito.findMany({
    where: { usuarioId },
    include: {
      produto: true,
    },
  });
};

/* Remove um registro de favorito pelo ID*/
export const remove = async (id) => {
  return await prisma.favorito.delete({
    where: { id },
  });
};
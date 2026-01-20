import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// Prisma client instance

const ensureFavoritoModel = () => {
  if (!prisma || !prisma.favorito) {
    throw new Error('Prisma model `Favorito` is not available on the generated client.\n' +
      'Possíveis causas: você alterou o schema e não executou `npx prisma generate`,\n' +
      'ou o Prisma Client foi gerado com falha (verifique `DATABASE_URL`).\n' +
      'Solução: execute `npx prisma@6.16.2 generate` na raiz do projeto e reinicie o servidor.')
  }
}

/*Cria o vínculo de favorito entre um usuário e um produto. */
export const create = async (usuarioId, produtoId) => {
  ensureFavoritoModel()
  return await prisma.favorito.create({
    data: {
      usuarioId,
      produtoId,
    },
  });
};

/*Busca uma relação específica para evitar duplicidade, utiliza a chave composta definida no schema*/
export const findSpecific = async (usuarioId, produtoId) => {
  ensureFavoritoModel()
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
  ensureFavoritoModel()
  return await prisma.favorito.findMany({
    where: { usuarioId },
    include: {
      produto: true,
    },
  });
};

/* Remove um registro de favorito pelo ID*/
export const remove = async (id) => {
  ensureFavoritoModel()
  return await prisma.favorito.delete({
    where: { id },
  });
};
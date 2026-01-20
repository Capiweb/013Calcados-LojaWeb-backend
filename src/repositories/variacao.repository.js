import prisma from '../utils/prisma.js'

export const getAllVariacoes = async () => {
  return await prisma.produtoVariacao.findMany({
    include: {
      produto: {
        select: {
          nome: true,
          preco: true,
          imagemUrl: true,
        }
      }
    }
  })
}

export const getVariacaoById = async (id) => {
  return await prisma.produtoVariacao.findUnique({
    where: { id },
    include: {
      produto: true
    }
  })
}

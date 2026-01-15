import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getOrCreateCartByUser = async (usuarioId) => {
  let cart = await prisma.carrinho.findUnique({ where: { usuarioId } })
  if (!cart) {
    cart = await prisma.carrinho.create({ data: { usuarioId } })
  }
  return cart
}

export const getCartWithItems = async (usuarioId) => {
  try {
    return await prisma.carrinho.findUnique({
      where: { usuarioId },
      include: {
        itens: {
          include: {
            produtoVariacao: {
              include: { produto: true }
            }
          }
        }
      }
    })
  } catch (err) {
    // If the DB doesn't have the new 'cores' column yet (migration not applied),
    // Prisma may throw P2022 referencing ProdutoVariacao.cores. In that case,
    // retry with a safer select that avoids reading the missing column.
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      return prisma.carrinho.findUnique({
        where: { usuarioId },
        include: {
          itens: {
            include: {
              produtoVariacao: {
                select: {
                  id: true,
                  produtoId: true,
                  tipoTamanho: true,
                  tamanho: true,
                  estoque: true,
                  sku: true,
                  criadoEm: true
                },
                include: { produto: true }
              }
            }
          }
        }
      })
    }
    throw err
  }
}

export const addOrUpdateCartItem = async (usuarioId, produtoVariacaoId, quantidade) => {
  const cart = await getOrCreateCartByUser(usuarioId)

  const existing = await prisma.carrinhoItem.findFirst({
    where: { carrinhoId: cart.id, produtoVariacaoId }
  })

  if (existing) {
    return prisma.carrinhoItem.update({ where: { id: existing.id }, data: { quantidade } })
  }

  return prisma.carrinhoItem.create({ data: { carrinhoId: cart.id, produtoVariacaoId, quantidade } })
}

export const removeCartItem = async (id) => {
  return prisma.carrinhoItem.delete({ where: { id } })
}

export const clearCart = async (usuarioId) => {
  const cart = await prisma.carrinho.findUnique({ where: { usuarioId } })
  if (!cart) return
  await prisma.carrinhoItem.deleteMany({ where: { carrinhoId: cart.id } })
}

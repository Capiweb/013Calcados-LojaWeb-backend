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
  return prisma.carrinho.findUnique({
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

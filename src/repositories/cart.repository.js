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
                  criadoEm: true,
                  produto: {
                    select: {
                      id: true,
                      nome: true,
                      preco: true,
                      emPromocao: true,
                      precoPromocional: true
                    }
                  }
                }
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

  // verify quantity is positive
  const qty = Number(quantidade || 0)
  if (qty <= 0) throw new Error('Quantidade inválida')

  // check stock availability on produtoVariacao
  const variacao = await prisma.produtoVariacao.findUnique({ where: { id: produtoVariacaoId } })
  if (!variacao) throw new Error('Variação de produto não encontrada')
  if (Number(variacao.estoque || 0) < qty) throw new Error('Estoque insuficiente')

  const existing = await prisma.carrinhoItem.findFirst({ where: { carrinhoId: cart.id, produtoVariacaoId } })

  if (existing) {
    return prisma.carrinhoItem.update({ where: { id: existing.id }, data: { quantidade: qty } })
  }

  return prisma.carrinhoItem.create({ data: { carrinhoId: cart.id, produtoVariacaoId, quantidade: qty } })
}

export const removeCartItem = async (id) => {
  return prisma.carrinhoItem.delete({ where: { id } })
}

export const clearCart = async (usuarioId) => {
  if (!usuarioId) {
    throw new Error('usuarioId é obrigatório')
  }

  const cart = await prisma.carrinho.findUnique({
    where: { usuarioId }
  })

  if (!cart) return

  await prisma.carrinhoItem.deleteMany({
    where: { carrinhoId: cart.id }
  })
}


export const findAllCarts = async () => {
  try {
    return await prisma.carrinho.findMany({
      include: {
        usuario: true,
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
    // If the DB doesn't have the new 'cores' column yet, Prisma may throw P2022
    // referencing ProdutoVariacao.cores. In that case, retry with a safer select
    // that avoids reading the missing column.
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      return prisma.carrinho.findMany({
        include: {
          usuario: true,
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
                  criadoEm: true,
                  produto: {
                    select: {
                      id: true,
                      nome: true,
                      preco: true,
                      emPromocao: true,
                      precoPromocional: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    }
    throw err
  }
}

export const findCartById = async (id) => {
  try {
    return await prisma.carrinho.findUnique({
      where: { id },
      include: {
        usuario: true,
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
    if (err?.code === 'P2022' || (err?.message && err.message.includes('ProdutoVariacao.cores'))) {
      return prisma.carrinho.findUnique({
        where: { id },
        include: {
          usuario: true,
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
                  criadoEm: true,
                  produto: {
                    select: {
                      id: true,
                      nome: true,
                      preco: true,
                      emPromocao: true,
                      precoPromocional: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    }
    throw err
  }
}

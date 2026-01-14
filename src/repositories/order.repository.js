import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createOrder = async (data) => {
  return prisma.pedido.create({ data, include: { itens: true, pagamento: true } })
}

export const createOrderItem = async (data) => {
  return prisma.pedidoItem.create({ data })
}

export const linkPayment = async (pedidoId, pagamentoData) => {
  return prisma.pagamento.create({ data: { ...pagamentoData, pedidoId } })
}

export const getOrderById = async (id) => {
  return prisma.pedido.findUnique({ where: { id }, include: { itens: true, pagamento: true } })
}

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

export const findPaymentByPagamentoId = async (pagamentoId) => {
  return prisma.pagamento.findFirst({ where: { pagamentoId } })
}

export const updatePaymentStatus = async (pagamentoId, status) => {
  return prisma.pagamento.updateMany({ where: { pagamentoId }, data: { status } })
}

export const getOrderByPaymentId = async (pagamentoId) => {
  const pagamento = await prisma.pagamento.findFirst({ where: { pagamentoId }, include: { pedido: { include: { itens: true } } } })
  return pagamento?.pedido || null
}

export const findPaymentByPedidoId = async (pedidoId) => {
  return prisma.pagamento.findFirst({ where: { pedidoId } })
}

export const updatePaymentId = async (oldPagamentoId, newPagamentoId) => {
  return prisma.pagamento.updateMany({ where: { pagamentoId: oldPagamentoId }, data: { pagamentoId: newPagamentoId } })
}

export const createPaymentForPedido = async (pedidoId, pagamentoId, pagamentoData = {}) => {
  return prisma.pagamento.create({ data: { ...pagamentoData, pedidoId, pagamentoId } })
}

export const findAllOrders = async ({ where = {}, orderBy = { criadoEm: 'desc' }, include = { itens: true, pagamento: true, usuario: true } } = {}) => {
  try {
    return await prisma.pedido.findMany({ where, orderBy, include })
  } catch (err) {
    // If a validation error occurs (deployed DB/schema mismatch), retry with safer include
    if (err?.name === 'PrismaClientValidationError' || err?.code === 'P2022') {
      return prisma.pedido.findMany({ where, orderBy: { criadoEm: 'desc' }, include: { itens: true, pagamento: true } })
    }
    throw err
  }
}

export const deletePendingPaymentsOlderThan = async (cutoffDate) => {
  // cutoffDate should be a JS Date or ISO string
  return prisma.pagamento.deleteMany({ where: { status: 'PENDENTE', criadoEm: { lt: cutoffDate } } })
}

export const updateOrderStatus = async (pedidoId, status) => {
  return prisma.pedido.update({ where: { id: pedidoId }, data: { status } })
}

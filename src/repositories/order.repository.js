import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createOrder = async (data) => {
  return prisma.pedido.create({ data, include: { itens: true, pagamento: true } })
}

export const createOrderItem = async (data) => {
  return prisma.pedidoItem.create({ data })
}

export const updateOrderShipping = async (pedidoId, shippingData = {}) => {
  // shippingData can include: melhorenvio_shipment_id, melhorenvio_purchase_id, tracking_number, label_url, shipping_status, shipping_metadata
  return prisma.pedido.update({ where: { id: pedidoId }, data: { ...shippingData } })
}

export const linkPayment = async (pedidoId, pagamentoData) => {
  // Use upsert on pedidoId (which is unique) to avoid unique constraint errors when a placeholder
  // payment already exists for the pedido. If pedidoId is null/undefined, fallback to create without pedidoId.
  if (!pedidoId) {
    // create without pedidoId (rare) - we'll create a record with pagamentoId if provided
    return prisma.pagamento.create({ data: { ...pagamentoData } })
  }
  return prisma.pagamento.upsert({
    where: { pedidoId },
    update: { ...pagamentoData, pedidoId },
    create: { ...pagamentoData, pedidoId }
  })
}

export const markPaymentAsApprovedIfNotYet = async (pagamentoId) => {
  const result = await prisma.pagamento.updateMany({
    where: {
      pagamentoId,
      NOT: { status: 'APROVADO' },
    },
    data: {
      status: 'APROVADO',
    },
  })

  return result.count === 1
}


export const getOrderById = async (id) => {
  return prisma.pedido.findUnique({ where: { id }, include: { itens: true, pagamento: true } })
}

export const getOrderByPedidoId = async (pedidoId) => {
  if (!pedidoId) return null

  return prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      itens: true,
      pagamento: true,
      usuario: true
    }
  })
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
  // Use upsert to avoid unique constraint errors when a pagamento for the pedido already exists.
  // The model has pedidoId marked as @@unique, so upsert by pedidoId is safe.
  return prisma.pagamento.upsert({
    where: { pedidoId },
    update: { pagamentoId, ...pagamentoData },
    create: { ...pagamentoData, pedidoId, pagamentoId }
  })
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

export const updateOrderShippingInfo = async (pedidoId, shippingData = {}) => {
  // shippingData can include: melhorenvio_shipment_id, melhorenvio_purchase_id, tracking_number, label_url, shipping_status, shipping_metadata
  return prisma.pedido.update({ where: { id: pedidoId }, data: { ...shippingData } })
}

export const findPendingOrderByUserId = async (usuarioId) => {
  return prisma.pedido.findFirst({ where: { usuarioId, status: 'PENDENTE' }, include: { itens: true, pagamento: true } })
}

export const deleteOrderById = async (id) => {
  // delete pagamento, itens and pedido in safe order
  try {
    await prisma.pagamento.deleteMany({ where: { pedidoId: id } })
  } catch (e) {
    // ignore if no payment
  }
  try {
    await prisma.pedidoItem.deleteMany({ where: { pedidoId: id } })
  } catch (e) {
    // ignore
  }
  return prisma.pedido.delete({ where: { id } })
}

export const deleteOrdersByUserId = async (usuarioId) => {
  const pedidos = await prisma.pedido.findMany({ where: { usuarioId }, select: { id: true } })
  const ids = pedidos.map(p => p.id)
  if (ids.length === 0) return { count: 0 }
  await prisma.pagamento.deleteMany({ where: { pedidoId: { in: ids } } })
  await prisma.pedidoItem.deleteMany({ where: { pedidoId: { in: ids } } })
  const res = await prisma.pedido.deleteMany({ where: { id: { in: ids } } })
  return res
}

export const deletePendingOrdersOlderThan = async (cutoffDate) => {
  // cutoffDate should be an ISO string or Date
  const pedidos = await prisma.pedido.findMany({ where: { status: 'PENDENTE', criadoEm: { lt: cutoffDate } }, select: { id: true } })
  const ids = pedidos.map(p => p.id)
  if (ids.length === 0) return { count: 0 }
  // delete pagamentos, itens, then pedidos
  await prisma.pagamento.deleteMany({ where: { pedidoId: { in: ids } } })
  await prisma.pedidoItem.deleteMany({ where: { pedidoId: { in: ids } } })
  const res = await prisma.pedido.deleteMany({ where: { id: { in: ids } } })
  return res
}


export const deleteOrderItemsByPedidoId = async (pedidoId) => {
  return prisma.pedidoItem.deleteMany({ where: { pedidoId } })
}

export const updateOrderTotal = async (pedidoId, total) => {
  return prisma.pedido.update({ where: { id: pedidoId }, data: { total } })
}

export const deletePaymentByPagamentoId = async (pagamentoId) => {
  return prisma.pagamento.deleteMany({ where: { pagamentoId } })
}

export const deletePaymentsByUserId = async (usuarioId) => {
  const pedidos = await prisma.pedido.findMany({ where: { usuarioId }, select: { id: true } })
  const ids = pedidos.map(p => p.id)
  if (ids.length === 0) return { count: 0 }
  const res = await prisma.pagamento.deleteMany({ where: { pedidoId: { in: ids } } })
  return res
}

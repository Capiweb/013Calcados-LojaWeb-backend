import * as cartRepo from '../repositories/cart.repository.js'
import * as orderRepo from '../repositories/order.repository.js'
import fetch from 'node-fetch'
import * as productRepo from '../repositories/product.repository.js'
import { getIo } from '../utils/io.js'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const MP_BASE = 'https://api.mercadopago.com'

const maskToken = (t = '') => {
  if (!t) return '<missing>'
  const clean = String(t).trim()
  if (clean.length <= 12) return `${clean.slice(0, 3)}...${clean.slice(-3)}`
  return `${clean.slice(0, 6)}...${clean.slice(-6)}`
}

export const getCart = async (userId) => {
  return cartRepo.getCartWithItems(userId)
}

export const addItemToCart = async (userId, produtoVariacaoId, quantidade) => {
  return cartRepo.addOrUpdateCartItem(userId, produtoVariacaoId, quantidade)
}

export const removeItemFromCart = async (itemId) => {
  return cartRepo.removeCartItem(itemId)
}

export const createOrderFromCart = async (userId, endereco) => {
  const cart = await cartRepo.getCartWithItems(userId)
  if (!cart || !cart.itens || cart.itens.length === 0) throw new Error('Carrinho vazio')

  // calcular total
  let total = 0
  const itensData = cart.itens.map((item) => {
    const preco = Number(item.produtoVariacao.produto.preco)
    total += preco * item.quantidade
    return {
      produtoVariacaoId: item.produtoVariacaoId,
      quantidade: item.quantidade,
      preco: preco,
    }
  })

  // criar pedido
  const pedido = await orderRepo.createOrder({
    usuarioId: userId,
    total,
    rua: endereco.rua,
    numero: endereco.numero,
    complemento: endereco.complemento || null,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    estado: endereco.estado,
    cep: endereco.cep,
  })

  // criar itens do pedido
  for (const it of itensData) {
    await orderRepo.createOrderItem({
      pedidoId: pedido.id,
      produtoVariacaoId: it.produtoVariacaoId,
      quantidade: it.quantidade,
      preco: it.preco,
    })
  }

  // return pedido with itens included for downstream use
  const fullPedido = await orderRepo.getOrderById(pedido.id)
  return fullPedido
}


export const createMercadoPagoPreference = async (pedido) => {
  if (!MP_ACCESS_TOKEN) throw new Error('MP_ACCESS_TOKEN não configurado')

  const itens = (pedido.itens || []).map((it) => ({
    title: `Produto ${it.produtoVariacaoId}`,
    quantity: it.quantidade,
    unit_price: Number(it.preco),
    currency_id: 'BRL'
  }))

  const body = {
    items: itens,
    external_reference: pedido.id || undefined,
    back_urls: {
      success: process.env.MP_BACK_URL_SUCCESS || 'https://seusite.com/success',
      failure: process.env.MP_BACK_URL_FAILURE || 'https://seusite.com/failure',
      pending: process.env.MP_BACK_URL_PENDING || 'https://seusite.com/pending'
    },
    notification_url: process.env.MP_NOTIFICATION_URL || undefined
  }

  const url = `${MP_BASE}/checkout/preferences`
  // Debug logs (temporarily) - do not commit secrets to public logs
  try {
    console.log('MP request url:', url)
    console.log('MP request headers: Authorization: Bearer <REDACTED>, Content-Type: application/json')
    console.log('MP request body:', JSON.stringify(body, null, 2))
  } catch (e) {
    // ignore logging errors
  }

  // quick token check to surface clearer error if token is invalid
  if (MP_ACCESS_TOKEN) {
    try {
  const check = await fetch(`${MP_BASE}/users/me`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
      if (!check.ok) {
        const txt = await check.text()
        // Provide a friendly, actionable hint when MP returns 404 for token check
        let hint = ''
        if (check.status === 404) {
          hint = ` Possible causes: you may be using the Public Key (frontend) instead of the Access Token, the token belongs to a different environment/account, or the account isn't enabled for this API. Check Mercado Pago Dashboard > Credentials and copy the Access Token (not the Public Key).`
        }
        throw new Error(`MP token check failed: ${check.status} ${txt}. Token(${maskToken(MP_ACCESS_TOKEN)})${hint}`)
      }
    } catch (err) {
      // rethrow with context and masked token
      if (String(err.message).includes('MP token check failed')) throw err
      throw new Error(`MP token validation error: ${err.message}. Token=${maskToken(MP_ACCESS_TOKEN)}`)
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`MP error: ${res.status} ${txt}`)
  }

  const data = await res.json()
  return data
}

export const linkPaymentToOrder = async (pedidoId, pagamentoData) => {
  return orderRepo.linkPayment(pedidoId, pagamentoData)
}

export const handleMpNotification = async (body) => {
  // Exemplo de body com payment id -> buscar payment info no MP e atualizar status
  // Implementação simples: receber { id: payment_id }
  const paymentId = body?.data?.id || body?.id || null
  if (!paymentId) throw new Error('payment id not provided')

  // consultar MP para obter status
  const res = await fetch(`${MP_BASE}/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
  })
  if (!res.ok) throw new Error('MP consulta failed')
  const data = await res.json()

  // exemplo: data.status -> 'approved' ou 'pending' ou 'rejected'
  const statusMap = {
    approved: 'APROVADO',
    pending: 'PENDENTE',
    rejected: 'REJEITADO',
    refunded: 'REEMBOLSADO'
  }

  const mpStatus = data.status
  const mapped = statusMap[mpStatus] || 'PENDENTE'

  // criar ou atualizar registro de pagamento no DB
  // tentar localizar registro de pagamento já criado (vinculado à preference no checkout)
  const existingByPagamentoId = await orderRepo.findPaymentByPagamentoId(paymentId)

  // tentar buscar pedido via payment object (external_reference or preference_id)
  const pedidoIdFromMp = data.external_reference || data.preference_id || null

  if (existingByPagamentoId) {
    // já existe um registro com este paymentId -> apenas atualizar status
    await orderRepo.updatePaymentStatus(paymentId, mapped)
    // emit socket event for order update if possible
    try {
      const io = getIo()
      const pedido = await orderRepo.getOrderByPaymentId(paymentId)
      if (io && pedido) io.to(`order:${pedido.id}`).emit('order.updated', { orderId: pedido.id, status: mapped })
    } catch (e) {
      console.warn('socket emit failed (existingByPagamentoId)', e?.message || e)
    }
  } else if (pedidoIdFromMp) {
    // se MP retornou external_reference (pedidoId) ou preference_id, tente vincular
    // buscar pagamento já atrelado ao pedido (por exemplo, preferência criada no checkout)
    const existingByPedido = await orderRepo.findPaymentByPedidoId(pedidoIdFromMp)
    if (existingByPedido) {
      // atualizar o pagamento existente para registrar o novo pagamentoId e status
      await orderRepo.updatePaymentId(existingByPedido.pagamentoId, paymentId)
      await orderRepo.updatePaymentStatus(paymentId, mapped)
      try {
        const io = getIo()
        if (io && pedidoIdFromMp) io.to(`order:${pedidoIdFromMp}`).emit('order.updated', { orderId: pedidoIdFromMp, status: mapped })
      } catch (e) {
        console.warn('socket emit failed (existingByPedido)', e?.message || e)
      }
    } else {
      // criar novo pagamento vinculado ao pedido
      await orderRepo.createPaymentForPedido(pedidoIdFromMp, paymentId, { provedor: 'mercado_pago', status: mapped })
      try {
        const io = getIo()
        if (io && pedidoIdFromMp) io.to(`order:${pedidoIdFromMp}`).emit('order.updated', { orderId: pedidoIdFromMp, status: mapped })
      } catch (e) {
        console.warn('socket emit failed (createPaymentForPedido)', e?.message || e)
      }
    }
  } else {
    // último recurso: criar registro de pagamento sem pedido (será necessário reconciliar manualmente)
    await orderRepo.linkPayment(null, { provedor: 'mercado_pago', pagamentoId: paymentId, status: mapped })
  }

  // quando aprovado, decrementar estoque dos itens do pedido
  if (mapped === 'APROVADO') {
    // buscar pedido relacionado ao pagamento
    const pedido = await orderRepo.getOrderByPaymentId(paymentId)
    if (pedido && pedido.itens) {
      for (const it of pedido.itens) {
        // decrementStock returns number of rows affected
        await productRepo.decrementStock(it.produtoVariacaoId, it.quantidade)
      }
    }
      // emit socket event for approval
      try {
        const io = getIo()
        if (io && pedido) io.to(`order:${pedido.id}`).emit('order.updated', { orderId: pedido.id, status: mapped })
      } catch (e) {
        console.warn('socket emit failed (APROVADO)', e?.message || e)
      }
  }

  return { ok: true, mpStatus: data.status }
}

export const listAllOrders = async (filters = {}) => {
  // filters can include where conditions; default returns all orders ordered by createdAt desc
  return orderRepo.findAllOrders(filters)
}

export const getOrderById = async (id) => {
  return orderRepo.getOrderById(id)
}

export const listAllCarts = async () => {
  return cartRepo.findAllCarts()
}

export const getCartById = async (id) => {
  return cartRepo.findCartById(id)
}

export const deletePendingPaymentsOlderThan = async (hours = 24) => {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
  return orderRepo.deletePendingPaymentsOlderThan(cutoff.toISOString())
}

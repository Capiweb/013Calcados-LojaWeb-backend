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

  const xRequestId = res.headers && typeof res.headers.get === 'function' ? res.headers.get('x-request-id') : undefined
  const rawText = await res.text()
  if (!res.ok) {
    console.error(`MP create preference error: status=${res.status} x-request-id=${xRequestId} body=${rawText}`)
    throw new Error(`MP error: ${res.status} ${rawText}`)
  }

  let data
  try {
    data = JSON.parse(rawText)
  } catch (e) {
    console.warn('MP create preference: failed to parse JSON, raw body:', rawText)
    throw new Error('MP create preference: invalid JSON response')
  }

  // Debug log: preference id and init_point if present
  try {
    console.log(`MP preference created: preference_id=${data.id || data.preference_id} init_point=${data.init_point || data.sandbox_init_point} x-request-id=${xRequestId}`)
  } catch (e) {
    // ignore
  }

  return data
}

export const linkPaymentToOrder = async (pedidoId, pagamentoData) => {
  return orderRepo.linkPayment(pedidoId, pagamentoData)
}

export const updatePaymentId = async (oldPagamentoId, newPagamentoId) => {
  return orderRepo.updatePaymentId(oldPagamentoId, newPagamentoId)
}

export const handleMpNotification = async (body) => {
  // Exemplo de body com payment id -> buscar payment info no MP e atualizar status
  // Implementação simples: receber { id: payment_id }
  const incomingId = body?.data?.id || body?.id || null
  if (!incomingId) throw new Error('payment id not provided')

  if (!MP_ACCESS_TOKEN) {
    const msg = `MP_ACCESS_TOKEN is not configured; cannot query payment ${incomingId}`
    console.error(msg)
    throw new Error(msg)
  }

  // Helper to process a payment by its id: fetch payment data and run existing logic
  const processPaymentById = async (paymentIdToProcess) => {
    // fetch payment
    let r
    try {
      const paymentUrl = `${MP_BASE}/v1/payments/${paymentIdToProcess}`
      console.log(`MP GET ${paymentUrl} Authorization: Bearer ${maskToken(MP_ACCESS_TOKEN)}`)
      r = await fetch(paymentUrl, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
    } catch (err) {
      console.error(`MP request network error for payment ${paymentIdToProcess}:`, err?.message || err)
      throw new Error('MP consulta failed')
    }
    if (!r.ok) {
      let txt = ''
      try { txt = await r.text() } catch (e) { txt = '<failed to read response body>' }
      console.error(`MP consulta returned error for payment ${paymentIdToProcess}: status=${r.status} body=${txt} token=${maskToken(MP_ACCESS_TOKEN)}`)
      // If MP reports 404 (resource not found) we won't attempt other MP endpoints here.
      // The payments GET is our single source of truth for status updates. Return a
      // structured result indicating not-found so the caller (webhook) can decide.
      if (r.status === 404) return { ok: false, notFound: true, status: r.status, body: txt }
      throw new Error(`MP consulta failed: ${r.status} ${txt}`)
    }
    const paymentData = await r.json()

    // continue with existing mapping and DB logic using paymentData
    const statusMap = {
      approved: 'APROVADO',
      pending: 'PENDENTE',
      rejected: 'REJEITADO',
      refunded: 'REEMBOLSADO'
    }
    const mpStatus = paymentData.status
    const mapped = statusMap[mpStatus] || 'PENDENTE'

    const pagamentoId = paymentIdToProcess

    const existingByPagamentoId = await orderRepo.findPaymentByPagamentoId(pagamentoId)
  // Prefer explicit linkers: external_reference, preference_id or merchant order id
  const pedidoIdFromMp = paymentData.external_reference || paymentData.preference_id || (paymentData.order && paymentData.order.id) || null

    if (existingByPagamentoId) {
      await orderRepo.updatePaymentStatus(pagamentoId, mapped)
      try {
        const io = getIo()
        const pedido = await orderRepo.getOrderByPaymentId(pagamentoId)
        if (io && pedido) io.to(`order:${pedido.id}`).emit('order.updated', { orderId: pedido.id, status: mapped })
      } catch (e) { console.warn('socket emit failed (existingByPagamentoId)', e?.message || e) }
    } else if (pedidoIdFromMp) {
      const existingByPedido = await orderRepo.findPaymentByPedidoId(pedidoIdFromMp)
      if (existingByPedido) {
        await orderRepo.updatePaymentId(existingByPedido.pagamentoId, pagamentoId)
        await orderRepo.updatePaymentStatus(pagamentoId, mapped)
        try { const io = getIo(); if (io && pedidoIdFromMp) io.to(`order:${pedidoIdFromMp}`).emit('order.updated', { orderId: pedidoIdFromMp, status: mapped }) } catch (e) { console.warn('socket emit failed (existingByPedido)', e?.message || e) }
      } else {
        await orderRepo.createPaymentForPedido(pedidoIdFromMp, pagamentoId, { provedor: 'mercado_pago', status: mapped })
        try { const io = getIo(); if (io && pedidoIdFromMp) io.to(`order:${pedidoIdFromMp}`).emit('order.updated', { orderId: pedidoIdFromMp, status: mapped }) } catch (e) { console.warn('socket emit failed (createPaymentForPedido)', e?.message || e) }
      }
    } else {
      await orderRepo.linkPayment(null, { provedor: 'mercado_pago', pagamentoId, status: mapped })
    }

    if (mapped === 'APROVADO') {
      const pedido = await orderRepo.getOrderByPaymentId(pagamentoId)
      if (pedido && pedido.itens) {
        for (const it of pedido.itens) {
          await productRepo.decrementStock(it.produtoVariacaoId, it.quantidade)
        }
      }
      try { const io = getIo(); if (io && pedido) io.to(`order:${pedido.id}`).emit('order.updated', { orderId: pedido.id, status: mapped }) } catch (e) { console.warn('socket emit failed (APROVADO)', e?.message || e) }
    }
    return { ok: true, mpStatus: paymentData.status }
  }

  // First, try to treat incomingId as a payment id
  try {
    const resProcess = await processPaymentById(incomingId)
    if (resProcess && resProcess.notFound) {
      console.log(`handleMpNotification: payment ${incomingId} not found (payments GET returned 404). Skipping fallback searches as configured.`)
      return { ok: true, note: 'payment_not_found' }
    }
    return resProcess
  } catch (err) {
    // propagate unexpected errors
    throw err
  }
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

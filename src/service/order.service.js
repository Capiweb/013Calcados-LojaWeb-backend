import * as cartRepo from '../repositories/cart.repository.js'
import * as orderRepo from '../repositories/order.repository.js'
import fetch from 'node-fetch'
import * as productRepo from '../repositories/product.repository.js'
import { getIo } from '../utils/io.js'
import * as shippingService from './shipping.service.js'
import { findUserById } from '../repositories/user.repository.js'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const MP_BASE = 'https://api.mercadopago.com'

const maskToken = (t = '') => {
  if (!t) return '<missing>'
  const clean = String(t).trim()
  if (clean.length <= 12) return `${clean.slice(0, 3)}...${clean.slice(-3)}`
  return `${clean.slice(0, 6)}...${clean.slice(-6)}`
}

export const getCart = async (userId) => {
  const cart = await cartRepo.getCartWithItems(userId)
  if (!cart) return cart
  // calcular total do carrinho (unit_price * quantidade)
  let total = 0
  try {
    for (const it of (cart.itens || [])) {
      const unit = Number(it.preco ?? it.produtoVariacao?.produto?.preco ?? 0)
      const qty = Number(it.quantidade || 0)
      total += unit * qty
    }
  } catch (e) {
    // se algo falhar no cálculo, não quebremos a resposta — apenas log e retornar sem total
    console.warn('getCart: falha ao calcular total do carrinho', e?.message || e)
  }
  // retornar total com duas casas
  return { ...cart, total: Number(total.toFixed(2)) }
}

export const addItemToCart = async (userId, produtoVariacaoId, quantidade) => {
  return cartRepo.addOrUpdateCartItem(userId, produtoVariacaoId, quantidade)
}

export const removeItemFromCart = async (itemId) => {
  return cartRepo.removeCartItem(itemId)
}

//endereco.cep
export const createOrderFromCart = async (userId, endereco, melhorenvio_service_id) => {
  const cart = await cartRepo.getCartWithItems(userId)

  if (!cart || !cart.itens || cart.itens.length === 0) throw new Error('Carrinho vazio')

  if (!melhorenvio_service_id) throw new Error('É preciso selecionar um serviço de entrega')

  // Calculate shipping using Melhor Envio
  // The service now fetches the cart internally using userId and uses the destination postal code
  const shippingOptions = await shippingService.calculateShipping(userId, endereco.cep)
  const selectedOption = shippingOptions.find(opt => opt.id === melhorenvio_service_id)

  if (!selectedOption) {
    throw new Error(`Serviço de entrega inválido ou indisponível (ID: ${melhorenvio_service_id})`)
  }

  // normalize frete value from selected option
  const freteValue = Number(selectedOption.price || 0)

  // If a pending order already exists for this user, reuse it instead of creating a new one
  const existingPending = await orderRepo.findPendingOrderByUserId(userId)
  if (existingPending) {
    // Re-fetch the pedido to ensure its status didn't change concurrently (e.g., payment processed)
    try {
      const fresh = await orderRepo.getOrderById(existingPending.id)
      if (!fresh || fresh.status !== 'PENDENTE') {
        console.log(`createOrderFromCart: pedido ${existingPending.id} já não está mais PENDENTE (status=${fresh?.status}). Não será reusado; criando novo pedido.`)
      } else {
        console.log(`createOrderFromCart: reusando pedido PENDENTE existente ${existingPending.id} para o usuário ${userId}`)
        // ensure items reflect current cart: remove old items and recreate from cart to keep totals in sync
        // For simplicity we'll delete existing items and recreate
        try {
          await Promise.all((existingPending.itens || []).map(it => orderRepo.pedidoItem && orderRepo.pedidoItem))
        } catch (e) {
          // ignore; not critical
        }
        // Recalculate total and update items
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
        // remove existing items
        try { await orderRepo.deleteOrderItemsByPedidoId(existingPending.id) } catch (e) { /* noop */ }
        for (const it of itensData) {
          await orderRepo.createOrderItem({ pedidoId: existingPending.id, produtoVariacaoId: it.produtoVariacaoId, quantidade: it.quantidade, preco: it.preco })
        }
        // update total and shipping if needed
        try { await orderRepo.updateOrderStatus(existingPending.id, existingPending.status) } catch (e) { /* noop */ }
        // include frete when updating total
        try {
          await orderRepo.updateOrderTotal(existingPending.id, Number((total + freteValue).toFixed(2)))
        } catch (e) {
          console.warn('createOrderFromCart: falha ao atualizar total com frete para pedido pendente', e?.message || e)
        }

        try {
          await orderRepo.updateOrderShipping(existingPending.id, melhorenvio_service_id)
        } catch (e) {
          console.warn('createOrderFromCart: falha ao atualizar frete para pedido pendente', e?.message || e)
        }

        const full = await orderRepo.getOrderById(existingPending.id)
        // attach frete to returned object so controller will include it in MP preference
        return { ...full, frete: freteValue }
      }
    } catch (err) {
      console.warn('createOrderFromCart: falha ao validar pedido pendente existente, continuando para criar novo pedido', err?.message || err)
      // fallthrough to create new pedido
    }
  }

  // calcular total (subtotal dos items)
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

  // add frete to total (frete opcional passado pelo checkout)
  if (freteValue && !isNaN(freteValue)) {
    total += freteValue
  }

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
    melhorenvio_service_id
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
  // attach frete to returned object for controller to use when creating MP preference
  return { ...fullPedido, frete: freteValue }
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

  // // Helper to process a payment by its id: fetch payment data and run existing logic
  // const processPaymentById = async (paymentIdToProcess) => {
  //   // fetch payment
  //   let r
  //   try {
  //     const paymentUrl = `${MP_BASE}/v1/payments/${paymentIdToProcess}`
  //     console.log(`MP: solicitando pagamento (GET) ${paymentUrl} — token: ${maskToken(MP_ACCESS_TOKEN)}`)
  //     r = await fetch(paymentUrl, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
  //   } catch (err) {
  //     console.error(`MP request network error for payment ${paymentIdToProcess}:`, err?.message || err)
  //     throw new Error('MP consulta failed')
  //   }
  //   if (!r.ok) {
  //     let txt = ''
  //     try { txt = await r.text() } catch (e) { txt = '<failed to read response body>' }
  //     console.error(`MP consulta returned error for payment ${paymentIdToProcess}: status=${r.status} body=${txt} token=${maskToken(MP_ACCESS_TOKEN)}`)
  //     // If MP reports 404 (resource not found) we won't attempt other MP endpoints here.
  //     // The payments GET is our single source of truth for status updates. Return a
  //     // structured result indicating not-found so the caller (webhook) can decide.
  //     if (r.status === 404) return { ok: false, notFound: true, status: r.status, body: txt }
  //     throw new Error(`MP consulta failed: ${r.status} ${txt}`)
  //   }
  //   const paymentData = await r.json()

  //   // continue with existing mapping and DB logic using paymentData
  //   const statusMap = {
  //     approved: 'APROVADO',
  //     pending: 'PENDENTE',
  //     rejected: 'REJEITADO',
  //     refunded: 'REEMBOLSADO'
  //   }
  //   const mpStatus = paymentData.status
  //   const mapped = statusMap[mpStatus] || 'PENDENTE'

  //   const pagamentoId = paymentIdToProcess

  //   // helper: safely decrement stock for a pedido; if any item fails to decrement
  //   // we rollback previous decrements and return { ok: false, reason }
  //   const safeDecrementStockForPedido = async (pedido) => {
  //     const decremented = []
  //     try {
  //       for (const it of (pedido.itens || [])) {
  //         const res = await productRepo.decrementStock(it.produtoVariacaoId, it.quantidade)
  //         // Prisma updateMany returns { count: n } in some contexts, or the raw result
  //         const affected = res?.count ?? res
  //         if (!affected || affected === 0) {
  //           // rollback previous
  //           for (const prev of decremented) {
  //             try { await productRepo.incrementStock(prev.produtoVariacaoId, prev.quantidade) } catch (e) { console.error('rollback increment failed', e) }
  //           }
  //           return { ok: false, reason: `estoque insuficiente para variacao ${it.produtoVariacaoId}` }
  //         }
  //         decremented.push({ produtoVariacaoId: it.produtoVariacaoId, quantidade: it.quantidade })
  //       }
  //       return { ok: true }
  //     } catch (e) {
  //       // rollback on unexpected error
  //       for (const prev of decremented) {
  //         try { await productRepo.incrementStock(prev.produtoVariacaoId, prev.quantidade) } catch (err) { console.error('rollback increment failed', err) }
  //       }
  //       return { ok: false, reason: e?.message || e }
  //     }
  //   }

  //   const existingByPagamentoId = await orderRepo.findPaymentByPagamentoId(pagamentoId)
  //   // Prefer explicit linkers: external_reference, preference_id or merchant order id
  //   const pedidoIdFromMp = paymentData.external_reference || paymentData.preference_id || (paymentData.order && paymentData.order.id) || null

  //   // Reconciliation: if MP returned a pedido identifier (external_reference / preference_id / order.id)
  //   // ensure the DB has a pagamento record linked to that pedido with the correct pagamentoId and status.
  //   if (pedidoIdFromMp) {
  //     try {
  //       const existingByPedidoRecon = await orderRepo.findPaymentByPedidoId(pedidoIdFromMp)
  //       // capture previous status before we update/create records so we can decide whether to decrement
  //       const previousPagamentoStatus = existingByPedidoRecon?.status || null
  //       if (existingByPedidoRecon) {
  //         if (existingByPedidoRecon.pagamentoId !== pagamentoId) {
  //           console.log(`reconciliation: updating pagamentoId for pedido ${pedidoIdFromMp}: ${existingByPedidoRecon.pagamentoId} -> ${pagamentoId}`)
  //           await orderRepo.updatePaymentId(existingByPedidoRecon.pagamentoId, pagamentoId)
  //         } else {
  //           console.log(`reconciliation: pagamento already matches for pedido ${pedidoIdFromMp} -> ${pagamentoId}`)
  //         }
  //       } else {
  //         console.log(`reconciliation: creating pagamento for pedido ${pedidoIdFromMp} pagamentoId=${pagamentoId} status=${mapped}`)
  //         await orderRepo.createPaymentForPedido(pedidoIdFromMp, pagamentoId, { provedor: 'mercado_pago', status: mapped })
  //       }

  //       // Update payment status (idempotent)
  //       await orderRepo.updatePaymentStatus(pagamentoId, mapped)

  //       // If approved, mark order as PAGO
  //       if (mapped === 'APROVADO') {
  //         console.log(`reconciliation: marking pedido ${pedidoIdFromMp} as PAGO`)
  //         try { await orderRepo.updateOrderStatus(pedidoIdFromMp, 'PAGO') } catch (e) { console.warn('reconciliation: updateOrderStatus failed', e?.message || e) }
  //       }

  //       // emit socket event
  //       try { const io = getIo(); if (io) io.to(`order:${pedidoIdFromMp}`).emit('order.updated', { orderId: pedidoIdFromMp, status: mapped }) } catch (e) { console.warn('socket emit failed (reconciliation)', e?.message || e) }

  //       // decrement stock if approved
  //       if (mapped === 'APROVADO') {
  //         try {
  //           const pedido = await orderRepo.getOrderByPaymentId(pagamentoId)
  //           // Decide whether to decrement based on previous pagamento status (prior to our updates).
  //           // If previousPagamentoStatus was already 'APROVADO', skip. Otherwise, proceed.
  //           let shouldDecrement = true
  //           try {
  //             if (previousPagamentoStatus === 'APROVADO') {
  //               shouldDecrement = false
  //               console.log(`reconciliation: skipping stock decrement for pedido ${pedidoIdFromMp} because previous payment status was APROVADO`)
  //             }
  //           } catch (e) { /* ignore and proceed */ }
  //           if (shouldDecrement && pedido && pedido.itens) {
  //             const dres = await safeDecrementStockForPedido(pedido)
  //             if (!dres.ok) {
  //               console.error('reconciliation: safe decrement failed:', dres.reason)
  //               // update payment status to REJEITADO or PENDENTE and notify
  //               try { await orderRepo.updatePaymentStatus(pagamentoId, 'REJEITADO') } catch (e) { console.warn('failed to update payment status after decrement failure', e?.message || e) }
  //               return { ok: false, mpStatus: paymentData.status, reason: dres.reason }
  //             }
  //           }
  //           // clear user's cart if we can
  //           try { if (pedido && pedido.usuarioId) await cartRepo.clearCart(pedido.usuarioId) } catch (e) { /* ignore */ }
  //         } catch (e) { console.warn('reconciliation: decrement stock failed', e?.message || e) }
  //       }

  //       return { ok: true, mpStatus: paymentData.status, reconciled: true, pedidoId: pedidoIdFromMp }
  //     } catch (e) {
  //       console.error('reconciliation failed:', e?.message || e)
  //       // continue with existing flow if reconciliation failed
  //     }
  //   }

  //   if (existingByPagamentoId) {
  //     console.log(`processPaymentById: existing payment record found for pagamentoId=${pagamentoId}, updating status -> ${mapped}`)
  //     await orderRepo.updatePaymentStatus(pagamentoId, mapped)
  //     try {
  //       const io = getIo()
  //       const pedido = await orderRepo.getOrderByPaymentId(pagamentoId)
  //       if (mapped === 'APROVADO' && pedido) {
  //         console.log(`processPaymentById: marking pedido ${pedido.id} as PAGO`)
  //         // only decrement stock/create PAGO if previous pagamento status wasn't already APROVADO
  //         const prevStatus = existingByPagamentoId?.status
  //         if (prevStatus !== 'APROVADO') {
  //           try {
  //             const dres = await safeDecrementStockForPedido(pedido)
  //             if (!dres.ok) {
  //               console.error('processPaymentById: safe decrement failed:', dres.reason)
  //               await orderRepo.updatePaymentStatus(pagamentoId, 'REJEITADO')
  //               return { ok: false, mpStatus: paymentData.status, reason: dres.reason }
  //             }
  //           } catch (e) { console.warn('processPaymentById: decrement stock failed', e?.message || e) }
  //         } else {
  //           console.log(`processPaymentById: previous payment status was APROVADO for pagamentoId=${pagamentoId}, skipping decrement`)
  //         }
  //         await orderRepo.updateOrderStatus(pedido.id, 'PAGO')
  //         // start shipment/job in background
  //         try { setImmediate(() => startShipmentPurchaseJob(pedido.id)) } catch (e) { console.warn('failed to start shipment job', e?.message || e) }
  //       }
  //       if (io && pedido) io.to(`order:${pedido.id}`).emit('order.updated', { orderId: pedido.id, status: mapped })
  //     } catch (e) { console.warn('socket emit failed (existingByPagamentoId)', e?.message || e) }
  //   } else if (pedidoIdFromMp) {
  //     const existingByPedido = await orderRepo.findPaymentByPedidoId(pedidoIdFromMp)
  //     if (existingByPedido) {
  //       console.log(`processPaymentById: found placeholder payment for pedido ${pedidoIdFromMp}, replacing pagamentoId ${existingByPedido.pagamentoId} -> ${pagamentoId} and updating status ${mapped}`)
  //       await orderRepo.updatePaymentId(existingByPedido.pagamentoId, pagamentoId)
  //       await orderRepo.updatePaymentStatus(pagamentoId, mapped)
  //       try { const io = getIo(); if (io && pedidoIdFromMp) io.to(`order:${pedidoIdFromMp}`).emit('order.updated', { orderId: pedidoIdFromMp, status: mapped }) } catch (e) { console.warn('socket emit failed (existingByPedido)', e?.message || e) }
  //       if (mapped === 'APROVADO') {
  //         console.log(`processPaymentById: marking pedido ${pedidoIdFromMp} as PAGO`)
  //         await orderRepo.updateOrderStatus(pedidoIdFromMp, 'PAGO')
  //         try { setImmediate(() => startShipmentPurchaseJob(pedidoIdFromMp)) } catch (e) { console.warn('failed to start shipment job', e?.message || e) }
  //       }
  //     } else {
  //       console.log(`processPaymentById: creating new pagamento for pedido ${pedidoIdFromMp} pagamentoId=${pagamentoId} status=${mapped}`)
  //       await orderRepo.createPaymentForPedido(pedidoIdFromMp, pagamentoId, { provedor: 'mercado_pago', status: mapped })
  //       try { const io = getIo(); if (io && pedidoIdFromMp) io.to(`order:${pedidoIdFromMp}`).emit('order.updated', { orderId: pedidoIdFromMp, status: mapped }) } catch (e) { console.warn('socket emit failed (createPaymentForPedido)', e?.message || e) }
  //       if (mapped === 'APROVADO') {
  //         console.log(`processPaymentById: marking pedido ${pedidoIdFromMp} as PAGO (new pagamento)`)
  //         await orderRepo.updateOrderStatus(pedidoIdFromMp, 'PAGO')
  //         try { setImmediate(() => startShipmentPurchaseJob(pedidoIdFromMp)) } catch (e) { console.warn('failed to start shipment job', e?.message || e) }
  //       }
  //     }
  //   } else {
  //     // No pedido id returned by MP and no existing payment found. We avoid creating an orphan pagamento
  //     // without a pedidoId because the Pagamento model enforces pedidoId @unique and application code
  //     // expects pagamentos to be tied to pedidos. Log and return.
  //     console.warn(`processPaymentById: payment ${pagamentoId} has no associated pedido (external_reference/preference_id/order.id); skipping creation of orphan pagamento`)
  //   }

  //   if (mapped === 'APROVADO') {
  //     const pedido = await orderRepo.getOrderByPaymentId(pagamentoId)
  //     // check if we already decremented stock for this pedido
  //     let shouldDecrementFinal = true
  //     try {
  //       if (pedido && pedido.id) {
  //         const existingPagFinal = await orderRepo.findPaymentByPedidoId(pedido.id)
  //         if (existingPagFinal && existingPagFinal.status === 'APROVADO') {
  //           shouldDecrementFinal = false
  //           console.log(`processPaymentById: skipping final stock decrement for pedido ${pedido.id} because payment already APROVADO`)
  //         }
  //       }
  //     } catch (e) { /* ignore check errors */ }
  //     if (shouldDecrementFinal && pedido && pedido.itens) {
  //       const dres = await safeDecrementStockForPedido(pedido)
  //       if (!dres.ok) {
  //         console.error('processPaymentById final: safe decrement failed:', dres.reason)
  //         await orderRepo.updatePaymentStatus(pagamentoId, 'REJEITADO')
  //         return { ok: false, mpStatus: paymentData.status, reason: dres.reason }
  //       }
  //     }
  //     if (pedido) {
  //       console.log(`processPaymentById: ensuring pedido ${pedido.id} marked as PAGO (APROVADO)`)
  //       await orderRepo.updateOrderStatus(pedido.id, 'PAGO')
  //       try { setImmediate(() => startShipmentPurchaseJob(pedido.id)) } catch (e) { console.warn('failed to start shipment job', e?.message || e) }
  //     }
  //     try { const io = getIo(); if (io && pedido) io.to(`order:${pedido.id}`).emit('order.updated', { orderId: pedido.id, status: mapped }) } catch (e) { console.warn('socket emit failed (APROVADO)', e?.message || e) }
  //     // clear user's cart after successful stock decrement
  //     try { if (pedido && pedido.usuarioId) await cartRepo.clearCart(pedido.usuarioId) } catch (e) { console.warn('clearCart failed', e?.message || e) }
  //   }
  //   return { ok: true, mpStatus: paymentData.status }
  // }

  const safeDecrementStockForPedido = async (pedido) => {
    const decremented = []
    try {
      for (const it of (pedido.itens || [])) {
        const res = await productRepo.decrementStock(it.produtoVariacaoId, it.quantidade)
        // Prisma updateMany returns { count: n } in some contexts, or the raw result
        const affected = res?.count ?? res
        if (!affected || affected === 0) {
          // rollback previous
          for (const prev of decremented) {
            try { await productRepo.incrementStock(prev.produtoVariacaoId, prev.quantidade) } catch (e) { console.error('rollback increment failed', e) }
          }
          return { ok: false, reason: `estoque insuficiente para variacao ${it.produtoVariacaoId}` }
        }
        decremented.push({ produtoVariacaoId: it.produtoVariacaoId, quantidade: it.quantidade })
      }
      return { ok: true }
    } catch (e) {
      // rollback on unexpected error
      for (const prev of decremented) {
        try { await productRepo.incrementStock(prev.produtoVariacaoId, prev.quantidade) } catch (err) { console.error('rollback increment failed', err) }
      }
      return { ok: false, reason: e?.message || e }
    }
  }

  const fetchPayment = async (paymentId) => {
    const url = `${MP_BASE}/v1/payments/${paymentId}`
    let r

    try {
      r = await fetch(url, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      })
    } catch (e) {
      throw new Error('MP network error')
    }

    if (!r.ok) {
      if (r.status === 404) return null
      const body = await r.text().catch(() => '')
      throw new Error(`MP error ${r.status}: ${body}`)
    }

    return r.json()
  }

  const mapMpStatus = (status) =>
  ({
    approved: 'APROVADO',
    pending: 'PENDENTE',
    rejected: 'REJEITADO',
    refunded: 'REEMBOLSADO',
  }[status] ?? 'PENDENTE')

  const resolvePedidoId = (paymentData) =>
    paymentData.external_reference ||
    paymentData.preference_id ||
    paymentData.order?.id ||
    null


  const processPaymentById = async (paymentId) => {
    const paymentData = await fetchPayment(paymentId)
    if (!paymentData) return { ok: false, notFound: true }

    const mappedStatus = mapMpStatus(paymentData.status)
    const pedidoId = resolvePedidoId(paymentData)

    let pedido = null
    let shouldRunSideEffects = false

    // --- Reconciliação ---
    if (pedidoId) {
      const existingPayment = await orderRepo.findPaymentByPedidoId(pedidoId)

      if (!existingPayment) {
        await orderRepo.createPaymentForPedido(pedidoId, paymentId, {
          provedor: 'mercado_pago',
          status: mappedStatus,
        })
      } else if (existingPayment.pagamentoId !== paymentId) {
        await orderRepo.updatePaymentId(existingPayment.pagamentoId, paymentId)
      }

      if (mappedStatus === 'APROVADO') {
        shouldRunSideEffects =
          await orderRepo.markPaymentAsApprovedIfNotYet(paymentId)
      } else {
        await orderRepo.updatePaymentStatus(paymentId, mappedStatus)
      }

      pedido = await orderRepo.getOrderByPedidoId(pedidoId)
    }

    // --- Fallback ---
    if (!pedido) {
      const existingPayment =
        await orderRepo.findPaymentByPagamentoId(paymentId)

      if (!existingPayment) return { ok: true, ignored: true }

      if (mappedStatus === 'APROVADO') {
        shouldRunSideEffects =
          await orderRepo.markPaymentAsApprovedIfNotYet(paymentId)

        if (shouldRunSideEffects) {
          pedido = await orderRepo.getOrderByPaymentId(paymentId)
        }
      } else {
        await orderRepo.updatePaymentStatus(paymentId, mappedStatus)
      }
    }

    // --- Side-effects (executa apenas 1 vez real) ---
    if (pedido && shouldRunSideEffects) {
      const res = await safeDecrementStockForPedido(pedido)
      console.log("Estou no decremento: ", res)

      if (!res.ok) {
        await orderRepo.updatePaymentStatus(paymentId, 'REJEITADO')
        return { ok: false, reason: res.reason }
      }

      await orderRepo.updateOrderStatus(pedido.id, 'PAGO')
      await cartRepo.clearCart(pedido.userId)
      await startShipmentPurchaseJob(pedido.id)
    }

    if (pedido) {
      try {
        const io = getIo()
        io?.to(`order:${pedido.id}`).emit('order.updated', {
          orderId: pedido.id,
          status: mappedStatus,
        })
      } catch { }
    }

    return { ok: true, mpStatus: paymentData.status }
  }



  // Background: start shipment creation and purchase for orders marked as PAGO
  // const startShipmentPurchaseJob = async (pedidoId, attempt = 0) => {
  //   const MAX_ATTEMPTS = 3

  //   console.log('[JOB] startShipmentPurchaseJob', { pedidoId, attempt })

  //   try {
  //     const pedido = await orderRepo.getOrderById(pedidoId)
  //     console.log('[JOB] pedido carregado', { exists: !!pedido })

  //     if (!pedido) throw new Error('Pedido não encontrado')

  //     if (!pedido.melhorenvio_shipment_id) {
  //       console.log('[JOB] criando shipment')

  //       const products = (pedido.itens || []).map(it => ({
  //         weight: 1,
  //         length: 20,
  //         height: 10,
  //         width: 15,
  //         quantity: it.quantidade,
  //         insurance_value: Number(it.preco || 0)
  //       }))

  //       const shipmentPayload = {
  //         from: { postal_code: process.env.MELHOR_ENVIO_ORIGIN_POSTAL_CODE || '01000000' },
  //         to: { postal_code: String(pedido.cep || '').replace(/\D/g, '') },
  //         products
  //       }

  //       console.log('[JOB] shipment payload', shipmentPayload)

  //       const createRes = await shippingService.createShipment(shipmentPayload)

  //       console.log('[JOB] shipment criado', {
  //         response: createRes,
  //         shipmentId: createRes?.id || createRes?.shipment_id
  //       })

  //       await orderRepo.updateOrderShippingInfo(pedidoId, {
  //         melhorenvio_shipment_id: createRes.id || createRes.shipment_id,
  //         shipping_metadata: createRes
  //       })
  //     } else {
  //       console.log('[JOB] shipment já existe', {
  //         shipmentId: pedido.melhorenvio_shipment_id
  //       })
  //     }

  //     const freshPedido = await orderRepo.getOrderById(pedidoId)
  //     const shipmentId = freshPedido?.melhorenvio_shipment_id

  //     console.log('[JOB] iniciando compra', { shipmentId })

  //     if (!shipmentId) throw new Error('Shipment ID ausente')

  //     const purchaseRes = await shippingService.purchaseShipment(shipmentId, {})

  //     console.log('[JOB] compra realizada', purchaseRes)

  //     const purchaseId =
  //       purchaseRes.id ||
  //       purchaseRes.purchase_id ||
  //       purchaseRes.result?.id

  //     const tracking =
  //       purchaseRes.tracking_number ||
  //       purchaseRes.result?.tracking ||
  //       null

  //     const label =
  //       purchaseRes.label_url ||
  //       purchaseRes.result?.label_url ||
  //       purchaseRes.result?.label ||
  //       null

  //     await orderRepo.updateOrderShippingInfo(pedidoId, {
  //       melhorenvio_purchase_id: purchaseId,
  //       tracking_number: tracking,
  //       label_url: label,
  //       shipping_status: 'PURCHASED',
  //       shipping_metadata: purchaseRes
  //     })

  //     console.log('[JOB] finalizado com sucesso', {
  //       pedidoId,
  //       shipmentId,
  //       purchaseId
  //     })

  //   } catch (err) {
  //     console.error('[JOB] erro', {
  //       pedidoId,
  //       attempt,
  //       message: err?.message,
  //       stack: err?.stack
  //     })

  //     if (attempt < MAX_ATTEMPTS) {
  //       const backoff = Math.pow(2, attempt) * 1000
  //       console.log('[JOB] retry agendado', { backoff })
  //       setTimeout(() => startShipmentPurchaseJob(pedidoId, attempt + 1), backoff)
  //     } else {
  //       console.error('[JOB] falha definitiva', { pedidoId })
  //       try {
  //         await orderRepo.updateOrderShippingInfo(pedidoId, {
  //           shipping_status: 'FAILED',
  //           shipping_metadata: { error: String(err?.message || err) }
  //         })
  //       } catch { }
  //     }
  //   }
  // }


  // Decide how to interpret incomingId to avoid unnecessary MP GETs that return 404.
  // Heuristic:
  // - If incomingId contains a dash it's likely a pedido.external_reference (UUID) -> use payments search by external_reference
  // - If incomingId is numeric, only call payments GET if we already have a pagamento record in our DB for that id
  try {
    if (String(incomingId).includes('-')) {
      // Treat as external_reference / pedidoId: search payments by external_reference
      try {
        const searchUrl = `${MP_BASE}/v1/payments/search?external_reference=${encodeURIComponent(incomingId)}`
        console.log(`MP: buscando pagamentos por external_reference (search) ${searchUrl} — token: ${maskToken(MP_ACCESS_TOKEN)}`)
        const sres = await fetch(searchUrl, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
        if (!sres.ok) {
          const txt = await sres.text().catch(() => '<no-body>')
          console.error(`MP search returned error for external_reference ${incomingId}: status=${sres.status} body=${txt}`)
          return { ok: true, note: 'mp_search_failed' }
        }
        const sdata = await sres.json()
        const payments = sdata.results || sdata || []
        if (!payments || payments.length === 0) {
          console.log(`handleMpNotification: no payments found for external_reference ${incomingId}`)
          return { ok: true, note: 'no_payments_for_external_reference' }
        }
        const processed = []
        for (const p of payments) {
          if (p && p.id) {
            try { processed.push(await processPaymentById(p.id)) } catch (e) { console.error('processing payment from search failed', e?.message || e) }
          }
        }
        return { ok: true, processed }
      } catch (e) {
        console.error('handleMpNotification: payment search failed', e?.message || e)
        return { ok: true, note: 'mp_search_exception' }
      }
    }

    // If numeric id (MP payment id or order id) -> try to process as a payment id directly
    // NOTE: o MP pode enviar tanto o payment.id quanto um order.id; aqui tentamos primeiro
    // consultar /v1/payments/{id} porque essa rota é a fonte de verdade para o status do pagamento.
    const numericCheck = /^[0-9]+$/.test(String(incomingId))
    if (numericCheck) {
      console.log(`handleMpNotification: id numérico recebido (${incomingId}) — consultando MP /v1/payments/${incomingId}`)
      return await processPaymentById(incomingId)
    }

    // Fallback para outros formatos: tentar processar como pagamento
    return await processPaymentById(incomingId)
  } catch (err) {
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

export const deleteOrder = async (pedidoId, requestingUserId, isAdmin = false) => {
  const pedido = await orderRepo.getOrderById(pedidoId)
  if (!pedido) throw new Error('Pedido não encontrado')
  if (!isAdmin && pedido.usuarioId !== requestingUserId) throw new Error('Não autorizado')
  return orderRepo.deleteOrderById(pedidoId)
}

export const deleteAllOrdersForUser = async (usuarioId, requestingUserId, isAdmin = false) => {
  if (!isAdmin && usuarioId !== requestingUserId) throw new Error('Não autorizado')
  return orderRepo.deleteOrdersByUserId(usuarioId)
}

// Nota: a lógica de adicionar frete via PUT foi removida. O frete agora deve ser enviado
// no body do endpoint POST /api/orders/checkout e será somado ao total na criação do pedido.

export const deletePayment = async (pagamentoId, requestingUserId, isAdmin = false) => {
  const pagamento = await orderRepo.findPaymentByPagamentoId(pagamentoId)
  if (!pagamento) throw new Error('Pagamento não encontrado')
  // fetch associated order to check ownership
  const pedido = await orderRepo.getOrderById(pagamento.pedidoId)
  if (!pedido) throw new Error('Pedido relacionado não encontrado')
  if (!isAdmin && pedido.usuarioId !== requestingUserId) throw new Error('Não autorizado')
  return orderRepo.deletePaymentByPagamentoId(pagamentoId)
}

export const deleteAllPaymentsForUser = async (usuarioId, requestingUserId, isAdmin = false) => {
  if (!isAdmin && usuarioId !== requestingUserId) throw new Error('Não autorizado')
  return orderRepo.deletePaymentsByUserId(usuarioId)
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

export const deletePendingOrdersOlderThan = async (hours = 24) => {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
  return orderRepo.deletePendingOrdersOlderThan(cutoff.toISOString())
}

export const startShipmentPurchaseJob = async (pedidoId, attempt = 0) => {
  const MAX_ATTEMPTS = 3

  try {
    const pedido = await orderRepo.getOrderById(pedidoId)
    if (!pedido) throw new Error('Pedido não encontrado')

    if (!pedido.melhorenvio_shipment_id) {
      const products = (pedido.itens || []).map(it => ({
        name: it.nome || 'Produto',
        quantity: it.quantidade,
        unitary_value: Number(it.preco || 0),
        weight: 1,
        length: 20,
        height: 10,
        width: 15,
        peso: 1,
        comprimento: 20
      }))

      //! Sem fallback, se não estiver no .env, vai dar erro
      const ITEM_WEIGHT = Number(process.env.ITEM_WEIGHT);
      const ITEM_LENGTH = Number(process.env.ITEM_LENGTH);
      const ITEM_HEIGHT = Number(process.env.ITEM_HEIGHT);
      const ITEM_WIDTH = Number(process.env.ITEM_WIDTH);

      const volumes = (pedido.itens || []).map(() => ({
        weight: ITEM_WEIGHT,
        length: ITEM_LENGTH,
        height: ITEM_HEIGHT,
        width: ITEM_WIDTH,
      }));

      /** 
       * ATENÇÃO:
       * service DEVE vir do cálculo de frete.
       * Aqui estou fixando PAC (1) apenas para não quebrar.
       */
      //! Checar se a plataforma irá usar apenas PAC como forma de frete
      const user = await findUserById(pedido.usuarioId);

      const shipmentPayload = {
        service: pedido.melhorenvio_service_id,
        from: {
          name: process.env.MELHOR_ENVIO_FROM_NAME,
          phone: process.env.MELHOR_ENVIO_FROM_PHONE,
          email: process.env.MELHOR_ENVIO_FROM_EMAIL,
          address: process.env.MELHOR_ENVIO_FROM_ADDRESS,
          number: process.env.MELHOR_ENVIO_FROM_NUMBER,
          district: process.env.MELHOR_ENVIO_FROM_DISTRICT,
          city: process.env.MELHOR_ENVIO_FROM_CITY,
          state_abbr: process.env.MELHOR_ENVIO_FROM_STATE,
          postal_code: process.env.MELHOR_ENVIO_FROM_POSTAL_CODE
        },
        to: {
          name: user.nome,
          phone: pedido.telefone,
          email: pedido.email,
          address: pedido.rua,
          number: pedido.numero,
          district: pedido.bairro,
          city: pedido.cidade,
          state_abbr: pedido.estado,
          document: user.documento,
          postal_code: pedido.cep.replace(/\D/g, '')
        },
        products,
        volumes,
      }

      const createRes = await shippingService.createShipment(shipmentPayload)

      await orderRepo.updateOrderShippingInfo(pedidoId, {
        melhorenvio_shipment_id: createRes.id,
        shipping_metadata: createRes
      })
    }

    const freshPedido = await orderRepo.getOrderById(pedidoId)
    if (!freshPedido?.melhorenvio_shipment_id) {
      throw new Error('Shipment ID ausente')
    }

    const purchaseRes = await shippingService.purchaseShipment(
      freshPedido.melhorenvio_shipment_id
    )

    await orderRepo.updateOrderShippingInfo(pedidoId, {
      melhorenvio_purchase_id: purchaseRes.id,
      tracking_number: purchaseRes.tracking_number || null,
      label_url: purchaseRes.label_url || null,
      shipping_status: 'PURCHASED',
      shipping_metadata: purchaseRes
    })

  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(
        () => startShipmentPurchaseJob(pedidoId, attempt + 1),
        Math.pow(2, attempt) * 1000
      )
      return
    }

    await orderRepo.updateOrderShippingInfo(pedidoId, {
      shipping_status: 'FAILED',
      shipping_metadata: { error: err.message }
    })

    throw err
  }
}

export const addFreightToOrder = async (orderId, freteValue) => {
  const order = await orderRepo.getOrderById(orderId)
  if (!order) throw new Error('Pedido não encontrado')

  const currentTotal = Number(order.total)
  const newTotal = currentTotal + Number(freteValue)

  await orderRepo.updateOrderTotal(orderId, newTotal)

  return orderRepo.getOrderById(orderId)
}

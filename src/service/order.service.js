import * as cartRepo from '../repositories/cart.repository.js'
import * as orderRepo from '../repositories/order.repository.js'
import fetch from 'node-fetch'
import * as productRepo from '../repositories/product.repository.js'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const MP_BASE = 'https://api.mercadopago.com'

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

  return pedido
}

export const createMercadoPagoPreference = async (pedido) => {
  if (!MP_ACCESS_TOKEN) throw new Error('MP_ACCESS_TOKEN não configurado')

  const itens = pedido.itens.map((it) => ({
    title: `Produto ${it.produtoVariacaoId}`,
    quantity: it.quantidade,
    unit_price: Number(it.preco),
    currency_id: 'BRL'
  }))

  const body = {
    items: itens,
    back_urls: {
      success: process.env.MP_BACK_URL_SUCCESS || 'https://seusite.com/success',
      failure: process.env.MP_BACK_URL_FAILURE || 'https://seusite.com/failure',
      pending: process.env.MP_BACK_URL_PENDING || 'https://seusite.com/pending'
    },
    notification_url: process.env.MP_NOTIFICATION_URL || null
  }

  const res = await fetch(`${MP_BASE}/v1/checkout/preferences`, {
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
  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
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

  // localizar pagamento no DB e atualizar
  const pagamento = await orderRepo.createOrUpdatePaymentRecord ? null : null
  // NOTE: Implementação simplificada - depende de encontrar pagamento pelo pagamentoId

  // quando aprovado, decrementar estoque dos itens do pedido
  if (mapped === 'APROVADO') {
    // buscar pedido relacionado ao pagamento
    const pedido = await orderRepo.getOrderByPaymentId(paymentId)
    if (pedido && pedido.itens) {
      for (const it of pedido.itens) {
        await productRepo.decrementStock(it.produtoVariacaoId, it.quantidade)
      }
    }
  }

  return { ok: true, mpStatus: data.status }
}

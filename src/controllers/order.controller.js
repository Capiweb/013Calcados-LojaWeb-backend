import * as orderService from '../service/order.service.js'
import fetch from 'node-fetch'

export const getCart = async (req, res) => {
  try {
    const userId = req.userId
    const cart = await orderService.getCart(userId)
    return res.status(200).json(cart)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao obter carrinho' })
  }
}

export const addItem = async (req, res) => {
  try {
    const userId = req.userId
    const { produtoVariacaoId, quantidade } = req.body
    const item = await orderService.addItemToCart(userId, produtoVariacaoId, quantidade)
    return res.status(201).json(item)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao adicionar item ao carrinho' })
  }
}

export const removeItem = async (req, res) => {
  try {
    const { id } = req.params
    await orderService.removeItemFromCart(id)
    return res.status(204).send()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao remover item do carrinho' })
  }
}

export const checkout = async (req, res) => {
  try {
    const userId = req.userId

    // Get cart items for the authenticated user
    const cart = await orderService.getCart(userId)
    if (!cart || !cart.itens || cart.itens.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' })
    }

    // build items for Mercado Pago preference
    const items = (cart.itens || []).map((it) => ({
      title: it.produtoVariacao?.produto?.nome || `Produto ${it.produtoVariacaoId}`,
      quantity: Number(it.quantidade) || 1,
      unit_price: Number(it.preco ?? it.produtoVariacao?.produto?.preco ?? 0),
      currency_id: 'BRL'
    }))

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no servidor' })

    const mpBody = {
      items,
      external_reference: cart.id || undefined,
      back_urls: {
        success: process.env.MP_BACK_URL_SUCCESS || 'https://seusite.com/success',
        failure: process.env.MP_BACK_URL_FAILURE || 'https://seusite.com/failure',
        pending: process.env.MP_BACK_URL_PENDING || 'https://seusite.com/pending'
      }
    }

    // include notification_url so MP can POST updates to our webhook
    // and auto_return to automatically redirect after approved payments
    mpBody.notification_url = process.env.MP_NOTIFICATION_URL || process.env.MP_WEBHOOK_URL || undefined
    mpBody.auto_return = process.env.MP_AUTO_RETURN || 'approved'

    const mpRes = await fetch('https://api.mercadopago.com/v1/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mpBody)
    })

    const txt = await mpRes.text()
    const xRequestId = mpRes.headers && typeof mpRes.headers.get === 'function' ? mpRes.headers.get('x-request-id') : undefined
    if (!mpRes.ok) {
      console.error('MP create preference error:', { status: mpRes.status, xRequestId, body: txt })
      const payload = { error: 'Erro ao criar preferência Mercado Pago', details: txt }
      if (xRequestId) payload.xRequestId = xRequestId
      return res.status(502).json(payload)
    }

    const data = JSON.parse(txt)
    const resp = { url: data.init_point, preference: data }
    if (xRequestId) resp.xRequestId = xRequestId
    return res.status(200).json(resp)
  } catch (error) {
    console.error('checkout error:', error)
    return res.status(500).json({ error: 'Erro ao criar checkout' })
  }
}

export const getAllOrders = async (req, res) => {
  try {
    // optional query filters could be passed (status, userId, date range)
    const filters = {}
    // map query params to prisma where if provided
    const { status, userId } = req.query
    if (status) filters.where = { ...(filters.where || {}), status }
    if (userId) filters.where = { ...(filters.where || {}), usuarioId: userId }

    const pedidos = await orderService.listAllOrders(filters)
    return res.status(200).json(pedidos)
  } catch (error) {
    console.error('getAllOrders error:', error)
    // include request context in logs
    console.error('req.query:', req.query, 'req.userId:', req.userId)
    const payload = { error: 'Erro ao obter pedidos' }
    if (process.env.NODE_ENV === 'development') {
      payload.details = error.message
      payload.stack = error.stack
    }
    return res.status(500).json(payload)
  }
}

export const getAllCarts = async (req, res) => {
  try {
    const carts = await orderService.listAllCarts()
    return res.status(200).json(carts)
  } catch (error) {
    console.error('getAllCarts error:', error)
    return res.status(500).json({ error: 'Erro ao obter carrinhos' })
  }
}

export const getCartById = async (req, res) => {
  try {
    const { id } = req.params
    const cart = await orderService.getCartById(id)
    if (!cart) return res.status(404).json({ error: 'Carrinho não encontrado' })
    return res.status(200).json(cart)
  } catch (error) {
    console.error('getCartById error:', error)
    return res.status(500).json({ error: 'Erro ao obter carrinho' })
  }
}

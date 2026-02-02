import * as orderService from '../service/order.service.js'
import * as enderecoService from '../service/endereco.service.js'
import { EnderecoSchema } from '../validators/order.validator.js'
import * as userService from '../service/user.js'
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

// Lista os pedidos do usuário autenticado
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.userId
    const pedidos = await orderService.listAllOrders({ where: { usuarioId: userId } })
    return res.status(200).json(pedidos)
  } catch (error) {
    console.error('getMyOrders error:', error)
    return res.status(500).json({ error: 'Erro ao obter pedidos do usuário' })
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

    // build items for Mercado Pago preference using richer data from cart/product
    const items = (cart.itens || []).map((it) => {
      const pv = it.produtoVariacao || {}
      const p = pv.produto || {}
      return {
        id: pv.sku || pv.id || undefined,
        title: p.nome || `Produto ${it.produtoVariacaoId}`,
        description: p.descricao || '',
        picture_url: p.imagemUrl || undefined,
        category_id: p.categoriaId || undefined,
        quantity: Number(it.quantidade) || 1,
        unit_price: Number(it.preco ?? p.preco ?? 0),
        currency_id: 'BRL'
      }
    })

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no servidor' })

    // Merge provided partial endereco with user's saved endereco (prefer provided fields)
    let provided = req.body?.endereco || {}
    let saved = {}
    try {
      const enderecos = await enderecoService.listEnderecosDoUsuario(userId)
      if (enderecos && enderecos.length) saved = enderecos[0]
    } catch (e) {
      // ignore
    }
    const endereco = { ...(saved || {}), ...(provided || {}) }

    // Validate merged endereco - require essential fields
    try {
      EnderecoSchema.parse(endereco)
    } catch (e) {
      // return validation error to client
      return res.status(400).json({ error: e.errors || e.message })
    }

    // Create pedido in DB from cart (freeze address) before creating preference
    let pedido
    try {
      pedido = await orderService.createOrderFromCart(userId, endereco || {})
    } catch (e) {
      console.error('Erro ao criar pedido:', e)
      return res.status(500).json({ error: 'Erro ao criar pedido' })
    }

    // create pagamento record with status PENDENTE linked to pedido
    let placeholderPagamentoId
    try {
      placeholderPagamentoId = `PENDENTE-${Date.now()}-${pedido.id}`
      await orderService.linkPaymentToOrder(pedido.id, { provedor: 'mercado_pago', pagamentoId: placeholderPagamentoId, status: 'PENDENTE' })
    } catch (e) {
      // ignore payment link error (non-fatal) but log
      console.error('Erro ao criar registro de pagamento PENDENTE:', e)
    }

    const mpBody = {
      items,
      external_reference: pedido.id || cart.id || undefined,
      back_urls: {
        success: process.env.MP_BACK_URL_SUCCESS || 'https://seusite.com/success',
        failure: process.env.MP_BACK_URL_FAILURE || 'https://seusite.com/failure',
        pending: process.env.MP_BACK_URL_PENDING || 'https://seusite.com/pending'
      }
    }

    // Attach payer info from user profile when available
    try {
      const user = await userService.getUserById(userId)
      if (user) {
        mpBody.payer = mpBody.payer || {}
        if (user.email) mpBody.payer.email = user.email
        if (user.nome) {
          const parts = user.nome.split(' ')
          mpBody.payer.name = parts.shift() || user.nome
          mpBody.payer.surname = parts.join(' ') || ''
        }
      }
    } catch (e) {
      // ignore silently if user fetch fails
    }

    // Attach shipment/receiver_address from endereco if available
    if (endereco) {
      mpBody.shipments = mpBody.shipments || {}
      mpBody.shipments.receiver_address = {
        zip_code: endereco.cep || '',
        street_name: endereco.rua || '',
        street_number: endereco.numero || null,
        floor: endereco.andar || '',
        apartment: endereco.complemento || ''
      }
    }

    // include notification_url so MP can POST updates to our webhook
    // and auto_return to automatically redirect after approved payments
    mpBody.notification_url = process.env.MP_NOTIFICATION_URL || process.env.MP_WEBHOOK_URL || undefined
    mpBody.auto_return = process.env.MP_AUTO_RETURN || 'approved'

    // Ensure we don't exclude payment methods (help show PIX if account supports it)
    mpBody.payment_methods = mpBody.payment_methods || {
      installments: 1,
      excluded_payment_methods: [],
      excluded_payment_types: []
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
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
    const resp = { url: data.init_point, preference: data, pedidoId: pedido?.id }
    if (xRequestId) resp.xRequestId = xRequestId
    return res.status(200).json(resp)
  } catch (error) {
    console.error('checkout error:', error)
    return res.status(500).json({ error: 'Erro ao criar checkout' })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params
    const pedido = await orderService.getOrderById(id)
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' })
    return res.status(200).json(pedido)
  } catch (error) {
    console.error('getOrderById error:', error)
    return res.status(500).json({ error: 'Erro ao obter pedido' })
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

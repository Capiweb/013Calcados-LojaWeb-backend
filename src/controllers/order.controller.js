import * as orderService from '../service/order.service.js'

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
    const endereco = req.body.endereco
    const pedido = await orderService.createOrderFromCart(userId, endereco)

    // buscar pedido com itens
    const fullPedido = await orderService.getCart(userId) // reuse: alternativamente buscar pedido

    // criar preference MP
    const pref = await orderService.createMercadoPagoPreference({ itens: pedido.itens })

    // vincular pagamento
    await orderService.linkPaymentToOrder(pedido.id, { provedor: 'mercado_pago', pagamentoId: pref.id, status: 'PENDENTE' })

    return res.status(200).json({ init_point: pref.init_point, preference: pref })
  } catch (error) {
    console.error(error)
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

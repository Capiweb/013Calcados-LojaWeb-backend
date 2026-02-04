import fetch from 'node-fetch'

const MP_BASE = 'https://api.mercadopago.com'
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

export const paymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado' })

    // search payments by external_reference
  const url = `${MP_BASE}/v1/payments/search?external_reference=${encodeURIComponent(orderId)}`
  console.log(`DEBUG: consultando Mercado Pago (payments/search) para pedido ${orderId}: ${url}`)
    const r = await fetch(url, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
    if (!r.ok) {
      const txt = await r.text()
      return res.status(500).json({ error: 'MP search failed', detail: txt })
    }

    const data = await r.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('paymentsByOrder', err)
    return res.status(500).json({ error: 'Erro' })
  }
}

export const inspectNotification = async (req, res) => {
  try {
    const { id } = req.params
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado' })

    const results = {}

    // Try payments
    try {
  const pUrl = `${MP_BASE}/v1/payments/${id}`
  console.log(`DEBUG: consultando Mercado Pago GET /v1/payments/${id} — token: ${maskToken(MP_ACCESS_TOKEN)}`)
      const r = await fetch(pUrl, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
      results.payment = { status: r.status }
      try { results.payment.body = await r.json() } catch (e) { results.payment.body = await r.text().catch(() => '<no-body>') }
    } catch (e) { results.payment = { error: String(e) } }

    // Try merchant_orders
    try {
      const r2 = await fetch(`${MP_BASE}/v1/merchant_orders/${id}`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
      results.merchant_order = { status: r2.status }
      try { results.merchant_order.body = await r2.json() } catch (e) { results.merchant_order.body = await r2.text().catch(() => '<no-body>') }
    } catch (e) { results.merchant_order = { error: String(e) } }

    // Try payments search by external_reference
    try {
      const r3 = await fetch(`${MP_BASE}/v1/payments/search?external_reference=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
      results.search = { status: r3.status }
      try { results.search.body = await r3.json() } catch (e) { results.search.body = await r3.text().catch(() => '<no-body>') }
    } catch (e) { results.search = { error: String(e) } }

    return res.status(200).json(results)
  } catch (err) {
    console.error('inspectNotification', err)
    return res.status(500).json({ error: 'Erro' })
  }
}

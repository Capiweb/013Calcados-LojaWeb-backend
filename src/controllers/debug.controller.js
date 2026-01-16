import fetch from 'node-fetch'

const MP_BASE = 'https://api.mercadopago.com'
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

export const paymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado' })

    // search payments by external_reference
    const url = `${MP_BASE}/v1/payments/search?external_reference=${encodeURIComponent(orderId)}`
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

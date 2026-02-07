import fetch from 'node-fetch'

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN
const MELHOR_ENVIO_CALCULATE_URL =
  process.env.MELHOR_ENVIO_CALCULATE_URL || 'https://api.melhorenvio.com/v2/me/shipment/calculate'
const MELHOR_ENVIO_OAUTH_TOKEN_URL = process.env.MELHOR_ENVIO_OAUTH_TOKEN_URL || 'https://api.melhorenvio.com/oauth/token'

const mask = (t = '') => (t ? `${String(t).slice(0, 6)}...` : '<missing>')

// Note: this service uses the access token provided directly in .env (MELHOR_ENVIO_TOKEN).
// OAuth exchange functions and per-user tokens were removed to avoid generating tokens programmatically.

export const calculateShipping = async (payload, userId = null) => {
  // Use the access token provided in .env
  const token = MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível. Conecte sua conta via /api/shipping/authorize')

  const url = MELHOR_ENVIO_CALCULATE_URL
  try {
    // Melhor Envio expects different shapes depending on endpoint.
    // If caller provided origin_postal_code/destination_postal_code use from/to shape required by /v2/me/shipment/calculate
    let bodyToSend = payload
    try {
      if (payload && (payload.origin_postal_code || payload.destination_postal_code)) {
        const fromPostal = payload.origin_postal_code || payload.from?.postal_code || payload.from_postal_code
        const toPostal = payload.destination_postal_code || payload.to?.postal_code || payload.to_postal_code
        const items = Array.isArray(payload.items) ? payload.items.map(i => ({
          weight: i.weight,
          length: i.length,
          height: i.height,
          width: i.width,
          quantity: i.quantity || 1,
          insurance_value: i.insurance_value || i.insuranceValue || 0
        })) : []

        bodyToSend = {
          from: { postal_code: String(fromPostal || '') },
          to: { postal_code: String(toPostal || '') },
          items
        }
        if (payload.services) bodyToSend.services = payload.services
        if (payload.delivery_type) bodyToSend.delivery_type = payload.delivery_type
      }
    } catch (mapError) {
      console.warn('shipping.calculateShipping mapping warning:', mapError?.message || mapError)
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': '013calcados (contato@seusite.com)'
      },
      body: JSON.stringify(bodyToSend)
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch (e) { data = text }

    if (!res.ok) {
      const err = new Error('Melhor Envio returned non-OK')
      err.status = res.status
      err.body = data
      throw err
    }
    return data
  } catch (e) {
    console.error('shipping.calculateShipping error:', e?.message || e)
    throw e
  }
}

export default { calculateShipping }

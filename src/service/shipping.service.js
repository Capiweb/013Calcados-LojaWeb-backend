import fetch from 'node-fetch'

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN
const MELHOR_ENVIO_CALCULATE_URL =
  process.env.MELHOR_ENVIO_CALCULATE_URL || 'https://api.melhorenvio.com/v2/me/shipment/calculate'
const MELHOR_ENVIO_OAUTH_TOKEN_URL = process.env.MELHOR_ENVIO_OAUTH_TOKEN_URL || 'https://api.melhorenvio.com/oauth/token'
// Use documented cart/checkout flow by default:
// - POST /api/v2/me/cart to insert freight in cart (returns id)
// - POST /api/v2/me/shipment/checkout to purchase one or more cart items
const MELHOR_ENVIO_CREATE_URL = process.env.MELHOR_ENVIO_CREATE_URL || 'https://api.melhorenvio.com/v2/me/cart'
const MELHOR_ENVIO_PURCHASE_URL = process.env.MELHOR_ENVIO_PURCHASE_URL || 'https://api.melhorenvio.com/v2/me/shipment/checkout'
// Normalize GET URL: some envs use singular /shipment/{id} or /shipment/{shipment_id}; prefer /orders/{id}
const _rawGet = process.env.MELHOR_ENVIO_GET_URL || 'https://api.melhorenvio.com/v2/me/shipments/{shipment_id}'
let MELHOR_ENVIO_GET_URL = _rawGet
if (_rawGet.includes('/shipment/{id}')) {
  MELHOR_ENVIO_GET_URL = _rawGet.replace('/shipment/{id}', '/orders/{id}')
} else if (_rawGet.includes('/shipment/{shipment_id}')) {
  MELHOR_ENVIO_GET_URL = _rawGet.replace('/shipment/{shipment_id}', '/orders/{id}')
} else if (_rawGet.includes('/shipments/{shipment_id}')) {
  // prefer /orders/{id} as documented for listing label info
  MELHOR_ENVIO_GET_URL = _rawGet.replace('/shipments/{shipment_id}', '/orders/{id}')
}

const mask = (t = '') => (t ? `${String(t).slice(0, 6)}...` : '<missing>')

// Note: this service uses the access token provided directly in .env (MELHOR_ENVIO_TOKEN).
// OAuth exchange functions and per-user tokens were removed to avoid generating tokens programmatically.

import * as cartRepo from '../repositories/cart.repository.js'

export const calculateShipping = async (userId, postalCode) => {
  // Use the access token provided in .env
  const token = MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível. Conecte sua conta via /api/shipping/authorize')

  const url = MELHOR_ENVIO_CALCULATE_URL
  try {
    const cart = await cartRepo.getCartWithItems(userId)
    const items = cart?.itens || []

    const fromPostal = process.env.MELHOR_ENVIO_FROM_POSTAL_CODE
    const toPostal = postalCode

    // sanitize postal codes: remove non-digits
    const sanitizeCEP = (s) => String(s || '').replace(/\D/g, '')
    const fromDigits = sanitizeCEP(fromPostal)
    const toDigits = sanitizeCEP(toPostal)

    if (!fromDigits || fromDigits.length !== 8) {
      throw new Error('from.postal_code inválido. Deve conter 8 dígitos numéricos.')
    }
    if (!toDigits || toDigits.length !== 8) {
      throw new Error('to.postal_code inválido. Deve conter 8 dígitos numéricos.')
    }

    const getEffectivePriceLocal = (produto) => {
      if (!produto) return 0
      if (produto.emPromocao === true && produto.precoPromocional !== undefined && produto.precoPromocional !== null) return Number(produto.precoPromocional)
      return Number(produto.preco || 0)
    }

    const products = items.flatMap(item => {
      // insurance_value needs to be set. using effective price as insurance value.
      const price = Number(getEffectivePriceLocal(item.produtoVariacao?.produto) ?? 0)

      return Array.from({ length: item.quantidade }, () => ({
        weight: Number(process.env.ITEM_WEIGHT),
        length: Number(process.env.ITEM_LENGTH),
        height: Number(process.env.ITEM_HEIGHT),
        width: Number(process.env.ITEM_WIDTH),
        insurance_value: price
      }));
    });

    const bodyToSend = {
      from: { postal_code: String(fromDigits) },
      to: { postal_code: String(toDigits) },
      products
    }

    const userAgent = `${process.env.MELHOR_ENVIO_FROM_NAME} (${process.env.MELHOR_ENVIO_FROM_EMAIL})`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': userAgent
      },
      body: JSON.stringify(bodyToSend)
    })

    const text = await res.text()
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    // garante que é array antes de filtrar
    if (Array.isArray(data)) {
      data = data.filter(carrier => !carrier.error);
    }

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

export const createShipment = async (shipmentPayload) => {
  const token = MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível')
  // Use the normalized constant so any /cart -> /shipments rewrite is applied
  const url = MELHOR_ENVIO_CREATE_URL
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': `${process.env.MELHOR_ENVIO_FROM_NAME} (${process.env.MELHOR_ENVIO_FROM_EMAIL})` },
    body: JSON.stringify(shipmentPayload)
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch (e) { data = text }
  if (!res.ok) {
    const err = new Error('createShipment failed')
    err.status = res.status
    err.body = data
    throw err
  }
  // Debug: if API didn't return an id, log full response to help diagnosis
  if (!data || (typeof data === 'object' && !data.id && !data.shipment_id)) {
    console.warn('createShipment: resposta inesperada da API Melhor Envio — sem id encontrado', {
      url,
      payloadSummary: { service: shipmentPayload.service, from: shipmentPayload.from?.postal_code, to: shipmentPayload.to?.postal_code },
      response: data
    })
  }
  return data
}

// export const purchaseShipment = async (shipmentId, purchasePayload = {}) => {
//   const token = MELHOR_ENVIO_TOKEN
//   if (!token) throw new Error('Nenhum token Melhor Envio disponível')
//   const raw = process.env.MELHOR_ENVIO_PURCHASE_URL || MELHOR_ENVIO_PURCHASE_URL
//   const url = raw.replace('{shipment_id}', shipmentId)
//   const res = await fetch(url, {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
//     body: JSON.stringify(purchasePayload)
//   })
//   const text = await res.text()
//   let data
//   try { data = JSON.parse(text) } catch (e) { data = text }
//   if (!res.ok) {
//     const err = new Error('purchaseShipment fa  iled')
//     err.status = res.status
//     err.body = data
//     throw err
//   }
//   return data
// }

export const purchaseShipment = async (shipmentId, purchasePayload = {}) => {
  const token = MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível')
  // Use the checkout endpoint which accepts an orders array
  const url = MELHOR_ENVIO_PURCHASE_URL
  // If caller didn't provide a payload, send the documented body { orders: [id] }
  const bodyToSend = (purchasePayload && Object.keys(purchasePayload).length) ? purchasePayload : { orders: [String(shipmentId)] }
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': `${process.env.MELHOR_ENVIO_FROM_NAME} (${process.env.MELHOR_ENVIO_FROM_EMAIL})` },
    body: JSON.stringify(bodyToSend)
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch (e) { data = text }
  if (!res.ok) {
    const err = new Error('purchaseShipment failed')
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}



/**
 * GET /v2/me/orders/{id}
 * Returns full label info including tracking code and status.
 * Official ME docs: https://docs.melhorenvio.com.br/reference/listar-informacoes-de-uma-etiqueta
 */
export const getShipment = async (shipmentId) => {
  const token = MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível')

  const raw = process.env.MELHOR_ENVIO_GET_URL || MELHOR_ENVIO_GET_URL
  let url
  if (raw && raw.includes('{shipment_id}')) {
    url = raw.replace('{shipment_id}', shipmentId)
  } else {
    const baseUrl = process.env.MELHOR_ENVIO_BASE_URL || 'https://melhorenvio.com.br'
    url = `${baseUrl}/api/v2/me/orders/${shipmentId}`
  }

  const userAgent = `${process.env.MELHOR_ENVIO_FROM_NAME} (${process.env.MELHOR_ENVIO_FROM_EMAIL})`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': userAgent }
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch (e) { data = text }
  if (!res.ok) {
    const err = new Error('getShipment failed')
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

/**
 * POST /v2/me/shipment/tracking
 * Batch tracking status for multiple orders at once.
 * Body: { orders: ["id1", "id2", ...] }
 * Official ME docs: https://docs.melhorenvio.com.br/reference/rastreio-de-envios
 */
export const getTrackingBatch = async (shipmentIds) => {
  const token = MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível')
  const baseUrl = process.env.MELHOR_ENVIO_BASE_URL || 'https://melhorenvio.com.br'
  const url = `${baseUrl}/api/v2/me/shipment/tracking`
  const userAgent = `${process.env.MELHOR_ENVIO_FROM_NAME} (${process.env.MELHOR_ENVIO_FROM_EMAIL})`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': userAgent
    },
    body: JSON.stringify({ orders: shipmentIds })
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch (e) { data = text }
  if (!res.ok) {
    const err = new Error('getTrackingBatch failed')
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

export default { calculateShipping }

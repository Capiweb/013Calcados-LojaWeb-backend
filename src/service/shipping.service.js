import fetch from 'node-fetch'

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN
const MELHOR_ENVIO_CALCULATE_URL =
  process.env.MELHOR_ENVIO_CALCULATE_URL || 'https://api.melhorenvio.com/v2/me/shipment/calculate'
const MELHOR_ENVIO_OAUTH_TOKEN_URL = process.env.MELHOR_ENVIO_OAUTH_TOKEN_URL || 'https://api.melhorenvio.com/oauth/token'
const MELHOR_ENVIO_CREATE_URL = process.env.MELHOR_ENVIO_CREATE_URL || 'https://api.melhorenvio.com/v2/me/shipments'
const MELHOR_ENVIO_PURCHASE_URL = process.env.MELHOR_ENVIO_PURCHASE_URL || 'https://api.melhorenvio.com/v2/me/shipments/{shipment_id}/purchase'
const MELHOR_ENVIO_GET_URL = process.env.MELHOR_ENVIO_GET_URL || 'https://api.melhorenvio.com/v2/me/shipments/{shipment_id}'

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

    const products = items.flatMap(item => {
      // insurance_value needs to be set. using price as insurance value.
      const price = Number(item.preco ?? item.produtoVariacao?.produto?.preco ?? 0)

      return Array.from({ length: item.quantity }, () => ({
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
  const url = process.env.MELHOR_ENVIO_CREATE_URL || MELHOR_ENVIO_CREATE_URL
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
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

export const purchaseShipment = async (shipmentId) => {
  const token = MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível')

  const url = process.env.MELHOR_ENVIO_PURCHASE_URL || MELHOR_ENVIO_PURCHASE_URL

  const payload = {
    orders: [shipmentId]
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
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


export const getShipment = async (shipmentId) => {
  const token = MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível')
  const raw = process.env.MELHOR_ENVIO_GET_URL || MELHOR_ENVIO_GET_URL
  const url = raw.replace('{shipment_id}', shipmentId)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
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

export default { calculateShipping }

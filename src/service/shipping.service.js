import fetch from 'node-fetch'

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN
const MELHOR_ENVIO_CLIENT_ID = process.env.MELHOR_ENVIO_CLIENT_ID
const MELHOR_ENVIO_CLIENT_SECRET = process.env.MELHOR_ENVIO_CLIENT_SECRET
const MELHOR_ENVIO_CALCULATE_URL =
  process.env.MELHOR_ENVIO_CALCULATE_URL || 'https://api.melhorenvio.com/v2/me/shipment/calculate'
const MELHOR_ENVIO_OAUTH_TOKEN_URL = process.env.MELHOR_ENVIO_OAUTH_TOKEN_URL || 'https://api.melhorenvio.com/oauth/token'

const mask = (t = '') => (t ? `${String(t).slice(0, 6)}...` : '<missing>')

// in-memory per-user token cache
const userTokens = new Map()

export const setUserToken = (userId, tokenObj) => {
  if (!userId) return
  const now = Date.now()
  const expires_in = Number(tokenObj.expires_in || tokenObj.expires || 3600)
  const expires_at = now + expires_in * 1000 - 10000 // renew 10s earlier
  userTokens.set(String(userId), { access_token: tokenObj.access_token, expires_at, raw: tokenObj })
}

export const getUserToken = (userId) => {
  if (!userId) return null
  const rec = userTokens.get(String(userId))
  if (!rec) return null
  if (Date.now() > rec.expires_at) {
    userTokens.delete(String(userId))
    return null
  }
  return rec.access_token
}

export const exchangeAuthCode = async (code, redirect_uri) => {
  if (!MELHOR_ENVIO_CLIENT_ID || !MELHOR_ENVIO_CLIENT_SECRET) throw new Error('MELHOR_ENVIO_CLIENT_ID/SECRET não configurados')
  const url = MELHOR_ENVIO_OAUTH_TOKEN_URL
  const body = new URLSearchParams()
  body.append('grant_type', 'authorization_code')
  body.append('client_id', MELHOR_ENVIO_CLIENT_ID)
  body.append('client_secret', MELHOR_ENVIO_CLIENT_SECRET)
  if (redirect_uri) body.append('redirect_uri', redirect_uri)
  body.append('code', code)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })
  const txt = await res.text()
  let data
  try { data = JSON.parse(txt) } catch (e) { data = txt }
  if (!res.ok) {
    const err = new Error('Melhor Envio token exchange failed')
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

export const calculateShipping = async (payload, userId = null) => {
  // Try per-user token first, then app token
  const token = getUserToken(userId) || MELHOR_ENVIO_TOKEN
  if (!token) throw new Error('Nenhum token Melhor Envio disponível. Conecte sua conta via /api/shipping/authorize')

  const url = MELHOR_ENVIO_CALCULATE_URL
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': '013calcados (contato@seusite.com)'
      },
      body: JSON.stringify(payload)
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

export default { calculateShipping, exchangeAuthCode, setUserToken, getUserToken }

import * as shippingService from '../service/shipping.service.js'

export const calculate = async (req, res) => {
  try {
    // corpo esperado: { origin_postal_code, destination_postal_code, items: [ { weight, length, height, width, quantity, insurance_value } ], services: [codes] }
    const payload = req.body || {}
    if (!payload.destination_postal_code) return res.status(400).json({ error: 'destination_postal_code required' })
    if (!payload.origin_postal_code) return res.status(400).json({ error: 'origin_postal_code required' })
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) return res.status(400).json({ error: 'items required' })
    // pass userId so service can use a per-user token (Authorization Code Flow) when available
    const userId = req.userId || null
    const result = await shippingService.calculateShipping(payload, userId)
    return res.status(200).json(result)
  } catch (error) {
    console.error('shipping.calculate error:', error?.message || error)
    const status = error?.status || 500
    const body = error?.body || error?.message || 'Erro ao calcular frete'
    return res.status(status).json({ error: body })
  }
}

export const authorize = async (req, res) => {
  try {
    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID
    const authorizeUrl = process.env.MELHOR_ENVIO_OAUTH_AUTHORIZE_URL || 'https://api.melhorenvio.com/oauth/authorize'
    const redirectUri = process.env.MELHOR_ENVIO_OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/shipping/callback`
    if (!clientId) return res.status(500).json({ error: 'MELHOR_ENVIO_CLIENT_ID not configured' })

    // If REDIRECT_URI is not configured in env, we derive it from the current request host.
    // Note: the redirect URI must match what's set in the Melhor Envio app settings.
    const params = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri })
    // optional: add state if you want to track the user across redirects
    const url = `${authorizeUrl}?${params.toString()}`
    return res.redirect(url)
  } catch (error) {
    console.error('shipping.authorize error:', error?.message || error)
    return res.status(500).json({ error: 'Erro ao iniciar autorização Melhor Envio' })
  }
}

export const callback = async (req, res) => {
  try {
    // Melhor Envio will redirect back with ?code=...
    const code = req.query.code
    if (!code) return res.status(400).json({ error: 'code query param required' })
    const redirectUri = process.env.MELHOR_ENVIO_OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/shipping/callback`
    const tokenObj = await shippingService.exchangeAuthCode(code, redirectUri)

    // associate token with the authenticated user (req.userId)
    const userId = req.userId || null
    if (userId) {
      shippingService.setUserToken(userId, tokenObj)
    }

    // respond with a friendly message or redirect to frontend
    // If userId is not present (no cookie/session), return token so developer can persist it manually.
    return res.status(200).json({ ok: true, token: { access_token: tokenObj.access_token, expires_in: tokenObj.expires_in, refresh_token: tokenObj.refresh_token }, userId })
  } catch (error) {
    console.error('shipping.callback error:', error?.message || error)
    const status = error?.status || 500
    const body = error?.body || error?.message || 'Erro no callback Melhor Envio'
    return res.status(status).json({ error: body })
  }
}

export default { calculate }

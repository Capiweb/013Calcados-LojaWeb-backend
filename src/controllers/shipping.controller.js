import * as shippingService from '../service/shipping.service.js'

export const calculate = async (req, res) => {
  try {
    // Accept two payload shapes:
    // 1) legacy shape: { origin_postal_code, destination_postal_code, items: [...] }
    // 2) MelhorEnvio shape: { from:{postal_code}, to:{postal_code}, products: [...] }
    const payload = req.body || {}

    const isLegacy = Boolean(payload.origin_postal_code || payload.destination_postal_code || payload.items)
    const isMelhorEnvio = Boolean(payload.from?.postal_code || payload.to?.postal_code || payload.products)

    if (!isLegacy && !isMelhorEnvio) {
      return res.status(400).json({ error: 'Payload inválido. Use origin_postal_code/destination_postal_code + items OR from/to + products' })
    }

    // minimal checks depending on shape
    if (isMelhorEnvio) {
      if (!payload.from?.postal_code) return res.status(400).json({ error: 'from.postal_code required' })
      if (!payload.to?.postal_code) return res.status(400).json({ error: 'to.postal_code required' })
      if (!Array.isArray(payload.products) || payload.products.length === 0) return res.status(400).json({ error: 'products required' })
    } else {
      if (!payload.destination_postal_code) return res.status(400).json({ error: 'destination_postal_code required' })
      if (!payload.origin_postal_code) return res.status(400).json({ error: 'origin_postal_code required' })
      if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) return res.status(400).json({ error: 'items required' })
    }

    const result = await shippingService.calculateShipping(payload)
    return res.status(200).json(result)
  } catch (error) {
    console.error('shipping.calculate error:', error?.message || error)
    const status = error?.status || 500
    const body = error?.body || error?.message || 'Erro ao calcular frete'
    return res.status(status).json({ error: body })
  }
}
export default { calculate }

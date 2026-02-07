import * as shippingService from '../service/shipping.service.js'

export const calculate = async (req, res) => {
  try {
    // corpo esperado: { origin_postal_code, destination_postal_code, items: [ { weight, length, height, width, quantity, insurance_value } ], services: [codes] }
    const payload = req.body || {}
    if (!payload.destination_postal_code) return res.status(400).json({ error: 'destination_postal_code required' })
    if (!payload.origin_postal_code) return res.status(400).json({ error: 'origin_postal_code required' })
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) return res.status(400).json({ error: 'items required' })

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

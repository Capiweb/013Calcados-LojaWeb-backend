import * as shippingService from '../service/shipping.service.js'

export const calculate = async (req, res) => {
  try {
    const payload = req.body || {}
    // Now expects { destination_postal_code: "..." }
    // User ID comes from authMiddleware (req.userId)

    if (!payload.destination_postal_code) {
      return res.status(400).json({ error: 'destination_postal_code required' })
    }

    // req.userId should be populated by authMiddleware. 
    // If this route is public (no auth), we can't calculate per user cart.
    // Assuming authMiddleware is used on this route as per routes file.
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const result = await shippingService.calculateShipping(userId, payload.destination_postal_code)
    return res.status(200).json(result)
  } catch (error) {
    console.error('shipping.calculate error:', error?.message || error)
    const status = error?.status || 500
    const body = error?.body || error?.message || 'Erro ao calcular frete'
    return res.status(status).json({ error: body })
  }
}
export default { calculate }

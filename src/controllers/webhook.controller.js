import * as orderService from '../service/order.service.js'

export const mpNotification = async (req, res) => {
  try {
    const body = req.body
    const result = await orderService.handleMpNotification(body)
    return res.status(200).json(result)
  } catch (error) {
    console.error('mpNotification', error)
    return res.status(500).json({ error: 'Erro ao processar notificação' })
  }
}

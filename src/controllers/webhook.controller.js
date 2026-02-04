import * as orderService from '../service/order.service.js'

// Normalize Mercado Pago webhook payloads and process asynchronously.
// MP may send different shapes: body.data.id, body.id, query params, etc.
export const mpNotification = (req, res) => {
  try {
    const body = req.body || {}
    const query = req.query || {}

    // Common places MP uses to provide payment id
    const paymentId = body?.data?.id || body?.id || body?.collection?.id || body?.resource?.id || query?.id || query?.payment_id || null

    if (!paymentId) {
      // Log context to help debugging but acknowledge immediately so MP won't keep retrying
      console.warn('mpNotification ignored: payment id not provided', {
        headers: req.headers,
        query,
        body: typeof body === 'object' ? body : String(body)
      })
      return res.status(200).json({ ok: true, ignored: true })
    }

    // If MP provides a topic or resource_type and it's not 'payment', skip calling payments GET.
    const topic = body?.type || body?.topic || req.headers['x-mercadopago-topic'] || null
    const resourceType = body?.resource_type || null
    if (topic && topic !== 'payment' && resourceType && resourceType !== 'payment') {
      console.log('mpNotification: received non-payment topic/resource_type, ignoring to avoid unnecessary MP GET', { topic, resourceType })
      return res.status(200).json({ ok: true, ignored: true, reason: 'non_payment' })
    }

    // Acknowledge receipt quickly, then process in background
    res.status(200).json({ ok: true, processing: true })

    // Process async without blocking the response
    setImmediate(async () => {
      try {
        // Debug start
        const xr = req.headers && (req.headers['x-request-id'] || req.headers['x-request-start'])
        console.log(`mpNotification processing start: paymentId=${paymentId} x-request-id=${xr}`)
        // NOTE: service.handleMpNotification now treats payments GET as the single source
        // of truth for payment status. If the GET /v1/payments/:id returns 404 the
        // service will NOT perform additional MP searches (preference/external_reference/merchant_orders).
        // forward the id inside a data object to match MP payload shape
        const forwarded = { data: { id: paymentId } }
        console.log(`mpNotification forwarding to service: ${JSON.stringify(forwarded)}`)
        await orderService.handleMpNotification(forwarded)
        console.log(`mpNotification processing finished: paymentId=${paymentId}`)
      } catch (err) {
        console.error('mpNotification background processing error:', err?.message || err)
      }
    })
  } catch (error) {
    console.error('mpNotification handler error:', error?.message || error)
    // Return 200 to avoid repeated retries from MP in case of unexpected handler error
    return res.status(200).json({ ok: true, error: true })
  }
}

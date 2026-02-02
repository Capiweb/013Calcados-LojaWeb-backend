let io

export const initIo = async (server) => {
  if (io) return io
  try {
    // lazy import to avoid hard dependency at startup
    const mod = await import('socket.io')
    const { Server } = mod
    io = new Server(server, {
      cors: {
        origin: (process.env.CORS_ORIGINS || 'http://127.0.0.1:5500').split(','),
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    io.on('connection', (socket) => {
      console.log('socket connected:', socket.id)
      socket.on('joinOrder', (orderId) => {
        if (!orderId) return
        socket.join(`order:${orderId}`)
      })
    })

    return io
  } catch (e) {
    console.warn('socket.io not installed or failed to initialize, continuing without realtime features:', e?.message || e)
    // provide a no-op shim so callers don't crash
    io = {
      to: () => ({ emit: () => {} }),
      emit: () => {},
    }
    return io
  }
}

export const getIo = () => io

export default { initIo, getIo }

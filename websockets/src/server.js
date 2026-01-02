import { Server } from 'socket.io'
import { handleConnectionEvents } from './events/connection.js'

export const server = {
  io: null,
}

export const serverStart = (port) => {
  server.io = new Server(port, {
    cors: {
      origin: '*',
    },
  })

  // Middleware for Authentication
  server.io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token

    if (token) {
      try {
        const { default: axios } = await import('axios')
        const response = await axios.get(`${process.env.API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        socket.user = response.data
        console.log(`[Auth] Authenticated ${socket.user.nickname} (${socket.user.id})`)
      } catch (error) {
        console.error('[Auth] Token validation failed:', error.message)
        // Check if 401? Proceed as specific error?
        // match handlers rely on user.id. If auth fails, we probably shouldn't set socket.user
      }
    }
    next()
  })

  server.io.on('connection', (socket) => {
    console.log('New connection:', socket.id)

    // Ensure socket.user fallback if auth failed or no token
    if (!socket.user) {
      socket.user = {
        id: socket.id,
        nickname: 'Anonymous',
        isGuest: true
      }
    }

    handleConnectionEvents(server.io, socket)
  })
}

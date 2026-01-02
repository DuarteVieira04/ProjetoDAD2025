import { joinLobby } from './lobby/lobby.js'
import { createGameHandler, joinGameHandler, resignHandler } from './handlers/game.js'
import { createMatchHandler, joinMatchHandler } from './handlers/match-handlers.js'
import { playCardHandler } from './gameplay/gameplay.js'
import { handleDisconnect, handleReconnect } from './reconnection.js'

export function handleConnectionEvents(io, socket) {
  // User is already populated by server.js middleware
  const user = socket.user
  console.log(`[Connection] User connected: ${user.nickname} (${user.id})`)

  // Lobby
  socket.on('joinLobby', () => {
    console.log(`[Lobby] Socket ${socket.id} joining lobby.`)
    joinLobby(io, socket)
  })

  // Single Game Events
  socket.on('createGame', ({ variant }, callback) =>
    createGameHandler(io, socket, user, variant, callback),
  )

  socket.on('joinGame', ({ gameId }, callback) =>
    joinGameHandler(io, socket, user, gameId, callback),
  )

  socket.on('playCard', (data, callback) => playCardHandler(io, user, data, callback))

  socket.on('resign', ({ gameId }, callback) => resignHandler(io, socket, user, gameId, callback))

  // Match Events
  socket.on('createMatch', (data, callback) => createMatchHandler(io, socket, user, data, callback))

  socket.on('joinMatch', ({ matchId }, callback) =>
    joinMatchHandler(io, socket, user, matchId, callback),
  )

  // acceptStake REMOVED — game starts immediately on join
  // No client needs to send acceptStake anymore

  // Disconnection & Reconnection
  socket.on('disconnect', () => handleDisconnect(io, socket))
  handleReconnect(io, socket)
}

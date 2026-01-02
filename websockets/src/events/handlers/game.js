import { createGame, getGame } from '../../state/games.js'
import { startTurnTimer, endGame } from '../timers/timers.js'
import { awardRemainingCardsToWinner, triggerBotMove } from '../gameplay/gameplay.js'
import { emitOpenGames } from '../lobby/lobby.js'
import { endMatch, getMatch } from '../../state/matches.js'
import { HAND_SIZE } from '../../constants/index.js'

export function resignHandler(io, socket, user, gameId, callback) {
  let game = getGame(gameId)

  if (!game) {
    // Fallback: Check if gameId is actually a matchId (Match View sends matchId on resign)
    const match = getMatch(gameId)
    if (match) {
      console.log(`[Resign] Player ${user.nickname} resigned directly from Match ${match.id}`)

      let winner = null
      if (match.players.player1?.id === user.id) winner = 'player2'
      else if (match.players.player2?.id === user.id) winner = 'player1'

      if (winner) {
        match.marks[winner] = 4
        // If a game is currently running inside this match, mark it ended too
        if (match.currentGame) {
          const currGame = getGame(match.currentGame)
          if (currGame) currGame.status = 'ended'
        }
        endMatch(match, io, { winnerKey: winner, reason: 'forfeit' })
        return
      }
    }
    return callback?.({ error: 'Game not found' })
  }

  let loser = null
  if (game.players.player1?.id === user.id) loser = 'player1'
  else if (game.players.player2?.id === user.id) loser = 'player2'

  if (!loser) return callback?.({ error: 'You are not in this game' })

  const winner = loser === 'player1' ? 'player2' : 'player1'

  // Forfeit logic: Award all remaining cards to winner (Standard Game Logic)
  // But wait, if it's a MATCH, resignation forfeits the WHOLE match.

  if (game.matchId) {
    const match = getMatch(game.matchId)
    if (match) {
      console.log(`[Resign] Player ${user.nickname} resigned. Forfeiting Match ${match.id}`)

      // Set marks to allow immediate win logic if needed, or just force end.
      // Rule: "forfeits all remaining games".
      // So winner gets the match win.

      // We can set marks to 4 for winner to simulate 'marks reached' or just pass a specific reason
      match.marks[winner] = 4

      // Also fail the current game so it closes properly?
      game.status = 'ended'
      // awardRemainingCards... logic is mostly visual for points, but for a full forfeit it matters less.

      endMatch(match, io, { winnerKey: winner, reason: 'forfeit' })
      return
    }
  }

  // Normal Standalone Resignation
  awardRemainingCardsToWinner(game, winner)
  endGame(game, io, { reason: 'resignation', winner })
}

export async function createGameHandler(io, socket, user, variant = '9', callback) {
  let gameId = `game_${Date.now()}`

  console.log(`[createGameHandler] variant: ${variant}`)
  const isSinglePlayer = variant.toLowerCase().startsWith('bot')
  let normVariant = variant

  if (isSinglePlayer) {
    const parts = variant.split('-')
    normVariant = parts[1] || '9'
  }
  console.log(`[createGameHandler] normVariant: ${normVariant}`)

  if (!isSinglePlayer) {
    try {
      const { default: axios } = await import('axios')
      const response = await axios.post(`${process.env.API_BASE_URL}/api/games`, {
        type: normVariant,
        status: 'Pending',
        player1_user_id: user.id,
      }, {
        headers: {
          'Authorization': `Bearer ${socket.handshake.auth?.token}`,
          'Accept': 'application/json'
        }
      })
      gameId = response.data.id
      console.log(`[createGameHandler] API created game ${gameId}`)
    } catch (error) {
      console.error('[createGameHandler] API Failed:', error.message)
      if (error.response?.data?.error === 'Insufficient coins') {
        return callback?.({ error: 'Insufficient coins' })
      }
      // If other error, maybe stop? For now we fall back to in-memory but coin deduction fails.
      // But user wants coins to work. So we should probably return error if API fails.
    }
  }

  const game = createGame({
    id: gameId,
    variant: normVariant,
    creator: { id: user.id, nickname: user.nickname },
  })

  if (isSinglePlayer) {
    game.isSinglePlayer = true
    game.players.player2 = {
      id: 'bot',
      nickname: 'Bot',
      disconnected: false,
      isBot: true,
    }

    startGameProperly(game)

    const firstTurn = Math.random() < 0.5 ? 'player1' : 'player2'
    game.turn = firstTurn

    socket.emit('gameStarted', {
      yourHand: game.hands.player1,
      opponentHandSize: game.hands.player2.length,
      trumpCard: game.trump,
      stockSize: game.stock.length + 1,
      youAre: 'player1',
      firstTurn,
      opponentNickname: 'Bot',
    })

    if (game.turn === 'player2') {
      setTimeout(() => triggerBotMove(io, game), 1000)
    } else {
      startTurnTimer(game, io)
    }
  }

  socket.join(String(gameId))
  emitOpenGames(io)

  socket.emit('gameCreated', gameId)
  callback?.({ gameId })
}

export function startGameProperly(game) {
  if (game.status !== 'waiting' || !game.players.player1 || !game.players.player2) return

  const size = HAND_SIZE[game.variant]

  // Deal player2 hand
  game.hands.player2 = game.stock.splice(0, size)

  // Set trump and stock
  game.trump = game.stock.pop()
  // console.log(
  //   `[TRUMP CARD ANALYSIS]: card: ${game.trump} suit: ${game.trumpSuit}`
  // );
  console.log({ trump: game.trump })
  // Status to playing
  game.status = 'playing'
  game.startTime = Date.now()
}

function getPlayerRole(game, user) {
  if (game.players.player1?.id === user.id) return 'player1'
  if (game.players.player2?.id === user.id) return 'player2'
  return null
}

function sendGameStarted(socket, game, playerRole) {
  const opponentRole = playerRole === 'player1' ? 'player2' : 'player1'
  const yourHand = game.hands[playerRole]
  const opponentHandSize = game.hands[opponentRole].length
  const opponentNickname = game.players[opponentRole]?.nickname || null
  const stockSize = game.stock.length + (game.trump ? 1 : 0)

  socket.emit('gameStarted', {
    yourHand,
    opponentHandSize,
    trumpCard: game.trump,
    stockSize,
    youAre: playerRole,
    firstTurn: game.turn,
    opponentNickname,
  })
}

function getSocketsForPlayer(io, gameId, playerId) {
  const roomSockets = io.sockets.adapter.rooms.get(gameId) || new Set()
  return [...roomSockets]
    .map((socketId) => io.sockets.sockets.get(socketId))
    .filter((s) => s && s.handshake.auth?.id === playerId)
}

export async function joinGameHandler(io, socket, user, gameId, callback) {
  const game = getGame(gameId)
  if (!game) return callback?.({ error: 'Game not found' })

  if (game.isSinglePlayer && game.players.player1?.id !== user.id) {
    return callback?.({ error: 'Cannot join a single player game' })
  }

  const playerRole = getPlayerRole(game, user)

  if (playerRole) {
    socket.join(String(gameId))
    // If game is already ended, send results
    if (game.status === 'ended' || game.status === 'Ended') {
      const winner = game.points.player1 >= 61 ? 'player1' : (game.points.player2 >= 61 ? 'player2' : null)
      socket.emit('gameEnded', { winner, reason: 'finished', points: game.points })
      return callback?.({ success: true, isRejoin: true })
    }

    // Sync Timer for rejoiner
    if (game.status === 'playing' && game.turnStartTime) {
      const elapsed = (Date.now() - game.turnStartTime) / 1000
      const remaining = Math.max(0, Math.ceil(20 - elapsed))
      socket.emit('turnStarted', {
        player: game.turn,
        seconds: remaining
      })
    }

    sendGameStarted(socket, game, playerRole)
    return callback?.({ success: true, isRejoin: true })
  }

  if (game.players.player2 && game.players.player2.id) {
    return callback?.({ error: 'Game already has a second player' })
  }

  // --- API Call to Join ---
  if (!game.isSinglePlayer) {
    try {
      const { default: axios } = await import('axios')
      await axios.put(`${process.env.API_BASE_URL}/api/games/${gameId}`, {
        status: 'Playing',
        player2_user_id: user.id
      }, {
        headers: {
          'Authorization': `Bearer ${socket.handshake.auth?.token}`,
          'Accept': 'application/json'
        }
      })
      console.log(`[joinGameHandler] API updated game ${gameId} with player2`)
    } catch (error) {
      console.error('[joinGameHandler] API Failed:', error.message)
      if (error.response?.data?.error === 'Insufficient coins') {
        return callback?.({ error: 'Insufficient coins' })
      }
      return callback?.({ error: 'Failed to join game' })
    }
  }
  // ------------------------

  game.players.player2 = {
    id: user.id,
    nickname: user.nickname,
    disconnected: false,
  }

  socket.join(String(gameId))
  emitOpenGames(io)

  io.to(gameId).emit('opponentJoined', { nickname: user.nickname })

  startGameProperly(game)

  const firstTurn = Math.random() < 0.5 ? 'player1' : 'player2'
  game.turn = firstTurn

  console.log({ hello_here: game.trump })
  const commonData = {
    trumpCard: game.trump,
    stockSize: game.stock.length + (game.trump ? 1 : 0),
    firstTurn,
  }

  const player1Sockets = getSocketsForPlayer(io, gameId, game.players.player1.id)
  player1Sockets.forEach((s) => {
    s.emit('gameStarted', {
      ...commonData,
      yourHand: game.hands.player1,
      opponentHandSize: game.hands.player2.length,
      youAre: 'player1',
      trumpCard: game.trump,
      opponentNickname: user.nickname,
    })
  })

  socket.emit('gameStarted', {
    ...commonData,
    yourHand: game.hands.player2,
    opponentHandSize: game.hands.player1.length,
    youAre: 'player2',
    trumpCard: game.trump,
    opponentNickname: game.players.player1.nickname,
  })

  startTurnTimer(game, io)

  callback?.({ success: true })
}

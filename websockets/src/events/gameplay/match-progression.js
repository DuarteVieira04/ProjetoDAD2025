import 'dotenv/config'
import { createGame, startGameProperly } from '../../state/games.js'
import { startTurnTimer as startMatchTurnTimer } from '../timers/match-timers.js'
import { endCurrentGame as endCurrentMatchGame } from '../timers/match-timers.js'
import { endMatch } from '../../state/matches.js'
import axios from 'axios'

console.log('[MatchProgression] Loaded w/ corrected paths')

export async function startGameInMatch(match, io) {
  console.log(`[MatchProgression] Starting new game in match ${match.id}`)

  let gameId
  try {
    const response = await axios.post(`${process.env.API_BASE_URL}/api/games`, {
      type: match.variant,
      status: 'Playing',
      player1_user_id: match.players.player1.id,
      player2_user_id: match.players.player2.id,
      match_id: match.id,
    })
    gameId = response.data.id
    console.log(`[MatchProgression] API created game ${gameId}`)
  } catch (_e) {
    console.error('[MatchProgression] API failed, using fallback ID')
    gameId = `game_${Date.now()}`
  }

  // Create game — but DO NOT deal player2 hand yet
  const game = createGame({
    id: gameId,
    variant: match.variant,
    matchId: match.id,
    players: match.players, // both players exist
  })

  // NOW deal player2 hand + reveal trump
  startGameProperly(game) // ← This is critical!

  // Set up game state
  match.currentGame = gameId
  match.games.push(gameId)

  const firstTurn = Math.random() < 0.5 ? 'player1' : 'player2'
  game.turn = firstTurn
  game.status = 'playing'
  game.startTime = Date.now()

  // === BROADCAST PRIVATE HANDS TO EACH CONNECTED PLAYER ===
  const roomSockets = io.sockets.adapter.rooms.get(match.id)
  io.to(match.id).emit('gameStarted', {
    matchId: match.id,
    gameId,
    trumpCard: game.trumpCard,
    stockSize: game.stock.length + (game.trumpCard ? 1 : 0),
    firstTurn,
  })
  if (!roomSockets) {
    console.warn(`[MatchProgression] No sockets in match room ${match.id}`)
  } else {
    for (const socketId of roomSockets) {
      const socket = io.sockets.sockets.get(socketId)
      if (!socket?.handshake?.auth?.id) continue

      const userId = socket.handshake.auth.id
      console.log({ userId })
      let role = null
      if (match.players.player1.id === userId) role = 'player1'
      else if (match.players.player2.id === userId) role = 'player2'

      if (!role) continue

      const opponentRole = role === 'player1' ? 'player2' : 'player1'

      socket.emit('gameStartedPrivate', {
        matchId: match.id,
        gameId: game.id,
        yourHand: game.hands[role],
        opponentHandSize: game.hands[opponentRole].length,
        youAre: role,
        opponentNickname: match.players[opponentRole].nickname,
        trumpCard: game.trumpCard,
        stockSize: game.stock.length + (game.trumpCard ? 1 : 0),
        firstTurn: game.turn,
      })

      console.log(`[MatchProgression] Sent hand to ${role} (${match.players[role].nickname})`)
    }
  }

  // Public game start info (for UI sync, spectators, etc.)

  // Start the turn timer
  startMatchTurnTimer(game, io)

  console.log(`[MatchProgression] Game ${gameId} fully started in match ${match.id}`)
}

export function handleMatchGameEnd(match, game, io, extra = {}) {
  const winnerKey =
    extra.winner || (game.points.player1 > game.points.player2 ? 'player1' : 'player2')
  const winnerPoints = game.points[winnerKey]
  let marksAwarded = 0
  const isDraw = game.points.player1 === game.points.player2

  if (!isDraw) {
    if (winnerPoints === 120) {
      // Bandeira — immediate match win
      match.marks[winnerKey] = 4
      endCurrentMatchGame(game, io, { winner: winnerKey })
      endMatch(match, io, { winner: winnerKey, reason: 'bandeira' })
      return
    }

    if (winnerPoints >= 91) marksAwarded = 2
    else if (winnerPoints >= 61) marksAwarded = 1

    match.marks[winnerKey] += marksAwarded

    // Accumulate total points across match (optional for display)
    match.points.player1 += game.points.player1
    match.points.player2 += game.points.player2
  }

  // Notify clients of marks update
  io.to(match.id).emit('matchUpdated', {
    currentMarks: match.marks,
    marksAwarded,
    gamePoints: game.points,
    totalPoints: match.points,
  })

  // End current hand (client animation, etc.)
  endCurrentMatchGame(game, io, { winner: winnerKey })

  // Check for match victory
  if (Math.max(match.marks.player1, match.marks.player2) >= 4) {
    const matchWinner = match.marks.player1 >= 4 ? 'player1' : 'player2'
    endMatch(match, io, { winner: matchWinner, reason: 'marks_reached' })
    return
  }

  // Start next hand after delay
  console.log('[MatchProgression] Scheduling next game in 5 seconds')
  setTimeout(() => startGameInMatch(match, io), 5000)
}

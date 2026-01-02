import { TIMER_SECONDS } from '../../constants/index.js'
import { awardRemainingCardsToWinner } from '../gameplay/gameplay.js'

export function startTurnTimer(game, io) {
  if (game.timer) {
    clearTimeout(game.timer)
    game.timer = null
  }

  // Matches: room = matchId
  const roomId = game.matchId
  if (!roomId) {
    console.error('[MatchTimer] No matchId on game object!', game.id)
    return
  }

  console.log(`[MatchTimer] Starting turn for ${game.turn} → match room ${roomId}`)

  game.timer = setTimeout(async () => {
    console.log(`[MatchTimer] ${game.turn} timed out in match room ${roomId}`)
    const loser = game.turn
    const winner = loser === 'player1' ? 'player2' : 'player1'

    // Dynamically import to avoid circular dependency
    const { handleMatchGameEnd } = await import('../gameplay/match-progression.js')
    const { getMatch } = await import('../../state/matches.js')

    // Retrieve the match object! (game.match is undefined)
    const match = getMatch(game.matchId)
    if (match) {
      // Properly end the game logic (card award happens inside specific handlers or here?)
      // awardRemainingCardsToWinner(game, winner) <-- This is usually for play-out
      // For timeout, we might just want to award points or forfeit?
      // User log showed: [Forfeit] Awarded 118 points.
      // So awardRemainingCardsToWinner IS needed.

      const { awardRemainingCardsToWinner } = await import('../gameplay/gameplay.js')
      awardRemainingCardsToWinner(game, winner)

      // Call the MAIN match progression handler
      handleMatchGameEnd(match, game, io, { winner, reason: 'timeout' })
    } else {
      console.error('[MatchTimer] Could not find match object for timeout:', game.matchId)
      endCurrentGame(game, io, { reason: 'timeout', winner })
    }
  }, TIMER_SECONDS * 1000)

  io.to(roomId).emit('turnStarted', {
    player: game.turn,
    seconds: TIMER_SECONDS,
  })
}

export function endCurrentGame(game, io, extra = {}) {
  if (game.timer) {
    clearTimeout(game.timer)
    game.timer = null
  }

  const roomId = game.matchId

  const { player1, player2 } = game.points
  let winner = extra.winner || null
  if (!winner) {
    if (player1 >= 61) winner = 'player1'
    else if (player2 >= 61) winner = 'player2'
  }

  console.log(`[MatchTimer] Current game ended — winner: ${winner || 'draw'}`)

  io.to(roomId).emit('gameEnded', {
    winner,
    reason: extra.reason || (winner ? 'normal' : 'draw'),
    points: game.points,
    ...extra,
  })
}

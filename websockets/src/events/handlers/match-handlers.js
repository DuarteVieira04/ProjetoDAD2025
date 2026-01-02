import { createMatch, getMatch } from '../../state/matches.js'
import { emitOpenMatches } from '../lobby/match-lobby.js'
import { startGameInMatch } from '../gameplay/match-progression.js'

// CREATE MATCH
export function createMatchHandler(io, socket, user, { matchId, variant, stake }, callback) {
  if (!matchId) return callback?.({ error: 'Missing matchId from API' })

  createMatch({
    id: matchId,
    variant: variant || '9',
    stake: stake || 3,
    creator: { id: user.id, nickname: user.nickname },
  })

  socket.join(matchId)
  emitOpenMatches(io)

  socket.emit('matchCreated', { matchId })
  callback?.({ matchId })
}

// JOIN MATCH
export function joinMatchHandler(io, socket, user, matchId, callback) {
  const match = getMatch(matchId)
  if (!match) return callback?.({ error: 'Match not found' })

  // Rejoin case
  if (match.players.player1?.id === user.id || match.players.player2?.id === user.id) {
    socket.join(matchId)
    return callback?.({ success: true, isRejoin: true })
  }

  if (match.players.player2) return callback?.({ error: 'Match full' })

  // Add the second player
  match.players.player2 = {
    id: user.id,
    nickname: user.nickname,
    disconnected: false,
  }

  // SKIP NEGOTIATION — GO STRAIGHT TO PLAYING
  match.status = 'playing'

  socket.join(matchId)
  emitOpenMatches(io)

  // Notify both players
  io.to(matchId).emit('opponentJoined', { nickname: user.nickname })
  io.to(matchId).emit('matchStarted', {
    stake: match.stake,
    variant: match.variant,
  })

  // START THE GAME IMMEDIATELY
  startGameInMatch(match, io)

  callback?.({ success: true })
}

// ACCEPT / REJECT STAKE — KEPT AND EXPORTED
export function acceptStakeHandler(io, socket, user, { matchId, accepted }, callback) {
  const match = getMatch(matchId)
  if (!match || match.status !== 'negotiating') {
    return callback?.({ error: 'Match not in negotiation state' })
  }

  // Only the joiner (player2) can accept or reject
  if (match.players.player2?.id !== user.id) {
    return callback?.({
      error: 'Only the joining player can accept or reject the stake',
    })
  }

  if (accepted) {
    match.status = 'playing'

    io.to(matchId).emit('stakeConfirmed', {
      finalStake: match.stake,
      accepted: true,
    })

    match.startTime = Date.now()
    io.to(matchId).emit('matchStarted', {
      stake: match.stake,
      variant: match.variant,
    })

    startGameInMatch(match, io)
  } else {
    io.to(matchId).emit('stakeConfirmed', {
      finalStake: match.stake,
      accepted: false,
    })
    // Optional: clean up match, refund coins via API, etc.
  }

  callback?.({ success: true })
}

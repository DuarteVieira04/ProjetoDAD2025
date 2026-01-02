import { getOpenMatches } from '../../state/matches.js'

export function emitOpenMatches(io) {
  const matches = getOpenMatches().map((m) => ({
    matchId: m.id,
    creator: m.players.player1.nickname,
    variant: m.variant,
    stake: m.stake,
  }))
  io.to('lobby').emit('openMatchesUpdated', matches)
}

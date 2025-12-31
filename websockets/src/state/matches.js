// state/matches.js
const matches = new Map(); // matchId → match object

export function createMatch(data) {
  const match = {
    id: data.id,
    variant: data.variant,
    stake: data.stake || 3,
    players: data.players || {
      player1: {
        id: data.creator.id,
        nickname: data.creator.nickname,
        disconnected: false,
      },
      player2: null,
    },
    marks: { player1: 0, player2: 0 },
    points: { player1: 0, player2: 0 },
    games: [],
    currentGame: null,
    status: "pending",
    startTime: null,
    proposedStake: null,
    proposer: null,
    negotiationTimer: null,
  };
  match.id = String(match.id);
  matches.set(match.id, match);
  return match;
}

export function getMatch(id) {
  return matches.get(String(id));
}

export function getOpenMatches() {
  return Array.from(matches.values()).filter(
    (m) => m.status === "pending" && !m.players.player2
  );
}

export function deleteMatch(id) {
  matches.delete(String(id));
}

// handlers/matchHandlers.js
import { createMatch, getMatch } from "../../state/matches.js";
import { emitOpenMatches } from "../lobby/match-lobby.js";
import { startGameInMatch } from "../gameplay/match-progression.js";

export function createMatchHandler(
  io,
  socket,
  user,
  { matchId, variant, stake },
  callback
) {
  // Logic: API has already created the match and deducted coins.
  // We just initialize the socket state.

  if (!matchId) return callback?.({ error: "Missing matchId from API" });

  const match = createMatch({
    id: matchId,
    variant: variant || "9",
    stake: stake || 3,
    creator: { id: user.id, nickname: user.nickname },
  });

  socket.join(matchId);
  emitOpenMatches(io);

  socket.emit("matchCreated", matchId);
  callback?.({ matchId });
}

export function joinMatchHandler(io, socket, user, matchId, callback) {
  const match = getMatch(matchId);
  if (!match) return callback?.({ error: "Match not found" });
  if (user.coins_balance < match.stake)
    return callback?.({ error: "Insufficient coins for stake" });

  if (match.players.player1.id === user.id) {
    socket.join(matchId);
    // Sync state if needed
    return callback?.({ success: true, isRejoin: true });
  }

  if (match.players.player2) return callback?.({ error: "Match full" });

  match.players.player2 = {
    id: user.id,
    nickname: user.nickname,
    disconnected: false,
  };
  match.status = "negotiating"; // Or 'playing'

  socket.join(matchId);
  emitOpenMatches(io);

  io.to(matchId).emit("opponentJoined", { nickname: user.nickname });

  startStakeNegotiationTimer(match, io);
  callback?.({ success: true });
}

export function proposeStakeHandler(
  io,
  socket,
  user,
  { matchId, newStake },
  callback
) {
  const match = getMatch(matchId);
  if (!match || match.status !== "negotiating")
    return callback?.({ error: "Invalid match state" });
  if (newStake <= match.stake || newStake > 100)
    return callback?.({ error: "Invalid new stake" });

  if (
    user.coins_balance < newStake ||
    match.players[match.players.player1.id === user.id ? "player2" : "player1"]
      .coins_balance < newStake
  ) {
    return callback?.({ error: "Insufficient coins for proposed stake" });
  }

  match.proposedStake = newStake;
  match.proposer = user.id === match.players.player1.id ? "player1" : "player2";

  io.to(match.id).emit("stakeProposed", {
    proposedStake: newStake,
    proposer: match.proposer,
  });
  callback?.({ success: true });
}

export function acceptStakeHandler(
  io,
  socket,
  user,
  { matchId, accepted },
  callback
) {
  const match = getMatch(matchId);
  if (!match || !match.proposedStake)
    return callback?.({ error: "No proposal pending" });

  const proposerKey = match.proposer;
  const acceptorKey = proposerKey === "player1" ? "player2" : "player1";
  if (match.players[acceptorKey].id !== user.id)
    return callback?.({ error: "Not your decision" });

  if (accepted) match.stake = match.proposedStake;
  match.proposedStake = null;
  match.proposer = null;

  io.to(match.id).emit("stakeConfirmed", { finalStake: match.stake, accepted });

  startMatch(match, io);
  callback?.({ success: true });
}

// Extracted helpers
function startStakeNegotiationTimer(match, io) {
  match.negotiationTimer = setTimeout(() => {
    startMatch(match, io);
  }, 30000);

  io.to(match.id).emit("stakeNegotiationStarted", {
    currentStake: match.stake,
    seconds: 30,
  });
}

function startMatch(match, io) {
  if (match.negotiationTimer) clearTimeout(match.negotiationTimer);

  // Coins were deducted by API upon creation/join.
  // We don't deduct here again.

  match.startTime = Date.now();
  match.status = "playing";

  io.to(match.id).emit("matchStarted", {
    stake: match.stake,
    variant: match.variant,
  });
  startGameInMatch(match, io);
}

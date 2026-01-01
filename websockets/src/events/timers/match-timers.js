// src/timers/match-timers.js

import { endMatch as cleanupMatch } from "../../state/matches.js"; // rename to avoid conflict
import { TIMER_SECONDS } from "../../constants/index.js";

import { awardRemainingCardsToWinner } from "../gameplay/gameplay.js";

export function startTurnTimer(game, io) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }

  // Matches: room = matchId
  const roomId = game.matchId;
  if (!roomId) {
    console.error("[MatchTimer] No matchId on game object!", game.id);
    return;
  }

  console.log(
    `[MatchTimer] Starting turn for ${game.turn} → match room ${roomId}`
  );

  game.timer = setTimeout(() => {
    console.log(`[MatchTimer] ${game.turn} timed out in match room ${roomId}`);
    const loser = game.turn;
    const winner = loser === "player1" ? "player2" : "player1";

    awardRemainingCardsToWinner(game, winner);
    endCurrentGame(game, io, { reason: "timeout", winner });
  }, TIMER_SECONDS * 1000);

  io.to(roomId).emit("turnStarted", {
    player: game.turn,
    seconds: TIMER_SECONDS,
  });
}

export function endCurrentGame(game, io, extra = {}) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }

  const roomId = game.matchId;

  const { player1, player2 } = game.points;
  let winner = extra.winner || null;
  if (!winner) {
    if (player1 >= 61) winner = "player1";
    else if (player2 >= 61) winner = "player2";
  }

  console.log(`[MatchTimer] Current game ended — winner: ${winner || "draw"}`);

  io.to(roomId).emit("gameEnded", {
    winner,
    reason: extra.reason || (winner ? "normal" : "draw"),
    points: game.points,
    ...extra,
  });
}

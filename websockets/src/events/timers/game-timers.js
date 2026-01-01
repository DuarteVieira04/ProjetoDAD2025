// src/timers/game-timers.js

import { deleteGame } from "../../state/games.js";
import { TIMER_SECONDS, GAME_STATUS } from "../../constants/index.js";
import { emitOpenGames } from "../lobby/lobby.js";
import axios from "axios";

import { awardRemainingCardsToWinner } from "../gameplay/gameplay.js";

export function startTurnTimer(game, io) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }

  // Single games: room = game.id
  const roomId = game.id;

  console.log(`[GameTimer] Starting turn for ${game.turn} → room ${roomId}`);

  game.timer = setTimeout(() => {
    console.log(`[GameTimer] ${game.turn} timed out in game ${roomId}`);
    const loser = game.turn;
    const winner = loser === "player1" ? "player2" : "player1";

    awardRemainingCardsToWinner(game, winner);
    endGame(game, io, { reason: "timeout", winner });
  }, TIMER_SECONDS * 1000);

  io.to(roomId).emit("turnStarted", {
    player: game.turn,
    seconds: TIMER_SECONDS,
  });
}

export async function endGame(game, io, extra = {}) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }

  const roomId = game.id;

  const { player1, player2 } = game.points;
  let winner = extra.winner || null;
  if (!winner) {
    if (player1 >= 61) winner = "player1";
    else if (player2 >= 61) winner = "player2";
  }

  console.log(
    `[GameTimer] Ending single game ${game.id} — winner: ${winner || "draw"}`
  );

  // Save to DB FIRST (triggers coin update)
  await saveGameToDB(game, winner, extra.reason);

  io.to(roomId).emit("gameEnded", {
    winner,
    reason: extra.reason || (winner ? "normal" : "draw"),
    points: game.points,
    ...extra,
  });



  game.status = GAME_STATUS.ENDED;

  setTimeout(() => {
    deleteGame(game.id);
    emitOpenGames(io);
  }, 30_000);
}

async function saveGameToDB(game, winner, reason) {
  if (String(game.id).startsWith("game_")) {
    console.log("[GameDB] Skipping save for temp single game", game.id);
    return;
  }

  try {
    const payload = {
      status: "Ended",
      winner_user_id:
        winner === "player1"
          ? game.players.player1?.id
          : winner === "player2"
            ? game.players.player2?.id
            : null,
      loser_user_id:
        winner === "player1"
          ? game.players.player2?.id
          : winner === "player2"
            ? game.players.player1?.id
            : null,
      player1_points: game.points.player1,
      player2_points: game.points.player2,
      is_draw: !winner,
      total_time: game.startTime
        ? Math.round((Date.now() - game.startTime) / 1000)
        : null,
    };

    console.log(`[GameDB] Updating single game ${game.id}...`, payload);
    await axios.put(
      `${process.env.API_BASE_URL}/api/games/${game.id}`,
      payload
    );
    console.log("[GameDB] Single game updated");
  } catch (error) {
    console.error(
      "[GameDB] Failed to save single game:",
      error.response?.data || error.message
    );
  }
}

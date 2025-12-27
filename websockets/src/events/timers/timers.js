import { deleteGame } from "../../state/games.js";
import { TIMER_SECONDS, GAME_STATUS } from "../../constants/index.js";
import { emitOpenGames } from "../lobby/lobby.js";
import axios from "axios";

import {
  executeMove,
  awardRemainingCardsToWinner,
} from "../gameplay/gameplay.js";

export function startTurnTimer(game, io) {
  if (game.timer) clearTimeout(game.timer);

  game.timer = setTimeout(() => {
    // Timeout behavior: Forfeit game
    console.log(`[Timer] Check: ${game.turn} timed out.`);
    const loser = game.turn;
    const winner = loser === "player1" ? "player2" : "player1";

    // Award all remaining cards to winner
    awardRemainingCardsToWinner(game, winner);

    endGame(game, io, { reason: "timeout", winner });
  }, TIMER_SECONDS * 1000);

  io.to(game.id).emit("turnStarted", {
    player: game.turn,
    seconds: TIMER_SECONDS,
  });
}

export function endGame(game, io, extra = {}) {
  if (game.timer) clearTimeout(game.timer);

  const { player1, player2 } = game.points;
  let winner = extra.winner || null;
  if (!winner) {
    if (player1 >= 61) winner = "player1";
    else if (player2 >= 61) winner = "player2";
  }

  io.to(game.id).emit("gameEnded", {
    winner,
    reason: extra.reason || (winner ? "normal" : "draw"),
    points: game.points,
    ...extra,
  });

  // Save to DB
  saveGameToDB(game, winner, extra.reason);

  game.status = GAME_STATUS.ENDED;
  setTimeout(() => {
    deleteGame(game.id);
    emitOpenGames(io);
  }, 30_000);
}

async function saveGameToDB(game, winner, reason) {
  try {
    const payload = {
      type: game.variant,
      status: "Ended", // Bisca games here are always 'Ended' if we reach this point normally
      player1_user_id: game.players.player1.id,
      player2_user_id: game.players.player2.id,
      winner_user_id:
        winner === "player1"
          ? game.players.player1.id
          : winner === "player2"
            ? game.players.player2.id
            : null,
      loser_user_id:
        winner === "player1"
          ? game.players.player2.id
          : winner === "player2"
            ? game.players.player1.id
            : null,
      player1_points: game.points.player1,
      player2_points: game.points.player2,
      is_draw: !winner,
      total_time: game.startTime
        ? Math.round((Date.now() - game.startTime) / 1000)
        : null,
      // began_at/ended_at ? We don't track start time in memory adequately right now, maybe skip or add later
      // total_time ...
    };

    console.log("[GameDB] Saving game...", payload);
    const response = await axios.post(
      "http://127.0.0.1:8000/api/games",
      payload
    );
    console.log("[GameDB] Saved:", response.data.id);
  } catch (error) {
    console.error(
      "[GameDB] Failed to save game:",
      error.response?.data || error.message
    );
  }
}

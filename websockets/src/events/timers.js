import { deleteGame } from "../state/games.js";
import { TIMER_SECONDS, GAME_STATUS } from "../constants/index.js";
import { emitOpenGames } from "./lobby.js";

export function startTurnTimer(game, io) {
  if (game.timer) clearTimeout(game.timer);

  game.timer = setTimeout(() => {
    const loser = game.turn;
    const winner = loser === "player1" ? "player2" : "player1";
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
  let winner = null;
  if (player1 >= 61) winner = "player1";
  else if (player2 >= 61) winner = "player2";

  io.to(game.id).emit("gameEnded", {
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

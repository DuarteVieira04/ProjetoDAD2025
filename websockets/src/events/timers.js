import { deleteGame } from "../state/games.js";
import { TIMER_SECONDS, GAME_STATUS } from "../constants/index.js";
import { emitOpenGames } from "./lobby.js";

import { executeMove, pickRandomValidCard } from "./gameplay.js";

export function startTurnTimer(game, io) {
  if (game.timer) clearTimeout(game.timer);

  game.timer = setTimeout(() => {
    // Auto-play
    const playerKey = game.turn;
    const card = pickRandomValidCard(game, playerKey);

    if (card) {
      // Find card index to remove it (executeMove expects it removed?)
      // Wait, `playCardHandler` removes it. 
      // `executeMove` expects `playedCard` (already removed/detached object) 
      // AND it expects the game state to NOT have the card in hand?
      // Let's check `gameplay.js`.

      // `playCardHandler`:
      // const playedCard = hand.splice(cardIndex, 1)[0];
      // executeMove(..., playedCard);

      // So yes, I need to remove it here.
      const hand = game.hands[playerKey];
      const index = hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
      if (index !== -1) {
        const playedCard = hand.splice(index, 1)[0];
        console.log(`[AutoPlay] ${playerKey} timeout. Playing ${playedCard.suit}-${playedCard.rank}`);
        executeMove(io, game, playerKey, playedCard);
      } else {
        console.error("AutoPlay failed: card not found in hand");
        // Fallback to end game if something is totally broken
        const loser = game.turn;
        const winner = loser === "player1" ? "player2" : "player1";
        endGame(game, io, { reason: "error_autoplay", winner });
      }
    } else {
      // No cards left? Should be game over already.
      const loser = game.turn;
      const winner = loser === "player1" ? "player2" : "player1";
      endGame(game, io, { reason: "timeout_no_cards", winner });
    }
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

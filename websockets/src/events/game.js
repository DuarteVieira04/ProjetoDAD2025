import { createGame, getGame } from "../state/games.js";
import { startTurnTimer } from "./timers.js";
import { emitOpenGames } from "./lobby.js";

export function createGameHandler(io, socket, user, variant = "9", callback) {
  const gameId = `game_${Date.now()}`;
  const game = createGame({
    id: gameId,
    variant,
    creator: { id: user.id, nickname: user.nickname },
  });

  socket.join(gameId);
  emitOpenGames(io);

  socket.emit("gameCreated", gameId);
  //   socket.emit("gameStarted", {
  //     yourHand: game.hands.player1,
  //     opponentHandSize: 0,
  //     trumpSuit: game.trumpSuit,
  //     trumpCardFilename: game.trumpCard.filename,
  //     stockSize: game.stock.length + 1,
  //     youAre: "player1",
  //   });
}

export function joinGameHandler(io, socket, user, gameId, callback) {
  const game = getGame(gameId);

  if (!game) return callback?.({ error: "Game not found" });

  // Prevent joining own game
  console.log(`[JoinGame] Checking P1 (${game.players.player1?.id} - ${typeof game.players.player1?.id}) vs User (${user.id} - ${typeof user.id})`);

  if (game.players.player1?.id === user.id) {
    return callback?.({ error: "Cannot join your own game" });
  }

  // Prevent joining if player2 is already assigned
  if (game.players.player2 && game.players.player2.id) {
    return callback?.({ error: "Game already has a second player" });
  }

  // Add the second player
  game.players.player2 = {
    id: user.id,
    nickname: user.nickname,
    disconnected: false,
  };

  // Update status
  game.status =
    game.players.player1 && game.players.player2 ? "playing" : "waiting";

  socket.join(gameId);
  emitOpenGames(io);

  io.to(gameId).emit("opponentJoined", { nickname: user.nickname });

  socket.broadcast.to(gameId).emit("gameStarted", {
    yourHand: game.hands.player1,
    opponentHandSize: game.hands.player2.length,
    trumpSuit: game.trumpSuit,
    trumpCardFilename: game.trumpCard.filename,
    stockSize: game.stock.length + 1,
    youAre: "player1",
    firstTurn: "player1",
  });

  socket.emit("gameStarted", {
    yourHand: game.hands.player2,
    opponentHandSize: game.hands.player1.length,
    trumpSuit: game.trumpSuit,
    trumpCardFilename: game.trumpCard.filename,
    stockSize: game.stock.length + 1,
    youAre: "player2",
    firstTurn: "player1", // Player 1 always starts? Or random? Logic says P1 for now.
  });

  if (game.status === "playing") {
    startTurnTimer(game, io);
  }

  callback?.({ success: true });
}

import { createGame, getGame } from "../state/games.js";
import { startTurnTimer, endGame } from "./timers.js";
import { emitOpenGames } from "./lobby.js";

export function resignHandler(io, socket, user, gameId, callback) {
  const game = getGame(gameId);
  if (!game) return callback?.({ error: "Game not found" });

  let loser = null;
  if (game.players.player1?.id === user.id) loser = "player1";
  else if (game.players.player2?.id === user.id) loser = "player2";

  if (!loser) return callback?.({ error: "You are not in this game" });

  const winner = loser === "player1" ? "player2" : "player1";
  endGame(game, io, { reason: "resignation", winner });
}

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
  callback?.({ gameId });
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

  // Check if rejoining (Player 1)
  if (game.players.player1?.id === user.id) {
    socket.join(gameId);

    // Send state to Player 1 (Creator)
    socket.emit("gameStarted", {
      yourHand: game.hands.player1,
      opponentHandSize: game.hands.player2 ? game.hands.player2.length : 0,
      trumpSuit: game.trumpSuit,
      trumpCardFilename: game.trumpCard.filename,
      stockSize: game.stock.length + 1,
      youAre: "player1",
      firstTurn: game.turn,
    });

    // If game is running, also send playing status?
    // Ideally we should have a 'gameStateSync' but 'gameStarted' works for now to init stores.

    return callback?.({ success: true, isRejoin: true });
  }

  // Check if rejoining (Player 2)
  if (game.players.player2?.id === user.id) {
    socket.join(gameId);
    socket.emit("gameStarted", {
      yourHand: game.hands.player2,
      opponentHandSize: game.hands.player1.length,
      trumpSuit: game.trumpSuit,
      trumpCardFilename: game.trumpCard.filename,
      stockSize: game.stock.length + 1,
      youAre: "player2",
      firstTurn: game.turn,
    });
    return callback?.({ success: true, isRejoin: true });
  }

  // Prevent joining if player2 is already assigned (and it's not me)
  if (game.players.player2 && game.players.player2.id) {
    return callback?.({ error: "Game already has a second player" });
  }

  // Add the second player (New Join)
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

  // Determine random first turn
  const firstTurn = Math.random() < 0.5 ? "player1" : "player2";
  game.turn = firstTurn;

  socket.broadcast.to(gameId).emit("gameStarted", {
    yourHand: game.hands.player1,
    opponentHandSize: game.hands.player2.length,
    trumpSuit: game.trumpSuit,
    trumpCardFilename: game.trumpCard.filename,
    stockSize: game.stock.length + 1,
    youAre: "player1",
    firstTurn: firstTurn,
  });

  socket.emit("gameStarted", {
    yourHand: game.hands.player2,
    opponentHandSize: game.hands.player1.length,
    trumpSuit: game.trumpSuit,
    trumpCardFilename: game.trumpCard.filename,
    stockSize: game.stock.length + 1,
    youAre: "player2",
    firstTurn: game.turn,
  });

  if (game.status === "playing") {
    startTurnTimer(game, io);
  }

  callback?.({ success: true });
}

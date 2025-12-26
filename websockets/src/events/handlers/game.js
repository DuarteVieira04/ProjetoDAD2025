import { createGame, getGame } from "../../state/games.js";
import { startTurnTimer, endGame } from "../timers/timers.js";
import { awardRemainingCardsToWinner, triggerBotMove } from "../gameplay/gameplay.js";
import { emitOpenGames } from "../lobby/lobby.js";

export function resignHandler(io, socket, user, gameId, callback) {
  const game = getGame(gameId);
  if (!game) return callback?.({ error: "Game not found" });

  let loser = null;
  if (game.players.player1?.id === user.id) loser = "player1";
  else if (game.players.player2?.id === user.id) loser = "player2";

  if (!loser) return callback?.({ error: "You are not in this game" });

  const winner = loser === "player1" ? "player2" : "player1";

  // Forfeit logic: Award all remaining cards to winner
  awardRemainingCardsToWinner(game, winner);

  endGame(game, io, { reason: "resignation", winner });
}

export function createGameHandler(io, socket, user, variant = "9", callback) {
  const gameId = `game_${Date.now()}`;
  // Determine if single player (bot game)
  const isSinglePlayer = variant.toLowerCase().startsWith("bot");
  let normVariant = variant;

  if (isSinglePlayer) {
    const parts = variant.split('-'); // e.g. "bot-3" or "bot-9"
    normVariant = parts[1] || "9";
  }

  const game = createGame({
    id: gameId,
    variant: normVariant,
    creator: { id: user.id, nickname: user.nickname },
  });

  if (isSinglePlayer) {
    game.isSinglePlayer = true;
    game.players.player2 = {
      id: "bot",
      nickname: "Bot",
      disconnected: false,
      isBot: true
    };
    game.status = "playing";
    game.startTime = Date.now();

    // Determine random first turn
    const firstTurn = Math.random() < 0.5 ? "player1" : "player2";
    game.turn = firstTurn;

    // Send gameStarted to creator (Player 1)
    socket.emit("gameStarted", {
      yourHand: game.hands.player1,
      opponentHandSize: game.hands.player2.length,
      trumpSuit: game.trumpSuit,
      trumpCardFilename: game.trumpCard ? game.trumpCard.filename : null,
      stockSize: game.stock.length + 1,
      youAre: "player1",
      firstTurn: firstTurn,
      opponentNickname: game.players.player2 ? game.players.player2.nickname : null,
    });

    // Start turn loop
    if (game.turn === "player1") {
      startTurnTimer(game, io);
    } else {
      // Bot turn
      setTimeout(() => {
        triggerBotMove(game, io);
      }, 1000);
    }
  }

  socket.join(gameId);
  emitOpenGames(io);

  socket.emit("gameCreated", gameId);
  callback?.({ gameId });
}

export function joinGameHandler(io, socket, user, gameId, callback) {
  const game = getGame(gameId);

  if (!game) return callback?.({ error: "Game not found" });

  if (game.isSinglePlayer) {
    if (game.players.player1?.id === user.id) {
      // Rejoining own single player game
      // Fall through to Player 1 logic
    } else {
      return callback?.({ error: "Cannot join a single player game" });
    }
  }

  // Prevent joining own game
  console.log(`[JoinGame] Checking P1 (${game.players.player1?.id} - ${typeof game.players.player1?.id}) vs User (${user.id} - ${typeof user.id})`);

  // Check if rejoining (Player 1)
  if (game.players.player1?.id === user.id) {
    console.log(`[JoinGame] P1 Rejoining: ${user.id}`);
    socket.join(gameId);

    // Send state to Player 1 (Creator)
    console.log(`[JoinGame] Emitting gameStarted to P1...`);
    socket.emit("gameStarted", {
      yourHand: game.hands.player1,
      opponentHandSize: game.hands.player2 ? game.hands.player2.length : 0,
      trumpSuit: game.trumpSuit,
      trumpCardFilename: game.trumpCard ? game.trumpCard.filename : null,
      stockSize: game.stock.length + 1,
      youAre: "player1",
      firstTurn: game.turn,
      opponentNickname: game.players.player2 ? game.players.player2.nickname : null,
    });

    return callback?.({ success: true, isRejoin: true });
  }

  // Check if rejoining (Player 2)
  if (game.players.player2?.id === user.id) {
    socket.join(gameId);
    socket.emit("gameStarted", {
      yourHand: game.hands.player2,
      opponentHandSize: game.hands.player1.length,
      trumpSuit: game.trumpSuit,
      trumpCardFilename: game.trumpCard ? game.trumpCard.filename : null,
      stockSize: game.stock.length + 1,
      youAre: "player2",
      firstTurn: game.turn,
      opponentNickname: game.players.player1 ? game.players.player1.nickname : null,
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
  const isPlaying = game.players.player1 && game.players.player2;
  game.status = isPlaying ? "playing" : "waiting";
  if (isPlaying) {
    game.startTime = Date.now();
  }

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
    trumpCardFilename: game.trumpCard ? game.trumpCard.filename : null,
    stockSize: game.stock.length + 1,
    youAre: "player1",
    firstTurn: firstTurn,
    opponentNickname: game.players.player2 ? game.players.player2.nickname : null,
  });

  socket.emit("gameStarted", {
    yourHand: game.hands.player2,
    opponentHandSize: game.hands.player1.length,
    trumpSuit: game.trumpSuit,
    trumpCardFilename: game.trumpCard ? game.trumpCard.filename : null,
    stockSize: game.stock.length + 1,
    youAre: "player2",
    firstTurn: game.turn,
    opponentNickname: game.players.player1 ? game.players.player1.nickname : null,
  });

  if (game.status === "playing") {
    startTurnTimer(game, io);
  }

  callback?.({ success: true });
}

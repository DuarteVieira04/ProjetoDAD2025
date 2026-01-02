import { createGame, getGame } from "../../state/games.js";
import { startTurnTimer, endGame } from "../timers/timers.js";
import {
  awardRemainingCardsToWinner,
  triggerBotMove,
} from "../gameplay/gameplay.js";
import { emitOpenGames } from "../lobby/lobby.js";
import { endMatch, getMatch } from "../../state/matches.js";
import { HAND_SIZE } from "../../constants/index.js";

export function resignHandler(io, socket, user, gameId, callback) {
  const game = getGame(gameId);
  if (!game) return callback?.({ error: "Game not found" });

  let loser = null;
  if (game.players.player1?.id === user.id) loser = "player1";
  else if (game.players.player2?.id === user.id) loser = "player2";

  if (!loser) return callback?.({ error: "You are not in this game" });

  const winner = loser === "player1" ? "player2" : "player1";

  // Forfeit logic: Award all remaining cards to winner (Standard Game Logic)
  // But wait, if it's a MATCH, resignation forfeits the WHOLE match.

  if (game.matchId) {
    const match = getMatch(game.matchId);
    if (match) {
      console.log(
        `[Resign] Player ${user.nickname} resigned. Forfeiting Match ${match.id}`
      );

      // Set marks to allow immediate win logic if needed, or just force end.
      // Rule: "forfeits all remaining games".
      // So winner gets the match win.

      // We can set marks to 4 for winner to simulate 'marks reached' or just pass a specific reason
      match.marks[winner] = 4;

      // Also fail the current game so it closes properly?
      game.status = "ended";
      // awardRemainingCards... logic is mostly visual for points, but for a full forfeit it matters less.

      endMatch(match, io, { winnerKey: winner, reason: "forfeit" });
      return;
    }
  }

  // Normal Standalone Resignation
  awardRemainingCardsToWinner(game, winner);
  endGame(game, io, { reason: "resignation", winner });
}

export function createGameHandler(io, socket, user, variant = "9", callback) {
  const gameId = `game_${Date.now()}`;
  // Determine if single player (bot game)
  console.log(`[createGameHandler] variant: ${variant}`);
  const isSinglePlayer = variant.toLowerCase().startsWith("bot");
  let normVariant = variant;

  if (isSinglePlayer) {
    const parts = variant.split("-"); // e.g. "bot-3" or "bot-9"
    normVariant = parts[1] || "9";
  }
  console.log(`[createGameHandler] normVariant: ${normVariant}`);

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
      isBot: true,
    };

    startGameProperly(game); // ← This deals player2 (bot) hand and sets trump

    const firstTurn = Math.random() < 0.5 ? "player1" : "player2";
    game.turn = firstTurn;

    socket.emit("gameStarted", {
      yourHand: game.hands.player1,
      opponentHandSize: game.hands.player2.length,
      trumpCard: game.trump,
      stockSize: game.stock.length + 1,
      youAre: "player1",
      firstTurn,
      opponentNickname: "Bot",
    });

    if (game.turn === "player2") {
      setTimeout(() => triggerBotMove(io, game), 1000);
    } else {
      startTurnTimer(game, io);
    }
  }

  socket.join(gameId);
  emitOpenGames(io);

  socket.emit("gameCreated", gameId);
  callback?.({ gameId });
}

export function startGameProperly(game) {
  if (
    game.status !== "waiting" ||
    !game.players.player1 ||
    !game.players.player2
  )
    return;

  const size = HAND_SIZE[game.variant];

  // Deal player2 hand
  game.hands.player2 = game.stock.splice(0, size);

  // Set trump and stock
  game.trump = game.stock.pop();
  // console.log(
  //   `[TRUMP CARD ANALYSIS]: card: ${game.trump} suit: ${game.trumpSuit}`
  // );
  console.log({ trump: game.trump });
  // Status to playing
  game.status = "playing";
  game.startTime = Date.now();
}

function getPlayerRole(game, user) {
  if (game.players.player1?.id === user.id) return "player1";
  if (game.players.player2?.id === user.id) return "player2";
  return null;
}

function sendGameStarted(socket, game, playerRole) {
  const opponentRole = playerRole === "player1" ? "player2" : "player1";
  const yourHand = game.hands[playerRole];
  const opponentHandSize = game.hands[opponentRole].length;
  const opponentNickname = game.players[opponentRole]?.nickname || null;
  const stockSize = game.stock.length + (game.trump ? 1 : 0);

  socket.emit("gameStarted", {
    yourHand,
    opponentHandSize,
    trumpCard: game.trump,
    stockSize,
    youAre: playerRole,
    firstTurn: game.turn,
    opponentNickname,
  });
}

function getSocketsForPlayer(io, gameId, playerId) {
  const roomSockets = io.sockets.adapter.rooms.get(gameId) || new Set();
  return [...roomSockets]
    .map((socketId) => io.sockets.sockets.get(socketId))
    .filter((s) => s && s.handshake.auth?.id === playerId);
}

export function joinGameHandler(io, socket, user, gameId, callback) {
  const game = getGame(gameId);
  if (!game) return callback?.({ error: "Game not found" });

  if (game.isSinglePlayer && game.players.player1?.id !== user.id) {
    return callback?.({ error: "Cannot join a single player game" });
  }

  const playerRole = getPlayerRole(game, user);

  if (playerRole) {
    socket.join(gameId);
    sendGameStarted(socket, game, playerRole);
    return callback?.({ success: true, isRejoin: true });
  }

  if (game.players.player2 && game.players.player2.id) {
    return callback?.({ error: "Game already has a second player" });
  }

  game.players.player2 = {
    id: user.id,
    nickname: user.nickname,
    disconnected: false,
  };

  socket.join(gameId);
  emitOpenGames(io);

  io.to(gameId).emit("opponentJoined", { nickname: user.nickname });

  startGameProperly(game);

  const firstTurn = Math.random() < 0.5 ? "player1" : "player2";
  game.turn = firstTurn;

  console.log({ hello_here: game.trump });
  const commonData = {
    trumpCard: game.trump,
    stockSize: game.stock.length + (game.trump ? 1 : 0),
    firstTurn,
  };

  const player1Sockets = getSocketsForPlayer(
    io,
    gameId,
    game.players.player1.id
  );
  player1Sockets.forEach((s) => {
    s.emit("gameStarted", {
      ...commonData,
      yourHand: game.hands.player1,
      opponentHandSize: game.hands.player2.length,
      youAre: "player1",
      trumpCard: game.trump,
      opponentNickname: user.nickname,
    });
  });

  socket.emit("gameStarted", {
    ...commonData,
    yourHand: game.hands.player2,
    opponentHandSize: game.hands.player1.length,
    youAre: "player2",
    trumpCard: game.trump,
    opponentNickname: game.players.player1.nickname,
  });

  startTurnTimer(game, io);

  callback?.({ success: true });
}

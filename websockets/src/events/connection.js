import { createGame, getGame, deleteGame } from "../state/games.js";
import { TIMER_SECONDS, GAME_STATUS } from "../constants/index.js";

function startTurnTimer(game, io) {
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

function endGame(game, io, extra = {}) {
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
  setTimeout(() => deleteGame(game.id), 30_000);
}

export function handleConnectionEvents(io, socket) {
  const user = socket.user;

  socket.on("createGame", ({ variant = "9" }, callback) => {
    const gameId = `game_${Date.now()}`;
    const game = createGame({
      id: gameId,
      variant,
      creator: { id: user.id, nickname: user.nickname },
    });

    socket.join(gameId);

    socket.emit("gameStarted", {
      yourHand: game.hands.player1,
      opponentHandSize: 0,
      trumpSuit: game.trumpSuit,
      trumpCardFilename: game.trumpCard.filename,
      stockSize: game.stock.length + 1,
      youAre: "player1",
    });

    callback?.({ gameId });
  });

  socket.on("joinGame", ({ gameId }, callback) => {
    const game = getGame(gameId);
    if (!game || game.players.player2 || game.status !== GAME_STATUS.WAITING) {
      return callback?.({ error: "Cannot join" });
    }

    game.players.player2 = { id: user.id, nickname: user.nickname };
    game.status = GAME_STATUS.PLAYING;

    socket.join(gameId);

    io.to(gameId).emit("opponentJoined", { nickname: user.nickname });

    socket.emit("gameStarted", {
      yourHand: game.hands.player2,
      opponentHandSize: game.hands.player1.length,
      trumpSuit: game.trumpSuit,
      trumpCardFilename: game.trumpCard.filename,
      stockSize: game.stock.length + 1,
      youAre: "player2",
      firstTurn: "player1",
    });

    startTurnTimer(game, io);
    callback?.({ success: true });
  });
}

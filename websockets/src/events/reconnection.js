import { getAllGames } from "../state/games.js";

export function handleDisconnect(io, socket) {
  const user = socket.handshake.auth;

  for (const game of getAllGames()) {
    let role = null;
    if (game.players.player1?.id === user.id) role = "player1";
    else if (game.players.player2?.id === user.id) role = "player2";

    if (role) {
      game.players[role].disconnected = true;
      io.to(game.id).emit("playerDisconnected", { player: role });
    }
  }
}

export function handleReconnect(io, socket) {
  const user = socket.handshake.auth;

  console.log(user.id);
  for (const game of getAllGames()) {
    let role = null;
    if (game.players.player1?.id === user.id) role = "player1";
    else if (game.players.player2?.id === user.id) role = "player2";

    if (role && game?.players[role]?.disconnected) {
      const player = game?.players?.[role];
      if (player) {
        player.disconnected = false;
      }

      socket.join(game.id);
      socket.emit("gameStarted", {
        yourHand: game.hands[role],
        opponentHandSize:
          role === "player1"
            ? game.hands.player2?.length ?? 0
            : game.hands.player1.length,
        trumpSuit: game.trumpSuit,
        trumpCardFilename: game.trumpCard?.filename,
        stockSize: game.stock.length + 1,
        youAre: role,
        firstTurn: game.turn,
      });
      io.to(game.id).emit("playerReconnected", { player: role });
    }
  }
}

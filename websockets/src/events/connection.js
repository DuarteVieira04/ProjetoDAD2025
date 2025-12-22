import { joinLobby } from "./lobby.js";
import { createGameHandler, joinGameHandler } from "./game.js";
import { handleDisconnect, handleReconnect } from "./reconnection.js";

export function handleConnectionEvents(io, socket) {
  const user = socket.handshake.auth;

  socket.on("joinLobby", () => joinLobby(io, socket));
  socket.on("createGame", ({ variant }, callback) =>
    createGameHandler(io, socket, user, variant, callback)
  );
  socket.on("joinGame", ({ gameId }, callback) =>
    joinGameHandler(io, socket, user, gameId, callback)
  );
  socket.on("disconnect", () => handleDisconnect(io, socket));

  handleReconnect(io, socket);
}

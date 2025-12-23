import { joinLobby } from "./lobby.js";
import { createGameHandler, joinGameHandler, resignHandler } from "./game.js";
import { playCardHandler } from "./gameplay.js";
import { handleDisconnect, handleReconnect } from "./reconnection.js";

export function handleConnectionEvents(io, socket) {
  const user = socket.handshake.auth;
  console.log(`[Connection] User connected: ${user?.nickname || 'Anonymous'} (${socket.id})`);

  socket.on("joinLobby", () => {
    console.log(`[Lobby] Socket ${socket.id} joining lobby.`);
    joinLobby(io, socket);
  });
  socket.on("createGame", ({ variant }, callback) =>
    createGameHandler(io, socket, user, variant, callback)
  );
  socket.on("joinGame", ({ gameId }, callback) =>
    joinGameHandler(io, socket, user, gameId, callback)
  );
  socket.on("playCard", (data, callback) =>
    playCardHandler(io, socket, user, data, callback)
  );
  socket.on("resign", ({ gameId }, callback) =>
    resignHandler(io, socket, user, gameId, callback)
  );
  socket.on("disconnect", () => handleDisconnect(io, socket));

  handleReconnect(io, socket);
}

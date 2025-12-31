import { joinLobby } from "./lobby/lobby.js";
import { createGameHandler, joinGameHandler, resignHandler } from "./handlers/game.js";
import {
  createMatchHandler,
  joinMatchHandler,
  proposeStakeHandler,
  acceptStakeHandler
} from "./handlers/match-handlers.js";
import { playCardHandler } from "./gameplay/gameplay.js";
import { handleDisconnect, handleReconnect } from "./reconnection.js";

export function handleConnectionEvents(io, socket) {
  const user = socket.handshake.auth || {};
  if (!user.id) {
    user.id = socket.id;
    user.nickname = user.nickname || "Anonymous";
  }
  console.log(`[Connection] User connected: ${user.nickname} (${user.id})`);

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

  // Match Events
  socket.on("createMatch", (data, callback) =>
    createMatchHandler(io, socket, user, data, callback)
  );
  socket.on("joinMatch", (data, callback) =>
    joinMatchHandler(io, socket, user, data.matchId, callback)
  );
  socket.on("proposeStake", (data, callback) =>
    proposeStakeHandler(io, socket, user, data, callback)
  );
  socket.on("acceptStake", (data, callback) =>
    acceptStakeHandler(io, socket, user, data, callback)
  );

  socket.on("disconnect", () => handleDisconnect(io, socket));

  handleReconnect(io, socket);
}

import { getOpenGames } from "../state/games.js";

export function emitOpenGames(io) {
  const games = getOpenGames().map((g) => ({
    gameId: g.id,
    creator: g.creator,
    variant: g.variant,
  }));
  console.log(`[Lobby] Emitting ${games.length} open games to 'lobby' room.`);
  io.to("lobby").emit("openGamesUpdated", games);
}

export function joinLobby(io, socket) {
  socket.join("lobby");
  emitOpenGames(io);
}

// src/gameplay/match-progression.js
import "dotenv/config";
import { createGame } from "../../state/games.js";

import { startTurnTimer as startMatchTurnTimer } from "../timers/match-timers.js";
import { endCurrentGame as endCurrentMatchGame } from "../timers/match-timers.js";
import { endMatch } from "../../state/matches.js"; // CORRECT
import axios from "axios";

console.log("[MatchProgression] Loaded w/ corrected paths");

export async function startGameInMatch(match, io) {
  console.log(
    "[MatchProgression] startGameInMatch CALLED for match:",
    match.id
  );

  let gameId;

  try {
    const response = await axios.post(`${process.env.API_BASE_URL}/api/games`, {
      type: match.variant,
      status: "Playing",
      player1_user_id: match.players.player1.id,
      player2_user_id: match.players.player2.id,
      match_id: match.id,
    });
    gameId = response.data.id;
    console.log(`[MatchProgression] API created game ${gameId}`);
  } catch (e) {
    console.error("[MatchProgression] API failed, using temp ID", e.message);
    gameId = `game_${Date.now()}`;
  }

  console.log("[MatchProgression] Creating local game object with ID:", gameId);
  const game = createGame({
    id: gameId,
    variant: match.variant,
    matchId: match.id, // Critical for match-timers.js
    players: match.players,
  });

  match.currentGame = gameId;
  match.games.push(gameId);

  const firstTurn = Math.random() < 0.5 ? "player1" : "player2";
  game.turn = firstTurn;

  console.log(`[MatchProgression] First turn set to: ${game.turn}`);

  console.log("[MatchProgression] Emitting public gameStarted");
  io.to(match.id).emit("gameStarted", {
    matchId: match.id,
    gameId,
    trumpSuit: game.trumpSuit,
    trumpCardFilename: game.trumpCard.filename,
    stockSize: game.stock.length + (game.trumpCard ? 1 : 0),
    firstTurn,
  });

  console.log("[MatchProgression] Sending private hands...");
  sendPrivateData(io, match.id, match.players.player1.id, {
    yourHand: game.hands.player1,
    opponentHandSize: game.hands.player2.length,
    youAre: "player1",
  });
  sendPrivateData(io, match.id, match.players.player2.id, {
    yourHand: game.hands.player2,
    opponentHandSize: game.hands.player1.length,
    youAre: "player2",
  });

  game.status = "playing";
  game.startTime = Date.now();

  console.log(`[MatchProgression] Starting turn timer for ${firstTurn}`);
  startMatchTurnTimer(game, io); // Uses match room automatically

  console.log("[MatchProgression] New game fully live in match");
}

function sendPrivateData(io, roomId, userId, data) {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  if (!roomSockets) {
    console.warn(`[sendPrivateData] No sockets in room ${roomId}`);
    return;
  }

  let found = false;
  for (const socketId of roomSockets) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;

    const socketUserId =
      socket.user?.id ||
      socket.handshake.auth?.user?.id ||
      socket.handshake.auth?.id ||
      socket.handshake.auth?.userId;

    if (String(socketUserId) === String(userId)) {
      socket.emit("gameStartedPrivate", data);
      found = true;
      console.log(
        `[sendPrivateData] Sent to user ${userId} (socket ${socket.id})`
      );
    }
  }

  if (!found) {
    console.error(
      `[sendPrivateData] No socket found for user ${userId} in room ${roomId}`
    );
  }
}

export function handleMatchGameEnd(match, game, io, extra = {}) {
  const winnerKey =
    extra.winner ||
    (game.points.player1 > game.points.player2 ? "player1" : "player2");
  const winnerPoints = game.points[winnerKey];
  let marksAwarded = 0;
  const isDraw = game.points.player1 === game.points.player2;

  if (!isDraw) {
    if (winnerPoints === 120) {
      // Bandeira — immediate match win
      match.marks[winnerKey] = 4;
      endCurrentMatchGame(game, io, { winner: winnerKey });
      endMatch(match, io, { winner: winnerKey, reason: "bandeira" });
      return;
    }

    if (winnerPoints >= 91) marksAwarded = 2;
    else if (winnerPoints >= 61) marksAwarded = 1;

    match.marks[winnerKey] += marksAwarded;

    // Accumulate total points across match (optional for display)
    match.points.player1 += game.points.player1;
    match.points.player2 += game.points.player2;
  }

  // Notify clients of marks update
  io.to(match.id).emit("matchUpdated", {
    currentMarks: match.marks,
    marksAwarded,
    gamePoints: game.points,
    totalPoints: match.points,
  });

  // End current hand (client animation, etc.)
  endCurrentMatchGame(game, io, { winner: winnerKey });

  // Check for match victory
  if (Math.max(match.marks.player1, match.marks.player2) >= 4) {
    const matchWinner = match.marks.player1 >= 4 ? "player1" : "player2";
    endMatch(match, io, { winner: matchWinner, reason: "marks_reached" });
    return;
  }

  // Start next hand after delay
  console.log("[MatchProgression] Scheduling next game in 5 seconds");
  setTimeout(() => startGameInMatch(match, io), 5000);
}

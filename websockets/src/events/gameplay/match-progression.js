// gameplay/matchProgression.js
import { createGame } from "../state/games.js";
import { startTurnTimer } from "../timers/timers.js";
import { endMatch } from "../timers/match-timers.js"; // Assume extracted

import axios from "axios";

export async function startGameInMatch(match, io) {
  let gameId;

  try {
    // Create Game in API
    const response = await axios.post('http://127.0.0.1:8000/api/games', {
      type: match.variant,
      status: 'Playing',
      player1_user_id: match.players.player1.id,
      player2_user_id: match.players.player2.id,
      match_id: match.id
    });
    gameId = response.data.id;
    console.log(`[MatchProgression] Created Game ${gameId} in API`);
  } catch (e) {
    console.error("[MatchProgression] Failed to create game in API", e.message);
    // Fallback to temp ID if API fails? Risks state drift but keeps game running.
    gameId = `game_${Date.now()}`;
  }

  const game = createGame({
    id: gameId,
    variant: match.variant,
    matchId: match.id,
    players: match.players,
  });

  match.currentGame = gameId;
  match.games.push(gameId);

  const firstTurn = Math.random() < 0.5 ? "player1" : "player2";
  game.turn = firstTurn;

  io.to(match.id).emit("gameStarted", {
    matchId: match.id,
    gameId,
    trumpSuit: game.trumpSuit,
    trumpCardFilename: game.trumpCard.filename,
    stockSize: game.stock.length + (game.trumpCard ? 1 : 0),
    firstTurn,
  });

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
  startTurnTimer(game, io);
}

function sendPrivateData(io, roomId, userId, data) {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  if (roomSockets) {
    for (const socketId of roomSockets) {
      const s = io.sockets.sockets.get(socketId);
      if (s && s.handshake.auth.id === userId) {
        s.emit("gameStartedPrivate", data);
      }
    }
  }
}

export function handleMatchGameEnd(match, game, io, extra) {
  const winnerPoints =
    game.points[
    extra.winner ||
    (game.points.player1 > game.points.player2 ? "player1" : "player2")
    ];
  let marksAwarded = 0;
  let isDraw = game.points.player1 === game.points.player2;

  if (!isDraw) {
    if (winnerPoints === 120) {
      // Bandeira
      match.marks[extra.winner] += 4 - match.marks[extra.winner]; // Immediate win
      endMatch(match, io, { winner: extra.winner, reason: "bandeira" });
      return;
    } else if (winnerPoints >= 91) marksAwarded = 2;
    else if (winnerPoints >= 61) marksAwarded = 1;
  }

  if (!isDraw) {
    match.marks[extra.winner] += marksAwarded;
    match.points.player1 += game.points.player1;
    match.points.player2 += game.points.player2;
  }

  io.to(match.id).emit("matchUpdated", {
    currentMarks: match.marks,
    marksAwarded,
    gamePoints: game.points,
  });

  if (Math.max(match.marks.player1, match.marks.player2) >= 4) {
    const matchWinner = match.marks.player1 >= 4 ? "player1" : "player2";
    endMatch(match, io, { winner: matchWinner, reason: "marks_reached" });
  } else {
    setTimeout(() => startGameInMatch(match, io), 5000);
  }
}

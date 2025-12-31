// timers/matchTimers.js
import { deleteMatch } from "../../state/matches.js";
import { emitOpenMatches } from "../lobby/match-lobby.js";

import axios from "axios";

export function endMatch(match, io, { winnerKey, reason }) {
  if (match.negotiationTimer) clearTimeout(match.negotiationTimer);

  const loserKey = winnerKey === "player1" ? "player2" : "player1";
  const totalStake = match.stake * 2;
  const payout = totalStake - 1;
  const winnerId = match.players[winnerKey].id;


  io.to(match.id).emit("matchEnded", {
    winner: winnerKey,
    reason,
    finalMarks: match.marks,
    finalPoints: match.points,
    payout,
  });

  saveMatchToDB(match, winnerKey, reason);

  match.status = "ended";
  setTimeout(() => {
    deleteMatch(match.id);
    emitOpenMatches(io);
  }, 30000);
}

async function saveMatchToDB(match, winnerKey, reason) {
  try {
    const payload = {
      status: "Ended",
      winner_user_id: winnerKey ? match.players[winnerKey].id : null,
      loser_user_id: winnerKey
        ? match.players[winnerKey === "player1" ? "player2" : "player1"].id
        : null,
      player1_marks: match.marks.player1,
      player2_marks: match.marks.player2,
      player1_points: match.points.player1,
      player2_points: match.points.player2,
      total_time: match.startTime
        ? Math.round((Date.now() - match.startTime) / 1000)
        : null,
    };

    // We also remove coins/payout logic because we moved it to API controller
    // But we still need to call API to trigger the logic.

    console.log(`[MatchDB] Updating match ${match.id}...`, payload);
    await axios.put(`http://127.0.0.1:8000/api/matches/${match.id}`, payload);
  } catch (error) {
    console.error("[MatchDB] Error:", error.response?.data || error.message);
  }
}

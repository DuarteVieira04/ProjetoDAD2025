// timers/matchTimers.js
import { deleteMatch } from "../state/matches.js";
import { emitOpenMatches } from "../lobby/matchLobby.js";
import { creditCoins, logTransaction } from "../utils/coinUtils.js";
import axios from "axios";

export function endMatch(match, io, { winnerKey, reason }) {
  if (match.negotiationTimer) clearTimeout(match.negotiationTimer);

  const loserKey = winnerKey === "player1" ? "player2" : "player1";
  const totalStake = match.stake * 2;
  const payout = totalStake - 1;
  const winnerId = match.players[winnerKey].id;

  creditCoins(winnerId, payout);
  logTransaction(winnerId, null, match.id, "Match payout", payout);

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
      type: match.variant,
      status: "Ended",
      player1_user_id: match.players.player1.id,
      player2_user_id: match.players.player2.id,
      winner_user_id: winnerKey ? match.players[winnerKey].id : null,
      loser_user_id: winnerKey
        ? match.players[winnerKey === "player1" ? "player2" : "player1"].id
        : null,
      stake: match.stake,
      player1_marks: match.marks.player1,
      player2_marks: match.marks.player2,
      player1_points: match.points.player1,
      player2_points: match.points.player2,
      total_time: match.startTime
        ? Math.round((Date.now() - match.startTime) / 1000)
        : null,
    };
    await axios.post("http://127.0.0.1:8000/api/matches", payload);
  } catch (error) {
    console.error("[MatchDB] Error:", error);
  }
}

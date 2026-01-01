// state/matches.js
const matches = new Map(); // matchId → match object

export function createMatch(data) {
  const match = {
    id: data.id,
    variant: data.variant,
    stake: data.stake || 3,
    players: data.players || {
      player1: {
        id: data.creator.id,
        nickname: data.creator.nickname,
        disconnected: false,
      },
      player2: null,
    },
    marks: { player1: 0, player2: 0 },
    points: { player1: 0, player2: 0 },
    games: [],
    currentGame: null,
    status: "pending",
    startTime: null,
    proposedStake: null,
    proposer: null,
    negotiationTimer: null,
  };
  match.id = String(match.id);
  matches.set(match.id, match);
  return match;
}

export function getMatch(id) {
  return matches.get(String(id));
}

export function getOpenMatches() {
  return Array.from(matches.values()).filter(
    (m) => m.status === "pending" && !m.players.player2
  );
}

export function deleteMatch(id) {
  matches.delete(String(id));
}

export async function endMatch(match, io, extra = {}) {
  if (!match || !io) {
    console.error("[endMatch] Invalid match or io");
    return;
  }

  const winnerKey = extra.winner; // 'player1' or 'player2'
  const reason = extra.reason || "marks_reached";

  console.log(
    `[MatchState] Ending match ${match.id} — Winner: ${winnerKey || "draw"
    }, Reason: ${reason}`
  );

  // Save to DB FIRST (Trigger Payouts)
  await saveMatchToDB(match, winnerKey, reason);

  // Emit final match result to both players
  io.to(match.id).emit("matchEnded", {
    winner: winnerKey,
    finalMarks: match.marks,
    totalPoints: match.points,
    reason,
    stake: match.stake,
  });

  // Clean up server state
  deleteMatch(match.id);

  // Optional: broadcast updated open matches list
  // emitOpenMatches(io);
}

async function saveMatchToDB(match, winnerKey, reason) {
  // Skip if temp ID (bot match usually)
  // But wait, bot matches have UUIDs which are strings. DB matches are IDs (integers).
  // Actually, Bot matches use UUIDs.
  // DB matches use Integers.
  // If match.id involves non-numeric characters (and isn't just a stringified int), good heuristic.
  // Exception: UUIDs have hyphens.
  if (match.id.includes("-")) {
    console.log("[MatchDB] Skipping save for temporary/bot match", match.id);
    return;
  }

  try {
    const { default: axios } = await import("axios");
    const payload = {
      status: "Ended",
      winner_user_id:
        winnerKey === "player1"
          ? match.players.player1?.id
          : winnerKey === "player2"
            ? match.players.player2?.id
            : null,
      loser_user_id:
        winnerKey === "player1"
          ? match.players.player2?.id
          : winnerKey === "player2"
            ? match.players.player1?.id
            : null,
      player1_points: match.points.player1,
      player2_points: match.points.player2,
      player1_marks: match.marks.player1,
      player2_marks: match.marks.player2,
      total_time: match.startTime
        ? Math.round((Date.now() - match.startTime) / 1000)
        : null,
    };

    console.log(`[MatchDB] Updating match ${match.id}...`, payload);
    const response = await axios.put(
      `${process.env.API_BASE_URL}/api/matches/${match.id}`,
      payload
    );
    console.log("[MatchDB] Updated:", response.data.id);
  } catch (error) {
    console.error(
      "[MatchDB] Failed to save match:",
      error.response?.data || error.message
    );
  }
}

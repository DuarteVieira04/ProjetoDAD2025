// src/state/games.js
import { SUITS, RANKS, CARD_POINTS, HAND_SIZE } from "../constants/index.js";

function generateDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        filename: `${suit}-${rank}.svg`,
        value: CARD_POINTS[rank] ?? 0,
      });
    }
  }
  return deck;
}

function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const games = new Map();

export function getOpenGames() {
  const openGames = [];
  for (const game of games.values()) {
    // Only public multiplayer games waiting for opponent
    if (
      game.status === "waiting" &&
      !game.isSinglePlayer &&
      game.players.player2 === null
    ) {
      openGames.push(game);
    }
  }
  console.log({ openGamesLength: openGames.length });
  return openGames;
}

export function createGame({
  id,
  variant = "9",
  creator,
  matchId = null,
  players,
}) {
  const fullDeck = shuffle(generateDeck());
  const size = HAND_SIZE[variant];

  const hand1 = fullDeck.splice(0, size);
  const hand2 = fullDeck.splice(0, size);

  const trumpCard = fullDeck.pop();
  const stock = fullDeck;

  const game = {
    id,
    variant,
    // Use passed players (for matches) or default creator setup (for single games)
    players: players || {
      player1: { ...creator, disconnected: false },
      player2: null,
    },
    hands: {
      player1: hand1,
      player2: hand2,
    },
    stock,
    trumpCard,
    trumpSuit: trumpCard.suit,
    currentTrick: [],
    turn: "player1",
    status: "waiting",
    points: { player1: 0, player2: 0 },
    timer: null,
    matchId, // ← Now properly preserved from input!
    isSinglePlayer: !players, // true if creator-only (lobby game), false for matches
  };

  games.set(String(id), game);
  return game;
}

export function getGame(id) {
  return games.get(String(id));
}

export function deleteGame(id) {
  games.delete(String(id));
}

export function getAllGames() {
  return [...games.values()];
}

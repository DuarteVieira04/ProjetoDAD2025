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

  const game = {
    id,
    variant,
    players: players || {
      player1: { ...creator, disconnected: false },
      player2: null,
    },
    hands: {
      player1: [], // ← Start empty
      player2: [],
    },
    stock: [],
    trumpCard: null,
    currentTrick: [],
    turn: "player1",
    status: "waiting",
    points: { player1: 0, player2: 0 },
    timer: null,
    matchId,
  };

  // Deal only player1's hand immediately
  if (game.players.player1) {
    game.hands.player1 = fullDeck.splice(0, size);
  }

  // Leave the rest of the deck for later
  // We'll deal player2 + trump + stock when game actually starts
  game.stock = fullDeck;
  game.hands.player2 = []; // ← empty
  game.stock = fullDeck; // ← rest of deck
  game.trumpCard = null;
  games.set(String(id), game);
  return game;
}

export function startGameProperly(game) {
  if (game.status !== "waiting" && game.status !== "pending") return;
  if (!game.players.player1 || !game.players.player2) return;

  const size = HAND_SIZE[game.variant] || 6;

  // Deal Player 2's hand from remaining stock
  game.hands.player2 = game.stock.splice(0, size);

  // Reveal trump
  if (game.stock.length > 0) {
    game.trumpCard = game.stock.pop();
  }

  game.status = "playing";
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

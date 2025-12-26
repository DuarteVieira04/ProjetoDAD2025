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
    console.log(game);
    // Explicitly exclude single player games
    if (game.status === "waiting" && !game.isSinglePlayer) {
      openGames.push(game);
    }
  }
  console.log({ openGamesLength: openGames.length });
  return openGames;
}

export function createGame({ id, variant = "9", creator }) {
  const fullDeck = shuffle(generateDeck());
  const size = HAND_SIZE[variant];

  const hand1 = fullDeck.splice(0, size);
  const hand2 = fullDeck.splice(0, size);

  const trumpCard = fullDeck.pop();
  const stock = fullDeck;

  const game = {
    id,
    variant,
    creator,
    players: {
      player1: { ...creator, disconnected: false },
      player2: null,
    },
    hands: { player1: hand1, player2: hand2 },
    stock,
    trumpCard,
    trumpSuit: trumpCard.suit,
    currentTrick: [],
    turn: "player1",
    status: "waiting",
    points: { player1: 0, player2: 0 },
    timer: null,
  };

  games.set(id, game);
  return game;
}

export function getGame(id) {
  return games.get(id);
}

export function deleteGame(id) {
  games.delete(id);
}

export function getAllGames() {
  return [...games.values()];
}

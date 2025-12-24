import { getGame } from "../state/games.js";
import { startTurnTimer, endGame } from "./timers.js";
import { CARD_POINTS } from "../constants/index.js";

function getCardValue(rank) {
    return CARD_POINTS[rank] || 0;
}

function getCardStrength(rank) {
    const strengthMap = {
        "1": 120,
        "7": 110,
        "13-KING": 100,
        "11-JACK": 90,
        "12-QUEEN": 80,
        "6": 60,
        "5": 50,
        "4": 40,
        "3": 30,
        "2": 20,
    };
    return strengthMap[rank] || 0;
}

export function playCardHandler(io, socket, user, { gameId, card }, callback) {
    const game = getGame(gameId);
    if (!game) return callback?.({ error: "Game not found" });

    if (game.status !== "playing")
        return callback?.({ error: "Game not in progress" });

    // Identify player
    const playerKey =
        game.players.player1.id === user.id
            ? "player1"
            : game.players.player2.id === user.id
                ? "player2"
                : null;
    if (!playerKey) return callback?.({ error: "You are not in this game" });

    // Check turn
    if (game.turn !== playerKey) return callback?.({ error: "Not your turn" });

    // Check card in hand
    const hand = game.hands[playerKey];
    const cardIndex = hand.findIndex(
        (c) => c.suit === card.suit && c.rank === card.rank
    );
    if (cardIndex === -1) return callback?.({ error: "Card not in hand" });

    // Remove card from hand
    const playedCard = hand.splice(cardIndex, 1)[0];

    // execute move
    executeMove(io, game, playerKey, playedCard);

    callback?.({ success: true });
}

export function executeMove(io, game, playerKey, playedCard) {
    // Add to trick
    game.currentTrick.push({ player: playerKey, card: playedCard });

    // Emit cardPlayed
    io.to(game.id).emit("cardPlayed", { player: playerKey, card: playedCard });

    // Stop timer
    if (game.timer) clearTimeout(game.timer);

    if (game.currentTrick.length === 1) {
        // Switch turn
        game.turn = playerKey === "player1" ? "player2" : "player1";
        startTurnTimer(game, io);
    } else {
        // Trick complete
        const c1 = game.currentTrick[0];
        const c2 = game.currentTrick[1];

        let winnerKey = c1.player; // default to leader
        const card1 = c1.card;
        const card2 = c2.card;

        // Logic: Winner is highest trump, or highest of led suit if no trump.
        // If card2 is trump and card1 is not, card2 wins.
        if (card2.suit === game.trumpSuit && card1.suit !== game.trumpSuit) {
            winnerKey = c2.player;
        } else if (card1.suit === card2.suit) {
            if (getCardStrength(card2.rank) > getCardStrength(card1.rank)) {
                winnerKey = c2.player;
            }
        }

        // Points
        const points = getCardValue(card1.rank) + getCardValue(card2.rank);
        game.points[winnerKey] += points;

        // Emit result
        io.to(game.id).emit("playerPointsUpdated", {
            player1Points: game.points.player1,
            player2Points: game.points.player2,
        });

        // Clear trick
        game.currentTrick = [];

        // Draw cards
        if (game.stock.length > 0 || game.trumpCard) {
            const winnerDraw = game.stock.length > 0 ? game.stock.pop() : game.trumpCard;
            if (winnerDraw === game.trumpCard) game.trumpCard = null; // Mark taken

            let loserDraw = null;
            if (game.stock.length > 0) {
                loserDraw = game.stock.pop();
            } else if (game.trumpCard) {
                loserDraw = game.trumpCard;
                game.trumpCard = null; // Mark taken
            }

            const loserKey = winnerKey === "player1" ? "player2" : "player1";

            if (winnerDraw) game.hands[winnerKey].push(winnerDraw);
            if (loserDraw) game.hands[loserKey].push(loserDraw);

            io.to(game.id).emit("stockUpdated", { newStockSize: game.stock.length + (game.trumpCard ? 1 : 0) });

            // Send specific cards to specific players
            if (winnerDraw) sendCardToPlayer(io, game.id, game.players[winnerKey].id, winnerDraw);
            if (loserDraw) sendCardToPlayer(io, game.id, game.players[loserKey].id, loserDraw);
        }

        // Check game end conditions
        if (game.hands.player1.length === 0 && game.hands.player2.length === 0) {
            endGame(game, io, { reason: "normal" });
            return;
        }

        // Winner leads
        game.turn = winnerKey;

        setTimeout(() => {
            io.to(game.id).emit("roundEnded", {});
            startTurnTimer(game, io);
        }, 2000);
    }
}

function sendCardToPlayer(io, gameId, userId, card) {
    const roomSockets = io.sockets.adapter.rooms.get(gameId);
    if (roomSockets) {
        for (const socketId of roomSockets) {
            const s = io.sockets.sockets.get(socketId);
            if (s && s.handshake.auth.id === userId) {
                s.emit("cardDrawn", card);
            }
        }
    }
}

export function pickRandomValidCard(game, playerKey) {
    const hand = game.hands[playerKey];
    if (hand.length === 0) return null;

    let validCards = [];

    // If following a lead
    if (game.currentTrick.length > 0) {
        const leadCard = game.currentTrick[0].card;
        // Filter by suit
        const sameSuit = hand.filter(c => c.suit === leadCard.suit);
        if (sameSuit.length > 0) {
            validCards = sameSuit;
        } else {
            // Can play any card
            validCards = hand;
        }
    } else {
        // Leading: any card
        validCards = hand;
    }

    if (validCards.length === 0) return hand[0]; // Fallback (shouldn't happen with logic above)

    // Pick random
    return validCards[Math.floor(Math.random() * validCards.length)];
}

export function awardRemainingCardsToWinner(game, winnerKey) {
    let totalPoints = 0;

    // 1. Hands
    ['player1', 'player2'].forEach(pk => {
        game.hands[pk].forEach(card => {
            totalPoints += getCardValue(card.rank);
        });
        game.hands[pk] = []; // Clear hand
    });

    // 2. Stock
    game.stock.forEach(card => {
        totalPoints += getCardValue(card.rank);
    });
    game.stock = []; // Clear stock

    // 3. Trump card
    if (game.trumpCard) {
        totalPoints += getCardValue(game.trumpCard.rank);
        game.trumpCard = null;
    }

    // 4. Current trick
    game.currentTrick.forEach(item => {
        totalPoints += getCardValue(item.card.rank);
    });
    game.currentTrick = [];

    // Add to winner's score
    game.points[winnerKey] += totalPoints;
    console.log(`[Forfeit] Awarded ${totalPoints} points to ${winnerKey}`);
}

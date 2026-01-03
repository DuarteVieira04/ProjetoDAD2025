import { getGame } from '../../state/games.js'
import { getMatch } from '../../state/matches.js'
import { startTurnTimer as startGameTurnTimer } from '../timers/game-timers.js'
import { startTurnTimer as startMatchTurnTimer } from '../timers/match-timers.js'
import { endGame } from '../timers/game-timers.js'
import { getCardValue, getCardStrength } from '../../utils/cards.js'
import { calculateBotMove } from '../../bot/logic.js'

export function playCardHandler(io, user, { gameId, card }, callback) {
  // Unified lookup: works for single games AND current game in matches
  const game = getGame(gameId) || getGame(getMatch(gameId)?.currentGame)
  console.log(`[PlayCard] Request from ${user.nickname} for gameId ${gameId}. Game found: ${!!game}`)

  if (!game) {
    console.error(`[PlayCard] Game not found for ID ${gameId}`)
    return callback?.({ error: 'Game not found' })
  }

  if (game.status !== 'playing') {
    console.error(`[PlayCard] Game status is ${game.status}, expected 'playing'`)
    return callback?.({ error: 'Game not in progress' })
  }

  // Identify player
  let playerKey = null
  if (String(game.players.player1?.id) === String(user.id)) playerKey = 'player1'
  else if (String(game.players.player2?.id) === String(user.id)) playerKey = 'player2'

  if (!playerKey) {
    console.error(`[PlayCard] User ${user.id} not found in players. P1: ${game.players.player1?.id}, P2: ${game.players.player2?.id}`)
    return callback?.({ error: 'You are not a player in this game' })
  }

  console.log(`[PlayCard] Player identified as ${playerKey}. Turn is ${game.turn}`)

  // Turn validation
  if (game.turn !== playerKey) {
    console.log(`[PlayCard] Turn rejected: ${playerKey} tried to play, but turn is ${game.turn}`)
    return callback?.({ error: 'Not your turn' })
  }

  // Card validation
  const hand = game.hands[playerKey]
  const cardIndex = hand.findIndex((c) => c.suit === card.suit && c.rank === card.rank)
  if (cardIndex === -1) {
    console.error(`[PlayCard] Card not found in hand. Requested: ${card.suit}-${card.rank}. Hand:`, hand.map(c => `${c.suit}-${c.rank}`))
    return callback?.({ error: 'Card not in your hand' })
  }

  const playedCard = hand.splice(cardIndex, 1)[0]

  console.log(
    `[PlayCard] ${playerKey} played ${playedCard.rank} of ${playedCard.suit} (game ${gameId})`,
  )

  executeMove(io, game, playerKey, playedCard)

  callback?.({ success: true })
}

export function executeMove(io, game, playerKey, playedCard) {
  const isMatch = !!game.matchId
  const roomId = String(isMatch ? game.matchId : game.id)
  const startTurnTimer = isMatch ? startMatchTurnTimer : startGameTurnTimer

  // Always clear any existing timer first
  if (game.timer) {
    clearTimeout(game.timer)
    game.timer = null
  }

  // Record and broadcast the played card
  game.currentTrick.push({ player: playerKey, card: playedCard })

  io.to(roomId).emit('cardPlayed', {
    player: playerKey,
    card: {
      suit: playedCard.suit,
      rank: playedCard.rank,
      filename: playedCard.filename,
      value: playedCard.value,
    },
  })

  if (game.currentTrick.length === 1) {
    // First card of a new trick — switch turn and start timer immediately
    game.turn = playerKey === 'player1' ? 'player2' : 'player1'
    startTurnTimer(game, io)

    // If bot now has to play, schedule it
    if (!isMatch && game.isSinglePlayer && game.turn === 'player2') {
      setTimeout(() => triggerBotMove(io, game), 800 + Math.random() * 800)
    }
  } else {
    // Trick complete — determine winner
    const [c1, c2] = game.currentTrick
    let winnerKey = c1.player

    if (c2.card.suit === game.trump?.suit && c1.card.suit !== game.trump?.suit) {
      winnerKey = c2.player
    } else if (c1.card.suit === c2.card.suit) {
      if (getCardStrength(c2.card.rank) > getCardStrength(c1.card.rank)) {
        winnerKey = c2.player
      }
    }

    // Award points
    const points = getCardValue(c1.card.rank) + getCardValue(c2.card.rank)
    game.points[winnerKey] += points

    io.to(roomId).emit('playerPointsUpdated', {
      player1Points: game.points.player1,
      player2Points: game.points.player2,
    })

    // Draw new cards
    drawCardsAfterTrick(io, game, winnerKey, roomId)

    // Check for game end
    if (game.hands.player1.length === 0 && game.hands.player2.length === 0) {
      setTimeout(() => endGame(game, io, { reason: 'normal' }), 2000)
      return
    }

    // Winner leads next trick — set turn and start timer IMMEDIATELY
    game.turn = winnerKey
    game.currentTrick = []
    startTurnTimer(game, io)

    // Visual feedback after a short delay
    setTimeout(() => {
      io.to(roomId).emit('roundEnded', { winner: winnerKey })

      // Only trigger bot lead after the round end animation
      if (!isMatch && game.isSinglePlayer && game.turn === 'player2') {
        setTimeout(() => triggerBotMove(io, game), 1000 + Math.random() * 1000)
      }
    }, 1000)
  }
}

function drawCardsAfterTrick(io, game, winnerKey, roomId) {
  const loserKey = winnerKey === 'player1' ? 'player2' : 'player1'

  let winnerCard = null
  let loserCard = null

  // Winner draws first
  if (game.stock.length > 0) {
    winnerCard = game.stock.pop()
  } else if (game.trump) {
    winnerCard = game.trump
    game.trump = null
  }

  // Loser draws second — only from stock (trump already possibly taken)
  if (game.stock.length > 0) {
    loserCard = game.stock.pop()
  }

  // Add cards to hands
  if (winnerCard) {
    game.hands[winnerKey].push(winnerCard)
    sendCardToPlayer(io, roomId, game.players[winnerKey].id, winnerCard)
  }

  if (loserCard) {
    game.hands[loserKey].push(loserCard)
    sendCardToPlayer(io, roomId, game.players[loserKey].id, loserCard)
  }

  // Update clients with new stock size (includes trump if still there)
  io.to(roomId).emit('stockUpdated', {
    newStockSize: game.stock.length + (game.trump ? 1 : 0),
  })
}

function sendCardToPlayer(io, roomId, userId, card) {
  const roomSockets = io.sockets.adapter.rooms.get(roomId)
  if (!roomSockets) return

  for (const socketId of roomSockets) {
    const socket = io.sockets.sockets.get(socketId)
    const socketUserId =
      socket.user?.id || socket.handshake.auth?.id || socket.handshake.auth?.user?.id
    if (String(socketUserId) === String(userId)) {
      socket.emit('cardDrawn', card)
      return
    }
  }
}

export function triggerBotMove(io, game) {
  console.log('[Bot] Calculating move...')
  console.log({ game })
  const move = calculateBotMove(game, 'player2')

  if (!move) {
    console.error('[Bot] No valid move!')
    return
  }

  const hand = game.hands.player2
  const index = hand.findIndex((c) => c.suit === move.suit && c.rank === move.rank)
  if (index === -1) {
    console.error('[Bot] Card not in hand!')
    return
  }

  const playedCard = hand.splice(index, 1)[0]
  console.log(`[Bot] Played ${playedCard.rank} of ${playedCard.suit}`)

  executeMove(io, game, 'player2', playedCard)
}

export function awardRemainingCardsToWinner(game, winnerKey) {
  let totalPoints = 0

    ;['player1', 'player2'].forEach((pk) => {
      game.hands[pk].forEach((card) => (totalPoints += getCardValue(card.rank)))
      game.hands[pk].length = 0
    })

  game.stock.forEach((card) => (totalPoints += getCardValue(card.rank)))
  game.stock.length = 0

  if (game.trump) {
    totalPoints += getCardValue(game.trump.rank) // Fixed: game.trump, not game.trumpCard
    game.trump = null
  }

  game.currentTrick.forEach((item) => (totalPoints += getCardValue(item.card.rank)))
  game.currentTrick = []

  game.points[winnerKey] += totalPoints
  console.log(`[Forfeit] Awarded ${totalPoints} points to ${winnerKey}`)
}

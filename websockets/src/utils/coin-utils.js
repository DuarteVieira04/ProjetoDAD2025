import axios from 'axios'

export async function deductCoins(userId, amount) {
  // Call API to deduct
  await axios.post('/api/coins/deduct', { userId, amount })
}

export async function creditCoins(userId, amount) {
  // Call API to credit
  await axios.post('/api/coins/credit', { userId, amount })
}

export async function logTransaction(userId, gameId, matchId, type, amount) {
  // Call API to log
  await axios.post('/api/transactions', {
    userId,
    gameId,
    matchId,
    type,
    amount,
  })
}

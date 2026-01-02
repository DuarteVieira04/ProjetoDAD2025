<template>
  <div class="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-md">
    <Card class="bg-white mx-4 p-8 border-gray-200 w-full max-w-md text-center shadow-xl">
      <h2 class="mb-6 font-bold text-gray-900 text-3xl sm:text-4xl">
        {{ game.isMatch ? 'Match Over' : 'Game Over' }}
      </h2>
      <p class="mb-2 text-2xl sm:text-3xl">
        <span v-if="game.gameOverData?.winner === game.youAre" class="text-green-600">
          You Win! 🎉
        </span>
        <span v-else class="text-red-500"> {{ game.opponentNickname }} Wins 😔 </span>
      </p>
      <p class="mb-8 text-gray-500 italic">
        {{ game.gameOverData?.reason || (game.isMatch ? 'Best of 7 reached' : 'Hand completed') }}
      </p>

      <div class="space-y-3 bg-gray-50 mb-8 p-6 border border-gray-100 rounded-xl">
        <div class="flex justify-between text-gray-800 text-lg">
          <span>You:</span>
          <span class="font-bold text-green-600">{{ myFinalPoints }} pts</span>
        </div>
        <div class="flex justify-between text-gray-800 text-lg">
          <span>{{ game.opponentNickname }}:</span>
          <span class="font-bold text-red-500">{{ opponentFinalPoints }} pts</span>
        </div>
        <div
          v-if="game.isMatch"
          class="flex justify-between pt-4 border-gray-200 border-t font-bold text-gray-800 text-xl"
        >
          <span>Marks:</span>
          <span>{{ game.marks?.you }} – {{ game.marks?.opponent }}</span>
        </div>
        
        <!-- Match Reward -->
        <div 
          v-if="game.isMatch && game.gameOverData?.winner === game.youAre"
          class="flex flex-col pt-4 border-gray-200 border-t text-yellow-600"
        >
          <span class="font-bold text-xl">You Won {{ (game.stake * 2) - 1 }} Coins!</span>
          <span class="text-xs text-gray-500">
            ({{ game.stake }} x 2 Stake - 1 Commission)
          </span>
        </div>

        <!-- Single Game Reward -->
        <div 
          v-else-if="!game.isMatch && game.gameOverData?.winner === game.youAre && game.opponentNickname !== 'Bot'"
          class="flex flex-col pt-4 border-gray-200 border-t text-yellow-600"
        >
          <span class="font-bold text-xl">You Won {{ singleGameReward }} Coins!</span>
          <span class="text-xs text-gray-500">
            {{ singleGameRewardReason }}
          </span>
        </div>
        
         <!-- Draw Refund -->
        <div 
           v-else-if="!game.isMatch && !game.gameOverData?.winner && game.opponentNickname !== 'Bot'"
           class="flex flex-col pt-4 border-gray-200 border-t text-yellow-600"
        >
           <span class="font-bold text-xl">Refunded 1 Coin</span>
           <span class="text-xs text-gray-500">Draw Game</span>
        </div>
      </div>

      <Button
        size="lg"
        class="py-6 w-full text-lg"
        @click="$router.push(game.opponentNickname === 'Bot' ? '/' : '/lobby')"
      >
        {{ game.opponentNickname === 'Bot' ? 'Back to Home' : 'Back to Lobby' }}
      </Button>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const game = useGameStore()

const myFinalPoints = computed(() => {
  if (!game.gameOverData?.points) return 0
  return game.gameOverData.points[game.youAre] ?? 0
})

const opponentFinalPoints = computed(() => {
  if (!game.gameOverData?.points) return 0
  const opp = game.youAre === 'player1' ? 'player2' : 'player1'
  return game.gameOverData.points[opp] ?? 0
})

const singleGameReward = computed(() => {
  const points = myFinalPoints.value
  if (points === 120) return 6
  if (points >= 90) return 4
  return 3
})

const singleGameRewardReason = computed(() => {
  const points = myFinalPoints.value
  if (points === 120) return '(Bandeira Bonus!)'
  if (points >= 90) return '(Capote Bonus!)'
  return '(Winner Reward)'
})

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
</script>

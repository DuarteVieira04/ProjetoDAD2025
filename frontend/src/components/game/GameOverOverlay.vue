<template>
  <div class="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-md">
    <Card class="bg-gray-900 mx-4 p-8 border-gray-700 w-full max-w-md text-center">
      <h2 class="mb-6 font-bold text-white text-3xl sm:text-4xl">
        {{ game.isMatch ? 'Match Over' : 'Game Over' }}
      </h2>
      <p class="mb-2 text-2xl sm:text-3xl">
        <span v-if="game.gameOverData?.winner === game.youAre" class="text-green-400">
          You Win! 🎉
        </span>
        <span v-else class="text-red-400"> {{ game.opponentNickname }} Wins 😔 </span>
      </p>
      <p class="mb-8 text-gray-400 italic">
        {{ game.gameOverData?.reason || (game.isMatch ? 'Best of 7 reached' : 'Hand completed') }}
      </p>

      <div class="space-y-3 bg-gray-800/50 mb-8 p-6 rounded-xl">
        <div class="flex justify-between text-white text-lg">
          <span>You:</span>
          <span class="font-bold text-green-300">{{ myFinalPoints }} pts</span>
        </div>
        <div class="flex justify-between text-white text-lg">
          <span>{{ game.opponentNickname }}:</span>
          <span class="font-bold text-red-300">{{ opponentFinalPoints }} pts</span>
        </div>
        <div
          v-if="game.isMatch"
          class="flex justify-between pt-4 border-gray-700 border-t font-bold text-xl"
        >
          <span>Marks:</span>
          <span>{{ game.marks?.you }} – {{ game.marks?.opponent }}</span>
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

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
</script>

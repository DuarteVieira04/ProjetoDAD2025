<template>
  <div class="text-center">
    <p
      v-if="game.status === 'waiting'"
      class="mb-6 font-semibold text-gray-300 text-lg sm:text-2xl animate-pulse"
    >
      Waiting for opponent to join...
    </p>

    <div v-else-if="hasWinner" class="mb-8">
      <p class="mb-4 font-bold text-2xl sm:text-4xl">
        <span v-if="player1Wins" class="drop-shadow-lg text-green-400">
          {{ isPlayer1 ? 'You Win! 🎉' : 'Opponent Wins!' }}
        </span>
        <span v-else-if="player2Wins" class="drop-shadow-lg text-green-400">
          {{ isPlayer2 ? 'You Win! 🎉' : 'Opponent Wins!' }}
        </span>
      </p>
    </div>

    <div v-else>
      <p
        class="mb-4 font-bold text-2xl sm:text-4xl transition-all duration-300"
        :class="{
          'text-green-400 drop-shadow-lg': game.isMyTurn,
          'text-orange-400': !game.isMyTurn,
        }"
      >
        {{ game.isMyTurn ? 'Your Turn!' : "Opponent's Turn..." }}
      </p>

      <div class="flex justify-center mb-4">
        <Progress
          :value="timerPercentage"
          class="rounded-full w-48 sm:w-96 h-4 sm:h-8 overflow-hidden"
          :class="progressBarColorClass"
        />
      </div>

      <p
        class="font-mono font-bold text-3xl sm:text-5xl transition-all duration-200"
        :class="timerTextClass"
      >
        {{ game.timerSeconds }}<span class="opacity-70 text-lg sm:text-2xl">s</span>
      </p>

      <p
        v-if="game.timerSeconds <= 10 && game.timerSeconds > 0"
        class="mt-4 font-bold text-red-500 text-xl animate-pulse"
      >
        Hurry up!
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'

const game = useGameStore()
const authStore = useAuthStore()

const isPlayer1 = computed(() => game.players?.player1?.id === authStore.currentUser.id)
const isPlayer2 = computed(() => game.players?.player2?.id === authStore.currentUser.id)

const hasWinner = computed(
  () => game.playedCards?.player1?.isWinner || game.playedCards?.player2?.isWinner,
)
const player1Wins = computed(() => game.playedCards?.player1?.isWinner)
const player2Wins = computed(() => game.playedCards?.player2?.isWinner)

const timerPercentage = computed(() => (game.timerSeconds / game.turnTimeLimit) * 100)

const progressBarColorClass = computed(() => {
  const ratio = game.timerSeconds / game.turnTimeLimit
  if (ratio > 0.5) return 'bg-green-500'
  if (ratio > 0.2) return 'bg-yellow-500'
  return 'bg-red-500'
})

const timerTextClass = computed(() => {
  if (game.timerSeconds <= 10 && game.timerSeconds > 0) return 'text-red-400 animate-pulse'
  return game.isMyTurn ? 'text-green-400' : 'text-yellow-300'
})

import { Progress } from '@/components/ui/progress'
</script>

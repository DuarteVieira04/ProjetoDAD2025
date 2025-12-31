<template>
  <TooltipProvider>
    <div
      class="flex flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800 w-full min-h-screen text-white"
    >
      <!-- Opponent Info -->
      <div class="flex sm:flex-row flex-col justify-between items-center gap-1 p-2 sm:p-6 w-full">
        <div class="flex items-center gap-2 sm:gap-3">
          <Avatar class="border-2 border-white/20 w-8 sm:w-14 h-8 sm:h-14">
            <AvatarImage src="/avatars/opponent.jpg" alt="Opponent avatar" />
            <AvatarFallback>OP</AvatarFallback>
          </Avatar>
          <div class="sm:text-left text-center">
            <p class="font-semibold text-xs sm:text-lg">
              {{ game.opponentNickname || 'Waiting...' }}
            </p>
            <Badge variant="secondary" class="text-[10px] sm:text-base">
              {{ game.opponentPoints }} points
            </Badge>
          </div>
        </div>

        <Badge variant="outline" class="px-2 sm:px-4 py-0.5 sm:py-2 text-[10px] sm:text-lg">
          Stock: {{ game.stockCount }}
        </Badge>
      </div>

      <!-- Opponent Hand (backs) -->
      <div class="relative mb-2 sm:mb-10 px-4 w-full h-16 sm:h-48">
        <div class="top-1/2 absolute inset-x-0 -translate-y-1/2">
          <div class="flex justify-center">
            <div
              v-for="n in game.opponentHandCount"
              :key="n"
              class="absolute transition-all duration-300"
              :style="{
                transform: `
                  translateX(${(n - (game.opponentHandCount + 1) / 2) * (game.opponentHandCount >= 7 ? 12 : game.opponentHandCount >= 4 ? 18 : 28)}px)
                  rotate(${(n - (game.opponentHandCount + 1) / 2) * (game.opponentHandCount >= 7 ? 4 : game.opponentHandCount >= 4 ? 6 : 8)}deg)
                  translateY(${Math.abs(n - (game.opponentHandCount + 1) / 2) * (game.opponentHandCount >= 7 ? 3 : 6)}px)
                `,
              }"
            >
              <img
                src="/assets/cards/BACK.svg"
                alt="Card back"
                class="shadow-2xl border border-white/10 rounded-lg w-10 sm:w-24 h-16 sm:h-36"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Played Cards -->
      <div class="flex flex-col flex-1 justify-center items-center gap-2 sm:gap-12 px-4 w-full">
        <div
          class="flex sm:flex-row flex-col sm:justify-center items-center gap-2 sm:gap-20 lg:gap-32 w-full max-w-5xl"
        >
          <!-- Opponent played card -->
          <Card
            v-if="game.playedCards.player2"
            class="border-4 overflow-hidden"
            :class="
              game.playedCards.player2.isWinner
                ? 'border-yellow-400 shadow-yellow-400/50'
                : 'border-transparent'
            "
          >
            <img
              :src="`/assets/cards/${game.playedCards.player2.filename}`"
              class="w-16 sm:w-36 h-24 sm:h-52"
              alt="Opponent played card"
            />
          </Card>
          <div
            v-else
            class="bg-gray-800/50 border-2 border-gray-600 border-dashed rounded-xl w-16 sm:w-36 h-24 sm:h-52"
          />

          <!-- Your played card -->
          <Card
            v-if="game.playedCards.player1"
            class="border-4 overflow-hidden"
            :class="
              game.playedCards.player1.isWinner
                ? 'border-yellow-400 shadow-yellow-400/50'
                : 'border-transparent'
            "
          >
            <img
              :src="`/assets/cards/${game.playedCards.player1.filename}`"
              class="w-16 sm:w-36 h-24 sm:h-52"
              alt="Your played card"
            />
          </Card>
          <div
            v-else
            class="bg-gray-800/50 border-2 border-gray-600 border-dashed rounded-xl w-16 sm:w-36 h-24 sm:h-52"
          />
        </div>

        <!-- Trump + Turn Timer -->
        <div
          class="flex sm:flex-row flex-col sm:justify-center items-center gap-2 sm:gap-12 w-full max-w-4xl"
        >
          <Tooltip>
            <TooltipTrigger as-child>
              <Card class="bg-amber-700/80 shadow-xl p-1 sm:p-5 border-amber-500">
                <p class="mb-0.5 sm:mb-2 font-bold text-amber-100 text-[10px] text-center sm:text-base">Trump</p>
                <img
                  v-if="game.trumpCard"
                  :src="`/assets/cards/${game.trumpCard.filename}`"
                  class="mx-auto rounded-lg w-8 sm:w-24 h-12 sm:h-32"
                  alt="Trump card"
                />
              </Card>
            </TooltipTrigger>
            <TooltipContent>Trump suit beats all other suits</TooltipContent>
          </Tooltip>

          <div class="text-center">
            <p class="mb-1 sm:mb-3 font-bold text-base sm:text-3xl">
              {{ game.isMyTurn ? 'Your Turn' : 'Waiting...' }}
            </p>
            <Progress :value="(game.timerSeconds / 20) * 100" class="w-24 sm:w-64 h-2 sm:h-4" />
            <p class="mt-1 sm:mt-3 font-mono text-sm sm:text-2xl">{{ game.timerSeconds }}s</p>
          </div>
        </div>
      </div>

      <Separator class="opacity-50 my-1 sm:my-6" />

      <!-- Your Info -->
      <div class="flex sm:flex-row flex-col justify-between items-center gap-1 p-1 sm:p-6 w-full">
        <div class="flex items-center gap-2 sm:gap-3">
          <Avatar class="border-2 border-white/20 w-8 sm:w-14 h-8 sm:h-14">
            <AvatarImage src="/avatars/me.jpg" alt="Your avatar" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div class="sm:text-left text-center">
            <p class="font-semibold text-xs sm:text-lg">{{ game.myNickname }}</p>
            <Badge variant="default" class="text-[10px] sm:text-base">{{ game.myPoints }} points</Badge>
          </div>
        </div>

        <Button variant="destructive" size="sm" class="h-7 text-xs sm:h-11 sm:text-base sm:px-8" @click="game.resign()">Resign</Button>
      </div>

      <!-- Your Hand -->
      <div class="flex flex-wrap justify-center gap-2 sm:gap-4 bg-black/30 p-2 sm:p-6 w-full">
        <Tooltip v-for="card in game.myHand" :key="card.filename">
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              class="shadow-2xl p-0 rounded-xl overflow-hidden transition-all h-auto w-auto aspect-[2/3]"
              :class="[
                game.isMyTurn
                  ? 'ring-4 ring-blue-500 hover:scale-110 scale-105 cursor-pointer sm:scale-110 sm:hover:scale-115'
                  : 'opacity-60 cursor-not-allowed',
              ]"
              :disabled="!game.isMyTurn"
              @click="game.playCard(card)"
            >
              <img
                :src="`/assets/cards/${card.filename}`"
                class="w-14 sm:w-28 h-20 sm:h-40"
                :alt="`${card.rankDisplay} of ${card.suit}`"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {{ card.rankDisplay }} of {{ card.suit }} ({{ card.value }} points)
          </TooltipContent>
        </Tooltip>
      </div>
    </div>


    <!-- Game Over Overlay -->
    <div v-if="game.status === 'ended'" class="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm">
      <Card class="bg-gray-900 border-gray-700 p-8 w-full max-w-md text-center">
        <h2 class="mb-4 font-bold text-3xl text-white">Game Over</h2>
        <div class="mb-6">
            <p class="text-xl text-gray-200">
                {{ game.gameOverData?.winner === game.youAre ? 'You Win! 🎉' : (game.opponentNickname + ' Wins 😔') }}
            </p>
            <p class="text-gray-400 italic">Reason: {{ game.gameOverData?.reason }}</p>
        </div>
        
        <div class="space-y-2 mb-8 bg-gray-800 p-4 rounded-lg">
            <div class="flex justify-between text-gray-300">
                <span>Your Points:</span>
                <span class="font-bold">{{ game.youAre === 'player1' ? game.gameOverData?.points?.player1 : game.gameOverData?.points?.player2 }}</span>
            </div>
            <div class="flex justify-between text-gray-300">
                <span>Opponent Points:</span>
                <span class="font-bold">{{ game.youAre === 'player1' ? game.gameOverData?.points?.player2 : game.gameOverData?.points?.player1 }}</span>
            </div>
        </div>

        <Button size="lg" class="w-full" @click="$router.push(game.opponentNickname === 'Bot' ? '/' : '/lobby')">
            {{ game.opponentNickname === 'Bot' ? 'Back to Home' : 'Back to Lobby' }}
        </Button>
      </Card>
    </div>

  </TooltipProvider>
</template>

<script setup>
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { AvatarImage } from '@/components/ui/avatar'
import { AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { inject } from 'vue'
import { useGameStore } from '@/stores/game'

const route = useRoute()
const socket = inject('socket')
const game = useGameStore()
const gameId = route.params.id

onMounted(() => {
  if (!gameId) {
    console.error('No gameId in route')
    return
  }

  // Reset store for a new game session
  // game.reset() // <-- Actually, maybe we shouldn't reset if we are re-entering? 
  // Ideally, reset before joining.
  // Only reset if we are entering a DIFFERENT game.
  // This preserves the state if we just created the game (Lobby -> GameView transition)
  if (game.gameId !== gameId) {
    game.reset()
    game.gameId = gameId
  }

  const joinAction = route.query.type === 'match' ? game.joinMatch : game.joinGame
  
  joinAction(gameId).catch((err) => {
    if (err && err.includes && err.includes('Cannot join your own game')) {
      // For matches, this error might be "Match full" or specific logic
      // But typically creators join immediately via 'createMatch' return in some flows.
      // Here we explicitly join.
      console.log('User is creator/in-game, handled by reconnection logic')
    } else {
      console.error('Failed to join:', err)
      alert('Failed to join: ' + err)
    }
  })
})
// No onBeforeUnmount needed for listeners anymore since Store handles them permanently.
/*
onBeforeUnmount(() => {
})
*/
</script>
```

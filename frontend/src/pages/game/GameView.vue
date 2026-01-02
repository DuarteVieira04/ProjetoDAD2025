<template>
  <TooltipProvider>
    <div
      class="flex flex-col bg-linear-to-b from-emerald-950 via-emerald-900 to-emerald-800 w-full min-h-screen text-white"
    >
      <!-- Opponent Info -->
      <div class="flex sm:flex-row flex-col justify-between items-center gap-4 p-4 sm:p-8 w-full">
        <div class="flex items-center gap-3 sm:gap-5">
          <Avatar class="border-2 border-white/20 w-10 sm:w-16 h-10 sm:h-16">
            <AvatarImage
              :src="game.opponentAvatar || '/avatars/opponent.jpg'"
              alt="Opponent avatar"
            />
            <AvatarFallback>OP</AvatarFallback>
          </Avatar>
          <div class="sm:text-left text-center">
            <p class="font-semibold text-sm sm:text-xl">
              {{ game.opponentNickname || 'Waiting for opponent...' }}
            </p>
            <Badge variant="secondary" class="text-xs sm:text-base">
              {{ game.opponentPoints ?? 0 }} points
            </Badge>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <Badge
            v-if="game.isMatch"
            variant="outline"
            class="px-3 sm:px-6 py-1 sm:py-3 border-white/30 text-white text-sm sm:text-xl"
          >
            Stake: {{ game.stake }} coins
          </Badge>

          <Badge
            variant="outline"
            class="px-3 sm:px-6 py-1 sm:py-3 border-white/30 text-white text-sm sm:text-xl"
          >
            Stock: {{ game.stockCount }}
          </Badge>
        </div>
      </div>

      <!-- Opponent Hand (Card Backs Fan) -->
      <div class="relative mb-4 sm:mb-12 px-4 w-full h-20 sm:h-56">
        <div class="top-1/2 absolute inset-x-0 flex justify-center -translate-y-1/2">
          <div
            v-for="n in game.opponentHandCount"
            :key="n"
            class="absolute transition-all duration-500 ease-out"
            :style="opponentCardStyle(n, game.opponentHandCount)"
          >
            <img
              src="/assets/cards/BACK.svg"
              alt="Card back"
              class="shadow-2xl border border-white/10 rounded-lg w-12 sm:w-28 h-20 sm:h-44"
            />
          </div>
        </div>
      </div>

      <!-- Played Cards Area -->
      <div class="flex flex-col flex-1 justify-center items-center gap-8 sm:gap-16 px-4">
        <div class="flex justify-center items-center gap-12 sm:gap-32 lg:gap-48">
          <!-- Opponent Played Card -->
          <div class="relative w-20 sm:w-40 h-28 sm:h-60">
            <Card
              v-if="game.playedCards.player2"
              class="shadow-2xl border-4 overflow-hidden"
              :class="
                game.playedCards.player2.isWinner
                  ? 'border-yellow-400 shadow-yellow-400/70'
                  : 'border-transparent'
              "
            >
              <img
                :src="`/assets/cards/${game.playedCards.player2.filename}`"
                class="w-full h-full object-cover"
                alt="Opponent played card"
              />
            </Card>
            <div
              v-else
              class="flex justify-center items-center bg-gray-800/50 border-2 border-gray-600 border-dashed rounded-xl w-full h-full text-gray-500 text-xs sm:text-lg"
            >
              Waiting...
            </div>
          </div>

          <!-- Your Played Card -->
          <div class="relative w-20 sm:w-40 h-28 sm:h-60">
            <Card
              v-if="game.playedCards.player1"
              class="shadow-2xl border-4 overflow-hidden"
              :class="
                game.playedCards.player1.isWinner
                  ? 'border-yellow-400 shadow-yellow-400/70'
                  : 'border-transparent'
              "
            >
              <img
                :src="`/assets/cards/${game.playedCards.player1.filename}`"
                class="w-full h-full object-cover"
                alt="Your played card"
              />
            </Card>
            <div
              v-else
              class="flex justify-center items-center bg-gray-800/50 border-2 border-gray-600 border-dashed rounded-xl w-full h-full text-gray-500 text-xs sm:text-lg"
            >
              Waiting...
            </div>
          </div>
        </div>

        <!-- Trump Card + Turn Timer -->
        <div
          class="flex sm:flex-row flex-col justify-center items-center gap-8 sm:gap-16 w-full max-w-4xl"
        >
          <Tooltip>
            <TooltipTrigger as-child>
              <Card class="bg-amber-700/90 shadow-2xl p-3 sm:p-6 border-4 border-amber-500">
                <p class="mb-2 font-bold text-amber-100 text-xs sm:text-lg text-center">Trump</p>
                <img
                  v-if="game.trumpCard"
                  :src="`/assets/cards/${game.trumpCard.filename}`"
                  class="shadow-lg mx-auto rounded-lg w-12 sm:w-28 h-16 sm:h-40"
                  alt="Trump card"
                />
                <div v-else class="bg-amber-900/50 rounded-lg w-12 sm:w-28 h-16 sm:h-40" />
              </Card>
            </TooltipTrigger>
            <TooltipContent>Trump suit beats all others</TooltipContent>
          </Tooltip>

          <div class="text-center">
            <!-- 1. Waiting for opponent -->
            <p
              v-if="game.status === 'waiting'"
              class="mb-6 font-semibold text-gray-300 text-lg sm:text-2xl animate-pulse"
            >
              Waiting for opponent to join...
            </p>

            <!-- 2. Game Finished: Show Winner (SAFE CHECK) -->
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

            <!-- 3. In Progress: Turn + Timer -->
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

              <!-- Progress Bar -->
              <div class="flex justify-center mb-4">
                <Progress
                  :value="timerPercentage"
                  class="rounded-full w-48 sm:w-96 h-4 sm:h-8 overflow-hidden"
                  :class="progressBarColorClass"
                />
              </div>

              <!-- Timer -->
              <p
                class="font-mono font-bold text-3xl sm:text-5xl transition-all duration-200"
                :class="timerTextClass"
              >
                {{ game.timerSeconds }}<span class="opacity-70 text-lg sm:text-2xl">s</span>
              </p>

              <!-- Low time warning -->
              <p
                v-if="game.timerSeconds <= 10 && game.timerSeconds > 0"
                class="mt-4 font-bold text-red-500 text-xl animate-pulse"
              >
                Hurry up!
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator class="opacity-40 my-4 sm:my-8" />

      <!-- Your Info -->
      <div class="flex sm:flex-row flex-col justify-between items-center gap-4 p-4 sm:p-8 w-full">
        <div class="flex items-center gap-3 sm:gap-5">
          <Avatar class="border-2 border-white/20 w-10 sm:w-16 h-10 sm:h-16">
            <AvatarImage :src="game.myAvatar || '/avatars/me.jpg'" alt="Your avatar" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div class="sm:text-left text-center">
            <p class="font-semibold text-sm sm:text-xl">{{ game.myNickname }}</p>
            <Badge variant="default" class="text-xs sm:text-base">
              {{ game.myPoints ?? 0 }} points
            </Badge>
          </div>
        </div>

        <Button
          v-if="game.status === 'playing'"
          variant="destructive"
          size="lg"
          class="px-6 sm:px-10 h-10 sm:h-14 text-sm sm:text-lg"
          @click="game.resign()"
        >
          Resign
        </Button>
      </div>

      <div class="flex flex-wrap justify-center gap-3 sm:gap-6 bg-black/40 p-4 sm:p-8 w-full">

        <div class="flex flex-wrap justify-center gap-3 sm:gap-6">
          <Tooltip v-for="card in game.myHand" :key="`card-${card.filename}`">
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                class="relative shadow-2xl p-0 rounded-xl overflow-hidden transition-all duration-300"
                :class="[
                  // Base styles always
                  'transition-opacity transition-filter duration-300',

                  // When NOT your turn: locked appearance
                  !game.isMyTurn
                    ? 'opacity-60 grayscale cursor-not-allowed'
                    : 'opacity-100 grayscale-0 cursor-pointer',

                  // Hover effects — ONLY when it IS your turn
                  game.isMyTurn
                    ? 'hover:scale-110 sm:hover:scale-125 ring-4 ring-blue-500/70 scale-105'
                    : 'hover:scale-100',
                ]"
                @click="game.isMyTurn ? game.playCard(card) : null"
              >
                <img
                  :src="`/assets/cards/${card.filename}`"
                  class="rounded-lg w-16 sm:w-32 h-24 sm:h-48 object-cover pointer-events-none"
                  alt="Card"
                />

                <!-- Stronger lock overlay when not your turn -->
                <div
                  v-if="!game.isMyTurn"
                  class="absolute inset-0 bg-black/50 rounded-xl pointer-events-none"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" class="max-w-64">
              <span class="font-semibold"
                >{{ card.rank || 'Unknown' }} of {{ card.suit || 'Unknown' }}</span
              >
              <div class="opacity-90 mt-1 text-sm">{{ card.value || 0 }} points</div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <!-- Game/Match Over Overlay -->
      <div
        v-if="game.status === 'ended'"
        class="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-md"
      >
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
            {{
              game.gameOverData?.reason || (game.isMatch ? 'Best of 7 reached' : 'Hand completed')
            }}
          </p>

          <div class="space-y-3 bg-gray-800/50 mb-8 p-6 rounded-xl">
            <div class="flex justify-between text-white text-lg">
              <span>You:</span>
              <span class="font-bold text-green-300">{{ game.myFinalPoints }} pts</span>
            </div>
            <div class="flex justify-between text-white text-lg">
              <span>{{ game.opponentNickname }}:</span>
              <span class="font-bold text-red-300">{{ game.opponentFinalPoints }} pts</span>
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
    </div>
  </TooltipProvider>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inject } from 'vue'
import { useGameStore } from '@/stores/game'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { AvatarImage } from '@/components/ui/avatar'
import { AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const socket = inject('socket')
const game = useGameStore()
const gameId = route.params.id

// Opponent hand fanning logic
const opponentCardStyle = (n, count) => {
  if (count === 0) return {}
  const offset = n - (count + 1) / 2
  const spacing = count >= 8 ? 10 : count >= 6 ? 14 : count >= 4 ? 20 : 30
  const rotation = count >= 8 ? 3 : count >= 6 ? 5 : count >= 4 ? 7 : 10
  const lift = Math.abs(offset) * (count >= 8 ? 4 : 8)
  return {
    transform: `translateX(${offset * spacing}px) rotate(${offset * rotation}deg) translateY(${lift}px)`,
  }
}

// Final points for game over screen
const myFinalPoints = computed(() => {
  if (!game.gameOverData?.points) return 0
  return game.gameOverData.points[game.youAre] ?? 0
})

const opponentFinalPoints = computed(() => {
  if (!game.gameOverData?.points) return 0
  const opp = game.youAre === 'player1' ? 'player2' : 'player1'
  return game.gameOverData.points[opp] ?? 0
})

onMounted(async () => {
  if (!gameId) {
    console.error('No game/match ID in route')
    router.push('/lobby')
    return
  }

  if (game.currentMatchId !== gameId) {
    game.reset()
    game.currentMatchId = gameId
  }

  const joinAction = route.query.type === 'match' ? game.joinMatch : game.joinGame

  try {
    await joinAction(gameId)
  } catch (err) {
    console.error('Failed to join:', err)
    alert('Could not join the game/match.')
    router.push('/lobby')
  }
})

const isPlayer1 = computed(() => game.players?.player1.id === authStore.currentUserID)
const isPlayer2 = computed(() => game.players?.player2 === authStore.currentUserID)

// Safe access to playedCards
const playedCards = computed(() => game.playedCards || { player1: {}, player2: {} })

// Has a winner been determined?
const hasWinner = computed(
  () =>
    playedCards.value.player1?.isWinner === true || playedCards.value.player2?.isWinner === true,
)

const player1Wins = computed(() => playedCards.value.player1?.isWinner === true)
const player2Wins = computed(() => playedCards.value.player2?.isWinner === true)

// Timer helpers (cleaner)
const timerPercentage = computed(() => (game.timerSeconds / game.turnTimeLimit) * 100)

const progressBarColorClass = computed(() => {
  const ratio = game.timerSeconds / game.turnTimeLimit
  if (ratio > 0.5) return 'bg-green-500'
  if (ratio > 0.2) return 'bg-yellow-500'
  return 'bg-red-500'
})

const timerTextClass = computed(() => {
  if (game.timerSeconds <= 10 && game.timerSeconds > 0) {
    return 'text-red-400 animate-pulse'
  }
  return game.isMyTurn ? 'text-green-400' : 'text-yellow-300'
})
</script>

<script setup>
import { ref, computed } from 'vue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const myHand = ref([])
const opponentHandCount = ref(9)
const stockCount = ref(22)
const trumpCard = ref(null)
const playedCards = ref({ player1: null, player2: null })
const myPoints = ref(0)
const opponentPoints = ref(0)
const isMyTurn = ref(false)
const timerSeconds = ref(20)
const myNickname = ref('You')
const opponentNickname = ref('Opponent')

const playableCards = computed(() => {
  return myHand.value
})

const playCard = (card) => {
  if (!isMyTurn.value || !playableCards.value.includes(card)) return
  console.log('Playing card:', card)
}
</script>

<template>
  <TooltipProvider>
    <div
      class="flex flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800 w-full min-h-screen text-white"
    >
      <div class="flex sm:flex-row flex-col justify-between items-center gap-4 p-4 sm:p-6 w-full">
        <div class="flex items-center gap-3">
          <Avatar class="border-2 border-white/20 w-12 sm:w-14 h-12 sm:h-14">
            <AvatarImage src="/avatars/opponent.jpg" alt="Opponent avatar" />
            <AvatarFallback>OP</AvatarFallback>
          </Avatar>
          <div class="sm:text-left text-center">
            <p class="font-semibold text-base sm:text-lg">{{ opponentNickname }}</p>
            <Badge variant="secondary" class="text-sm sm:text-base"
              >{{ opponentPoints }} points</Badge
            >
          </div>
        </div>

        <Badge variant="outline" class="px-3 sm:px-4 py-1 sm:py-2 text-base sm:text-lg">
          Stock: {{ stockCount }}
        </Badge>
      </div>

      <!-- Opponent Hand – Beautiful curved "leque" fan -->
      <div class="relative mb-6 sm:mb-10 px-4 w-full h-40 sm:h-48">
        <div class="top-1/2 absolute inset-x-0 -translate-y-1/2">
          <div class="flex justify-center">
            <div
              v-for="n in opponentHandCount"
              :key="n"
              class="absolute transition-all duration-300"
              :style="{
                transform: `
                  translateX(${(n - (opponentHandCount + 1) / 2) * (opponentHandCount >= 7 ? 22 : opponentHandCount >= 4 ? 30 : 45)}px)
                  rotate(${(n - (opponentHandCount + 1) / 2) * (opponentHandCount >= 7 ? 4 : opponentHandCount >= 4 ? 6 : 8)}deg)
                  translateY(${Math.abs(n - (opponentHandCount + 1) / 2) * (opponentHandCount >= 7 ? 8 : 12)}px)
                `,
              }"
            >
              <img
                src="/assets/cards/BACK.svg"
                alt="Card back"
                class="shadow-2xl border border-white/10 rounded-lg w-20 sm:w-24 h-28 sm:h-36"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col flex-1 justify-center items-center gap-8 sm:gap-12 px-4 w-full">
        <div
          class="flex sm:flex-row flex-col sm:justify-center items-center gap-8 sm:gap-20 lg:gap-32 w-full max-w-5xl"
        >
          <Card
            v-if="playedCards.player2"
            class="border-4 overflow-hidden"
            :class="
              playedCards.player2.isWinner
                ? 'border-yellow-400 shadow-yellow-400/50'
                : 'border-transparent'
            "
          >
            <img
              :src="`/assets/cards/${playedCards.player2.filename}`"
              class="w-28 sm:w-36 h-40 sm:h-52"
              alt="Opponent played card"
            />
          </Card>
          <div
            v-else
            class="bg-gray-800/50 border-2 border-gray-600 border-dashed rounded-xl w-28 sm:w-36 h-40 sm:h-52"
          />

          <Card
            v-if="playedCards.player1"
            class="border-4 overflow-hidden"
            :class="
              playedCards.player1.isWinner
                ? 'border-yellow-400 shadow-yellow-400/50'
                : 'border-transparent'
            "
          >
            <img
              :src="`/assets/cards/${playedCards.player1.filename}`"
              class="w-28 sm:w-36 h-40 sm:h-52"
              alt="Your played card"
            />
          </Card>
          <div
            v-else
            class="bg-gray-800/50 border-2 border-gray-600 border-dashed rounded-xl w-28 sm:w-36 h-40 sm:h-52"
          />
        </div>

        <div
          class="flex sm:flex-row flex-col sm:justify-center items-center gap-8 sm:gap-12 w-full max-w-4xl"
        >
          <Tooltip>
            <TooltipTrigger as-child>
              <Card class="bg-amber-700/80 shadow-xl p-4 sm:p-5 border-amber-500">
                <p class="mb-2 font-bold text-amber-100 text-center">Trump</p>
                <img
                  v-if="trumpCard"
                  :src="`/assets/cards/${trumpCard.filename}`"
                  class="mx-auto rounded-lg w-16 sm:w-24 h-24 sm:h-32"
                  alt="Trump card"
                />
              </Card>
            </TooltipTrigger>
            <TooltipContent>Trump suit beats all other suits</TooltipContent>
          </Tooltip>

          <div class="text-center">
            <p class="mb-3 font-bold text-2xl sm:text-3xl">
              {{ isMyTurn ? 'Your Turn' : 'Waiting for opponent...' }}
            </p>
            <Progress :value="(timerSeconds / 20) * 100" class="w-48 sm:w-64 h-4" />
            <p class="mt-3 font-mono text-xl sm:text-2xl">{{ timerSeconds }}s</p>
          </div>
        </div>
      </div>

      <Separator class="opacity-50 my-4 sm:my-6" />

      <div class="flex sm:flex-row flex-col justify-between items-center gap-4 p-4 sm:p-6 w-full">
        <div class="flex items-center gap-3">
          <Avatar class="border-2 border-white/20 w-12 sm:w-14 h-12 sm:h-14">
            <AvatarImage src="/avatars/me.jpg" alt="Your avatar" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div class="sm:text-left text-center">
            <p class="font-semibold text-base sm:text-lg">{{ myNickname }}</p>
            <Badge variant="default" class="text-sm sm:text-base">{{ myPoints }} points</Badge>
          </div>
        </div>

        <Button variant="destructive" size="lg">Resign</Button>
      </div>

      <div class="flex flex-wrap justify-center gap-3 sm:gap-4 bg-black/30 p-4 sm:p-6 w-full">
        <Tooltip v-for="card in myHand" :key="card.filename">
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              class="shadow-2xl rounded-xl overflow-hidden transition-all"
              :class="[
                playableCards.includes(card)
                  ? 'ring-4 ring-blue-500 hover:scale-110 scale-105 cursor-pointer sm:scale-110 sm:hover:scale-115'
                  : 'opacity-60 cursor-not-allowed',
              ]"
              :disabled="!playableCards.includes(card)"
              @click="playCard(card)"
            >
              <img
                :src="`/assets/cards/${card.filename}`"
                class="w-20 sm:w-28 h-32 sm:h-40"
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
  </TooltipProvider>
</template>

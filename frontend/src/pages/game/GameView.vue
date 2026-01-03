<template>
  <TooltipProvider>
    <div
      class="flex flex-col bg-linear-to-b from-emerald-950 via-emerald-900 to-emerald-800 w-full min-h-screen text-white"
    >
      <div class="flex sm:flex-row flex-col justify-between items-center gap-4 p-4 sm:p-8 w-full">
        <OpponentInfo
          :avatar="game.opponentAvatar || '/avatars/opponent.jpg'"
          :nickname="game.opponentNickname || 'Waiting for opponent...'"
          :points="game.opponentPoints ?? 0"
        />

        <GameBadges :is-match="game.isMatch" :stake="game.stake" :stock-count="game.stockCount" />
      </div>

      <OpponentHand :hand-count="game.opponentHandCount" />

      <div class="flex flex-col flex-1 justify-center items-center gap-8 sm:gap-16 px-4">
        <div class="flex justify-center items-center gap-12 sm:gap-32 lg:gap-48">
          <PlayedCardSlot :card="game.playedCards.player2" />
          <PlayedCardSlot :card="game.playedCards.player1" />
        </div>

        <div
          class="flex sm:flex-row flex-col justify-center items-center gap-8 sm:gap-16 w-full max-w-4xl"
        >
          <TrumpCardDisplay :trump-card="game.trumpCard" />
          <TurnStatus />
        </div>
      </div>

      <Separator class="opacity-40 my-4 sm:my-8" />

      <div class="flex sm:flex-row flex-col justify-between items-center gap-4 p-4 sm:p-8 w-full">
        <PlayerInfo
          :avatar="authStore.currentUser?.avatar_url || '/avatars/me.jpg'"
          :nickname="game.myNickname"
          :points="game.myPoints ?? 0"
          :is-playing="game.status === 'playing'"
          @resign="game.resign()"
        />

        <div v-if="game.status !== 'playing'" class="w-32 sm:w-auto" />
      </div>

      <PlayerHand :hand="game.myHand" :is-my-turn="game.isMyTurn" @play-card="game.playCard" />

      <GameOverOverlay v-if="game.status === 'ended'" />
    </div>
  </TooltipProvider>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import OpponentInfo from '@/components/game/OpponentInfo.vue'
import PlayerInfo from '@/components/game/PlayerInfo.vue'
import GameBadges from '@/components/game/GameBadges.vue'
import OpponentHand from '@/components/game/OpponentHand.vue'
import PlayedCardSlot from '@/components/game/PlayedCardSlot.vue'
import TrumpCardDisplay from '@/components/game/TrumpCardDisplay.vue'
import TurnStatus from '@/components/game/TurnStatus.vue'
import PlayerHand from '@/components/game/PlayerHand.vue'
import GameOverOverlay from '@/components/game/GameOverOverlay.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const game = useGameStore()
const authStore = useAuthStore()
const gameId = route.params.id

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
</script>

<style scoped>
/* Optional: add any page-specific styles here if needed */
</style>

<script setup>
import { inject, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'

import GameModeCard from '@/components/home/GameModeCard.vue'
import SingleplayerSection from '@/components/home/SingleplayerSection.vue'
import MultiplayerSection from '@/components/home/MultiplayerSection.vue'
import Button from '@/components/ui/button/Button.vue'
import { toast } from 'vue-sonner'

const game = useGameStore()
const authStore = useAuthStore()
const router = useRouter()
const socket = inject('socket')

const isCreating = ref(false)

socket.once('gameCreated', (gameId) => {
  console.log('gameCreated received:', gameId)
  isCreating.value = false

  game.gameId = gameId
  game.youAre = 'player1'

  router.push({ name: 'game', params: { id: gameId } })
})

onBeforeUnmount(() => {
  socket.off('gameCreated')
})

const createNewGame = async (variant) => {
  if (isCreating.value) return
  isCreating.value = true

  try {
    await game.createGame(variant)
  } catch (err) {
    console.error('Create game failed:', err)
    toast.error('Failed to create game')
    isCreating.value = false
  }
}

const goToLobby = () => router.push('/lobby')
const goToLogin = () => router.push('/login')
</script>

<template>
  <div class="flex flex-col justify-center items-center mx-auto p-4 sm:p-6 min-h-screen container">
    <header class="mb-10 text-center">
      <h1 class="mb-2 font-bold text-3xl sm:text-4xl tracking-tight">Bisca Platform</h1>
      <p class="text-muted-foreground">Choose your game mode</p>
    </header>

    <section class="gap-6 grid grid-cols-1 md:grid-cols-2 w-full max-w-4xl">
      <GameModeCard
        title="Singleplayer"
        description="Play against our intelligent Bot. Perfect for practice."
        emoji="🤖"
        badge="Offline-ish"
      >
        <SingleplayerSection :is-creating="isCreating" @create-game="createNewGame" />
      </GameModeCard>
      <GameModeCard
        title="Multiplayer"
        description="Challenge other players in real-time matchups."
        emoji="🌍"
        badge="Online"
        :disabled="!authStore.isLoggedIn"
      >
        <MultiplayerSection
          :is-logged-in="authStore.isLoggedIn"
          :is-creating="isCreating"
          @create-game="createNewGame"
          @go-to-lobby="goToLobby"
          @go-to-login="goToLogin"
          @creating="(val) => (isCreating = val)"
        />

        <template #locked-content>
          <Lock class="mb-3 w-10 h-10 text-muted-foreground" aria-hidden="true" />
          <h3 class="mb-1 font-semibold text-lg">Login Required</h3>
          <p class="mb-4 max-w-xs text-muted-foreground text-sm text-center">
            Log in to play with others
          </p>
          <Button @click="goToLogin" size="sm">Log In</Button>
        </template>
      </GameModeCard>
    </section>
  </div>
</template>

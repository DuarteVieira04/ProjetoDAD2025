<script setup>
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/button/Button.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-vue-next'

const game = useGameStore()
const authStore = useAuthStore()
const router = useRouter()
const socket = inject('socket')

const isCreating = ref(false)

// Attach listener early for the creator
socket.once('gameCreated', (gameId) => {
  console.log('gameCreated received:', gameId)
  isCreating.value = false

  // Creator is automatically player1
  game.gameId = gameId
  game.youAre = 'player1'

  router.push({ name: 'game', params: { id: gameId } })
})

onBeforeUnmount(() => {
  socket.off('gameCreated')
})

const createNewGame = async (variant = '9') => {
  if (isCreating.value) return
  isCreating.value = true

  try {
    await game.createGame(variant)
    // No need to call joinGame here; server auto-assigns player1
  } catch (err) {
    console.error('Create game failed:', err)
    alert('Failed to create game')
    isCreating.value = false
  }
}

const goToLobby = () => {
  router.push('/lobby')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="flex flex-col justify-center items-center p-4 sm:p-6 min-h-screen container">
    <div class="mb-8 text-center">
      <h1 class="mb-2 font-bold text-3xl sm:text-4xl tracking-tight">Bisca Platform</h1>
      <p class="text-muted-foreground text-base">Choose your game mode</p>
    </div>

    <div class="gap-4 grid grid-cols-1 md:grid-cols-2 w-full max-w-3xl">
      <!-- Singleplayer Section -->
      <Card class="flex flex-col border-2 shadow-sm hover:shadow-md transition-all overflow-hidden">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-xl">
            🤖 Singleplayer
            <Badge variant="secondary" class="text-xs">Offline-ish</Badge>
          </CardTitle>
          <CardDescription class="text-sm">
            Play against our intelligent Bot. Perfect for practice.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex-1 flex flex-col justify-center gap-3 pt-4">
          <Button 
            @click="createNewGame('bot-9')" 
            class="w-full h-12 text-sm"
            :disabled="isCreating"
          >
            Bisca de 9 (vs Bot)
          </Button>
          <Button 
            @click="createNewGame('bot-3')" 
            variant="outline" 
            class="w-full h-12 text-sm"
            :disabled="isCreating"
          >
            Bisca de 3 (vs Bot)
          </Button>
        </CardContent>
      </Card>

      <!-- Multiplayer Section -->
      <div class="relative flex flex-col h-full group">
        <!-- Auth Overlay -->
        <div 
          v-if="!authStore.isLoggedIn" 
          class="z-10 absolute inset-0 flex flex-col justify-center items-center bg-background/60 backdrop-blur-sm rounded-xl border-2"
        >
          <Lock class="mb-3 w-8 h-8 text-muted-foreground" />
          <h3 class="mb-1 font-semibold text-lg">Login Required</h3>
          <p class="mb-4 text-muted-foreground text-xs">Log in to play with others</p>
          <Button @click="goToLogin" size="sm">Log In</Button>
        </div>

        <Card 
          class="flex flex-col border-2 shadow-sm h-full overflow-hidden" 
          :class="{ 'opacity-50 pointer-events-none select-none': !authStore.isLoggedIn }"
        >
          <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-xl">
              🌍 Multiplayer
              <Badge class="text-xs">Online</Badge>
            </CardTitle>
            <CardDescription class="text-sm">
              Challenge other players in real-time matchups.
            </CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-1 gap-3 pt-4">
            <Button 
              @click="createNewGame('9')" 
              class="w-full h-10 text-sm"
              :disabled="isCreating"
            >
              Start Bisca de 9 (PvP)
            </Button>
            <Button 
              @click="createNewGame('3')" 
              variant="outline" 
              class="w-full h-10 text-sm"
              :disabled="isCreating"
            >
              Start Bisca de 3 (PvP)
            </Button>
            
            <div class="relative py-2">
                <div class="absolute inset-0 flex items-center">
                    <span class="w-full border-t" />
                </div>
                <div class="relative flex justify-center text-[10px] uppercase">
                    <span class="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <Button 
              @click="goToLobby" 
              variant="secondary" 
              class="w-full h-10 text-sm"
            >
              Browse Open Games (Lobby)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

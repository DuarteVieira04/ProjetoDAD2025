<template>
  <div class="mx-auto p-4 max-w-4xl">
    <div class="mb-8 text-center">
      <h1 class="font-bold text-3xl">Create New Match</h1>
      <p class="mt-2 text-muted-foreground">
        Choose your game type and challenge someone—or practice against a bot!
      </p>
    </div>

    <!-- Create Form Card -->
    <div class="bg-card shadow-sm border rounded-xl overflow-hidden">
      <div class="p-6 sm:p-8">
        <form @submit.prevent="createMatch" class="space-y-8">
          <!-- Game Type -->
          <div class="space-y-3">
            <label class="font-medium text-sm">Game Type</label>
            <div class="gap-4 grid grid-cols-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  v-model="form.type"
                  value="3"
                  required
                  class="w-5 h-5 text-primary"
                />
                <span class="font-medium">Bisca de 3</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  v-model="form.type"
                  value="9"
                  required
                  class="w-5 h-5 text-primary"
                />
                <span class="font-medium">Bica de 9</span>
              </label>
            </div>
          </div>

          <!-- Mode -->
          <div class="space-y-3">
            <label class="font-medium text-sm">Match Mode</label>
            <div class="gap-4 grid grid-cols-2">
              <label
                class="flex flex-col has-checked:bg-primary/10 p-4 border has-checked:border-primary rounded-lg transition cursor-pointer"
              >
                <input type="radio" v-model="form.mode" value="single" required class="sr-only" />
                <div class="flex items-center gap-3">
                  <div class="flex justify-center items-center bg-muted rounded-full w-10 h-10">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">Single</div>
                    <div class="text-muted-foreground text-xs">Practice vs Bot</div>
                  </div>
                </div>
              </label>

              <label
                class="flex flex-col has-checked:bg-primary/10 p-4 border has-checked:border-primary rounded-lg transition cursor-pointer"
              >
                <input type="radio" v-model="form.mode" value="multi" required class="sr-only" />
                <div class="flex items-center gap-3">
                  <div class="flex justify-center items-center bg-muted rounded-full w-10 h-10">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">Multi</div>
                    <div class="text-muted-foreground text-xs">Human vs Human</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Stake (only shows for Multi) -->
          <div v-if="form.mode === 'multi'" class="space-y-2">
            <label for="stake" class="font-medium text-sm">Stake Amount</label>
            <div class="relative">
              <span
                class="top-1/2 left-4 absolute font-semibold text-primary text-lg -translate-y-1/2"
                >$</span
              >
              <input
                id="stake"
                v-model.number="form.stake"
                type="number"
                min="3"
                max="100"
                required
                placeholder="25"
                class="bg-muted/50 py-3 pr-4 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full transition"
              />
            </div>
            <p class="text-muted-foreground text-xs">Between $3 and $100. Winner takes all.</p>
          </div>

          <!-- Current User Preview -->
          <div class="flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
            <Avatar class="border-2 border-white/20 w-12 h-12">
              <AvatarImage :src="currentUser?.avatar_url" />
              <AvatarFallback>
                {{ (authStore.currentUser?.nickname?.[0] || '?').toUpperCase() }}
              </AvatarFallback>
            </Avatar>
            <div>
              <p class="font-medium">You will be the match owner</p>
              <p class="text-muted-foreground text-sm">
                {{ authStore.currentUser?.nickname || 'Player' }}
              </p>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isCreating"
            class="flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 shadow-sm px-6 py-4 rounded-lg w-full font-semibold text-primary-foreground text-lg transition disabled:cursor-not-allowed"
          >
            <span v-if="isCreating">
              <div
                class="inline-block border-primary-foreground border-t-2 border-b-2 rounded-full w-5 h-5 animate-spin"
              ></div>
              Creating Match...
            </span>
            <span v-else>Create Match</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="bg-green-100 dark:bg-green-900/30 mt-6 p-4 rounded-lg font-medium text-green-800 dark:text-green-200 text-center"
    >
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'
import AvatarFallback from '@/components/ui/avatar/AvatarFallback.vue'
import { useMatchStore } from '@/stores/match'
import { useAuthStore } from '@/stores/auth'

const matchStore = useMatchStore()
const authStore = useAuthStore()

// Replace with your actual current user (from auth store)

const form = ref({
  type: '9',
  mode: 'multi',
  stake: 25,
})

const isCreating = ref(false)
const successMessage = ref('')

const createMatch = async () => {
  isCreating.value = true
  successMessage.value = ''

  try {
    const payload = {
      type: Number.parseInt(form.value.type),
      mode: form.value.mode,
      ...(form.value.mode === 'multi' && { stake: Number.parseInt(form.value.stake) }),
    }
    console.log(payload)
    await matchStore.createMatch(payload)

    successMessage.value = 'Match created successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 1000)
    // setTimeout(() => {
    //   router.push({ name: 'matches' }) // adjust route name if different
    // }, 1500)
  } catch (err) {
    console.error('Create match failed:', err)
    successMessage.value = ''
    alert('Failed to create match. Please try again.')
  } finally {
    isCreating.value = false
  }
}
</script>

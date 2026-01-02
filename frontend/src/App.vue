<template>
  <Toaster richColors />

  <!-- Full-Width Header -->
  <header class="bg-background/95 supports-backdrop-filter:bg-background/60 backdrop-blur border-b">
    <div class="flex flex-row items-center px-4 md:px-8 w-full h-16">
      <!-- Left: Logo / Page Title + User Name -->
      <div class="flex items-center gap-2 font-semibold text-xl">
        <RouterLink to="/" class="flex items-center gap-2 hover:opacity-80 transition">
          {{ pageTitle }}
        </RouterLink>
        <p v-if="authStore.currentUser" class="font-normal text-muted-foreground text-sm">
          <RouterLink to="/profile" class="flex items-center gap-2 hover:opacity-80 transition">
            ({{ authStore.currentUser?.name }})
          </RouterLink>
        </p>
      </div>
      <div class="flex flex-1 justify-end text-end">
        <NavBar
          @logout="logout"
          :userLoggedIn="authStore.isLoggedIn"
          :isAdmin="authStore.isAdmin()"
          :userCoins="authStore.userCoins"
        />
      </div>
    </div>
  </header>

  <!-- Main Content: Still uses container for better readability on large screens -->
  <main class="mx-auto px-4 py-8 max-w-7xl container">
    <RouterView />
  </main>
</template>
<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'
import { ref, onMounted } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import NavBar from './components/layout/NavBar.vue'
import { useAuthStore } from './stores/auth'
import { useSocketStore } from './stores/socket'

const authStore = useAuthStore()

const socketStore = useSocketStore()

// const year = new Date().getFullYear()
const pageTitle = ref(`Projeto DAD - Bisca`)

const logout = () => {
  toast.promise(authStore.logout(), {
    loading: 'Calling API',
    success: () => {
      return 'Logout Successful '
    },
    error: (data) =>
      `[API] Error logging out - ${data?.response?.data?.message || data?.message || 'Unknown error'}`,
  })
}

onMounted(() => {
  socketStore.handleConnection()
  if (authStore.isLoggedIn) {
    authStore.fetchUserCoins()
  }
})
</script>

<style></style>
`

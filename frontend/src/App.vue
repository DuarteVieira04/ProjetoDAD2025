<template>
  <Toaster richColors />
  <nav class="flex flex-row justify-between p-5 max-w-full align-middle">
    <div class="text-xl align-middle">
      <RouterLink to="/"> {{ pageTitle }} </RouterLink>
      <span class="text-xs" v-if="authStore.currentUser"
        >&nbsp;&nbsp;&nbsp; ({{ authStore.currentUser?.name }})
      </span>
    </div>
    <NavBar @logout="logout" :userLoggedIn="authStore.isLoggedIn" :isAdmin="authStore.isAdmin" />
  </nav>
  <div>
    <main class="m-auto container">
      <RouterView />
    </main>
  </div>
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

const year = new Date().getFullYear()
const pageTitle = ref(`DAD ${year}/${String(year + 1).slice(-2)}`)

const logout = () => {
  toast.promise(authStore.logout(), {
    loading: 'Calling API',
    success: () => {
      return 'Logout Sucessfull '
    },
    error: (data) => `[API] Error saving game - ${data?.response?.data?.message}`,
  })
}

onMounted(() => {
  socketStore.handleConnection()
})
</script>

<style></style>
`

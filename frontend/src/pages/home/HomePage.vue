<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
console.log(auth.isAdmin())
</script>

<template>
  <div>
    <h1>Bisca Game</h1>
  </div>
</template>

<style scoped></style>
`

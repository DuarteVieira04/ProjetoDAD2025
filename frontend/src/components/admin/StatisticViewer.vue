<template>
  <Card class="space-y-6 p-6">
    <!-- Header -->
    <CardHeader>
      <CardTitle>Estatísticas do Sistema</CardTitle>
      <CardDescription>Resumo dos principais dados do jogo</CardDescription>
    </CardHeader>

    <!-- Stats Grid -->
    <div class="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
      <div class="bg-gray-50 shadow p-4 rounded-lg">
        <h3 class="font-medium text-gray-500 text-sm">Total de Users</h3>
        <p class="mt-2 font-semibold text-gray-900 text-2xl">{{ stats.totalUsers }}</p>
      </div>

      <div class="bg-gray-50 shadow p-4 rounded-lg">
        <h3 class="font-medium text-gray-500 text-sm">Total de Jogos</h3>
        <p class="mt-2 font-semibold text-gray-900 text-2xl">{{ stats.totalGames }}</p>
      </div>

      <div class="bg-gray-50 shadow p-4 rounded-lg">
        <h3 class="font-medium text-gray-500 text-sm">Total de Matches</h3>
        <p class="mt-2 font-semibold text-gray-900 text-2xl">{{ stats.totalMatches }}</p>
      </div>

      <div class="bg-gray-50 shadow p-4 rounded-lg">
        <h3 class="font-medium text-gray-500 text-sm">Total de Compras</h3>
        <p class="mt-2 font-semibold text-gray-900 text-2xl">{{ stats.totalPurchases }}</p>
      </div>

      <div class="bg-gray-50 shadow p-4 rounded-lg">
        <h3 class="font-medium text-gray-500 text-sm">Média de tempo de jogo</h3>
        <p class="mt-2 font-semibold text-gray-900 text-2xl">
          {{ formatSeconds(stats.avgPlaytime) }}
        </p>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Props from parent
defineProps({
  stats: { type: Object, required: true },
})

function formatSeconds(seconds) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${h}:${m}:${s}`
}
</script>

<template>
    <div class="p-8 max-w-7xl mx-auto space-y-12 bg-gray-50 min-h-screen">
        <h1 class="text-4xl font-extrabold text-gray-900">Statistics</h1>

        <!-- Public Stats -->
        <section class="space-y-6">
            <h2 class="text-2xl font-semibold text-gray-700">General Statistics</h2>

            <div v-if="loadingPublic" class="text-gray-400 italic">Loading...</div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card
                    class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-blue-500">
                    <CardHeader class="flex items-center gap-2">
                        <Activity class="w-6 h-6 text-blue-500" />
                        <CardTitle>Total Games</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.publicStats?.total_games ?? '-' }}
                    </CardContent>
                </Card>

                <Card
                    class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-green-500">
                    <CardHeader class="flex items-center gap-2">
                        <Award class="w-6 h-6 text-green-500" />
                        <CardTitle>Total Users</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.publicStats?.total_users ?? '-' }}
                    </CardContent>
                </Card>

                <Card
                    class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-purple-500">
                    <CardHeader class="flex items-center gap-2">
                        <CheckCircle class="w-6 h-6 text-purple-500" />
                        <CardTitle>Total Matches</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.publicStats?.total_matches ?? '-' }}
                    </CardContent>
                </Card>
            </div>
        </section>

        <!-- User Stats -->
        <section v-if="statisticsStore.userStats && !loadingUser" class="space-y-6">
            <h2 class="text-2xl font-semibold text-gray-700">My Statistics</h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card
                    class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-blue-500">
                    <CardHeader class="flex items-center gap-2">
                        <Activity class="w-6 h-6 text-blue-500" />
                        <CardTitle>Matches Played</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.userStats.matches_played }}
                    </CardContent>
                </Card>

                <Card
                    class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-green-500">
                    <CardHeader class="flex items-center gap-2">
                        <Award class="w-6 h-6 text-green-500" />
                        <CardTitle>Win / Loss Ratio</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.userStats.win_loss_ratio?.toFixed(2) ?? '-' }}
                    </CardContent>
                </Card>

                <Card
                    class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-purple-500">
                    <CardHeader class="flex items-center gap-2">
                        <CheckCircle class="w-6 h-6 text-purple-500" />
                        <CardTitle>Average Points / Match</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.userStats.average_points_per_match?.toFixed(2) ?? '—' }}
                    </CardContent>
                </Card>
            </div>

            <div class="bg-white shadow-lg rounded-xl p-6">
                <h3 class="text-xl font-semibold text-gray-700 mb-4">Match Summary</h3>
                <BarChart :data="userMatchChartData" />
            </div>

            <div class="bg-white shadow-lg rounded-xl p-6">
                <h3 class="text-xl font-semibold text-gray-700 mb-4">
                    Points Evolution (Last 10 Matches)
                </h3>

                <LineChart :data="recentMatchesLineChartData" />
                <div class="mt-4 flex items-center gap-6">
                    <div class="flex items-center gap-2">
                        <span class="w-4 h-4 rounded-full bg-green-500 block"></span>
                        <span>Win</span>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="w-4 h-4 rounded-full bg-red-500 block"></span>
                        <span>Loss</span>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="w-4 h-4 rounded-full bg-gray-500 block"></span>
                        <span>Draw</span>
                    </div>
                </div>
            </div>


        </section>

        <div v-if="statisticsStore.error" class="text-red-600 font-semibold text-center">
            {{ statisticsStore.error }}
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useStatisticsStore } from '@/stores/statistics'
import BarChart from '@/components/charts/BarChart.vue'
import { Activity, Award, CheckCircle } from 'lucide-vue-next'
import LineChart from '@/components/charts/LineChart.vue'

const statisticsStore = useStatisticsStore()

const loadingPublic = ref(false)
const loadingUser = ref(false)

const loadStatistics = async () => {
    loadingPublic.value = true
    try {
        await statisticsStore.fetchPublicStatistics()
    } finally {
        loadingPublic.value = false
    }

    loadingUser.value = true
    try {
        await statisticsStore.fetchUserStatistics()
    } finally {
        loadingUser.value = false
    }
}

onMounted(loadStatistics)

const userMatchChartData = computed(() => {
    const stats = statisticsStore.userStats || {}
    const matchesWon = stats.matches_won ?? 0
    const matchesLost = stats.matches_lost ?? 0

    return {
        labels: ['Wins', 'Losses'],
        datasets: [
            {
                label: 'Matches',
                backgroundColor: '#4caf50',
                data: [matchesWon, matchesLost],
            },
        ],
    }
})

const recentMatchesLineChartData = computed(() => {
    const activity = statisticsStore.userStats?.recent_activity ?? []

    return {
        labels: activity.map(a =>
            new Date(a.ended_at).toLocaleDateString('pt-PT')
        ),
        datasets: [
            {
                label: 'Points',
                data: activity.map(a => a.points),
                pointBackgroundColor: activity.map(a =>
                    a.result === 'win' ? '#22C55E' : a.result === 'loss' ? '#EF4444' : '#6B7280'
                ),
                borderColor: '#4b7ff2',
                tension: 0.3,
                pointRadius: 8,
            }
        ]
    }
})

</script>

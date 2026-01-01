<template>
    <div class="space-y-6 mx-auto p-6 max-w-7xl">
        <div class="flex justify-between items-center">
            <h1 class="text-4xl font-extrabold text-gray-900">Statistics</h1>
            <Select v-if="authStore.isAdmin()" v-model="viewMode">
                <SelectTrigger class="w-[200px]">
                    <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="admin">Admin Dashboard</SelectItem>
                    <SelectItem value="personal">My Statistics</SelectItem>
                </SelectContent>
            </Select>
        </div>

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
                        <Users class="w-6 h-6 text-green-500" />
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

        <!-- User Stats (for logged in non-admin users OR admins in personal view) -->
        <section v-if="authStore.isLoggedIn && ((authStore.isAdmin() && viewMode === 'personal') || !authStore.isAdmin()) && statisticsStore.userStats && !loadingUser" class="space-y-6">
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

        <!-- Admin Statistics -->
        <section v-if="authStore.isAdmin() && viewMode === 'admin' && !loadingAdmin" class="space-y-8">
            <h2 class="text-2xl font-semibold text-gray-700">Administrator Dashboard</h2>

            <!-- Admin Overview -->
            <div v-if="statisticsStore.adminStats?.overview" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-blue-500">
                    <CardHeader class="flex items-center gap-2">
                        <Activity class="w-6 h-6 text-blue-500" />
                        <CardTitle>Total Matches</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.adminStats.overview.total_matches }}
                    </CardContent>
                </Card>

                <Card class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-green-500">
                    <CardHeader class="flex items-center gap-2">
                        <ShoppingCart class="w-6 h-6 text-green-500" />
                        <CardTitle>Total Purchases</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.adminStats.overview.total_purchases }}
                    </CardContent>
                </Card>

                <Card class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-yellow-500">
                    <CardHeader class="flex items-center gap-2">
                        <Coins class="w-6 h-6 text-yellow-500" />
                        <CardTitle>Coins Purchased</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.adminStats.overview.total_coins_purchased?.toLocaleString() }}
                    </CardContent>
                </Card>

                <Card class="p-5 shadow-lg hover:shadow-2xl transition duration-300 rounded-xl border-t-4 border-red-500">
                    <CardHeader class="flex items-center gap-2">
                        <TrendingDown class="w-6 h-6 text-red-500" />
                        <CardTitle>Coins Spent</CardTitle>
                    </CardHeader>
                    <CardContent class="text-3xl font-bold text-gray-900 mt-2">
                        {{ statisticsStore.adminStats.overview.total_coins_spent?.toLocaleString() }}
                    </CardContent>
                </Card>
            </div>

            <!-- Recent Activity (30 days) -->
            <Card class="p-6 shadow-lg rounded-xl" v-if="statisticsStore.adminStats?.recent_activity">
                <CardHeader>
                    <CardTitle class="text-xl">Recent Activity (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <p class="text-sm text-gray-600">New Games</p>
                            <p class="text-2xl font-bold text-blue-600">
                                {{ statisticsStore.adminStats.recent_activity.recent_games_30d }}
                            </p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <p class="text-sm text-gray-600">New Matches</p>
                            <p class="text-2xl font-bold text-green-600">
                                {{ statisticsStore.adminStats.recent_activity.recent_matches_30d }}
                            </p>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <p class="text-sm text-gray-600">New Users</p>
                            <p class="text-2xl font-bold text-purple-600">
                                {{ statisticsStore.adminStats.recent_activity.recent_users_30d }}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Time Series Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Games by Day -->
                <Card class="p-6 shadow-lg rounded-xl" v-if="gamesByDayChartData">
                    <CardHeader>
                        <CardTitle class="text-xl">Games Per Day (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LineChart :data="gamesByDayChartData" />
                    </CardContent>
                </Card>

                <!-- Matches by Day -->
                <Card class="p-6 shadow-lg rounded-xl" v-if="matchesByDayChartData">
                    <CardHeader>
                        <CardTitle class="text-xl">Matches Per Day (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LineChart :data="matchesByDayChartData" />
                    </CardContent>
                </Card>
            </div>

            <!-- Purchases by Day -->
            <Card class="p-6 shadow-lg rounded-xl" v-if="purchasesByDayChartData">
                <CardHeader>
                    <CardTitle class="text-xl">Purchases Per Day (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <BarChart :data="purchasesByDayChartData" />
                </CardContent>
            </Card>

            <!-- Top Players Tables -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Top Purchasers -->
                <Card class="p-6 shadow-lg rounded-xl" v-if="statisticsStore.adminStats?.top_players?.top_purchasers">
                    <CardHeader>
                        <CardTitle class="text-xl">Top Purchasers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Purchases</TableHead>
                                    <TableHead>Total Coins</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-for="(player, index) in statisticsStore.adminStats.top_players.top_purchasers" :key="player.user_id">
                                    <TableCell class="font-medium">{{ index + 1 }}</TableCell>
                                    <TableCell>{{ player.nickname }}</TableCell>
                                    <TableCell>{{ player.purchase_count }}</TableCell>
                                    <TableCell>{{ player.total_coins?.toLocaleString() }}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <!-- Most Active Players -->
                <Card class="p-6 shadow-lg rounded-xl" v-if="statisticsStore.adminStats?.top_players?.most_active_players">
                    <CardHeader>
                        <CardTitle class="text-xl">Most Active Players</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Matches Played</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-for="(player, index) in statisticsStore.adminStats.top_players.most_active_players" :key="player.user_id">
                                    <TableCell class="font-medium">{{ index + 1 }}</TableCell>
                                    <TableCell>{{ player.nickname }}</TableCell>
                                    <TableCell>{{ player.match_count }}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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
import { useAuthStore } from '@/stores/auth'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { Activity, Award, CheckCircle, Users, ShoppingCart, Coins, TrendingDown } from 'lucide-vue-next'
import { 
    Card, CardHeader, CardTitle, CardContent 
} from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

const statisticsStore = useStatisticsStore()
const authStore = useAuthStore()

const loadingPublic = ref(false)
const loadingUser = ref(false)
const loadingAdmin = ref(false)
const viewMode = ref('admin')

const loadStatistics = async () => {
    // Load public stats for everyone
    loadingPublic.value = true
    try {
        await statisticsStore.fetchPublicStatistics()
    } finally {
        loadingPublic.value = false
    }

    // Load user stats for logged in users (including admins for their personal view)
    if (authStore.isLoggedIn) {
        loadingUser.value = true
        try {
            await statisticsStore.fetchUserStatistics()
        } finally {
            loadingUser.value = false
        }
    }

    // Load admin stats for admins
    if (authStore.isAdmin()) {
        loadingAdmin.value = true
        try {
            await statisticsStore.fetchAdminStatistics()
        } finally {
            loadingAdmin.value = false
        }
    }
}

onMounted(loadStatistics)

// User stats charts
const userMatchChartData = computed(() => {
    const stats = statisticsStore.userStats || {}
    const matchesWon = stats.matches_won ?? 0
    const matchesLost = stats.matches_lost ?? 0

    return {
        labels: ['Wins', 'Losses'],
        datasets: [
            {
                label: 'Matches',
                backgroundColor: ['#4caf50', '#f44336'],
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

// Admin charts
const gamesByDayChartData = computed(() => {
    const data = statisticsStore.adminStats?.time_series?.games_by_day ?? []
    if (data.length === 0) return null

    return {
        labels: data.map(d => new Date(d.date).toLocaleDateString('pt-PT')),
        datasets: [{
            label: 'Games',
            data: data.map(d => d.count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
        }]
    }
})

const matchesByDayChartData = computed(() => {
    const data = statisticsStore.adminStats?.time_series?.matches_by_day ?? []
    if (data.length === 0) return null

    return {
        labels: data.map(d => new Date(d.date).toLocaleDateString('pt-PT')),
        datasets: [{
            label: 'Matches',
            data: data.map(d => d.count),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
        }]
    }
})

const purchasesByDayChartData = computed(() => {
    const data = statisticsStore.adminStats?.time_series?.purchases_by_day ?? []
    if (data.length === 0) return null

    return {
        labels: data.map(d => new Date(d.date).toLocaleDateString('pt-PT')),
        datasets: [{
            label: 'Purchases',
            data: data.map(d => d.count),
            backgroundColor: '#f59e0b',
        }]
    }
})
</script>

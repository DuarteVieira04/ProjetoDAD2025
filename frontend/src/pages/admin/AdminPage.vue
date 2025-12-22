<template>
  <div>
    <UserList
      :users="users"
      :meta="meta"
      :loading="loading"
      :filters="filters"
      @filters-change="onFiltersChange"
      @page-change="onPageChange"
      @go-to-profile="goToProfile"
    />
    <StatisticViewer :stats="stats" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import UserList from '@/components/admin/UserList.vue'
import StatisticViewer from '@/components/admin/StatisticViewer.vue'
import { useAdminStore } from '@/stores/admin'
import router from '@/router'

const adminStore = useAdminStore()

const users = ref([])
const loading = ref(false)
const meta = reactive({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
const filters = reactive({ search: '', type: '', blocked: '' })
const stats = reactive({
  totalUsers: 0,
  totalGames: 0,
  totalMatches: 0,
  totalPurchases: 0,
  avgPlaytime: 0,
})

const fetchUsers = async (page = 1) => {
  loading.value = true
  try {
    adminStore.userListQueryParams.page = page
    adminStore.userListQueryParams.filters.type = filters.type || ''
    adminStore.userListQueryParams.filters.blocked = filters.blocked || ''
    adminStore.userListQueryParams.filters.search = filters.search || ''

    const response = await adminStore.getAllUsers()

    // Assign users array
    users.value = response.data // <-- THIS IS CORRECT

    // Assign pagination metadata
    meta.current_page = response.current_page
    meta.last_page = response.last_page
    meta.total = response.total
    meta.per_page = response.per_page
  } catch (err) {
    users.value = []
    meta.current_page = 1
    meta.last_page = 1
    meta.total = 0
    meta.per_page = 15
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const statsResponse = await adminStore.getStats()

    // Update reactive stats object
    stats.totalUsers = statsResponse.data.total_users || 0
    stats.totalGames = statsResponse.data.total_games || 0
    stats.totalMatches = statsResponse.data.total_matches || 0
    stats.totalPurchases = statsResponse.data.total_purchases || 0
    stats.avgPlaytime = statsResponse.data.average_game_duration || 0
  } catch (error) {
    console.error('Error fetching stats:', error)
    // Reset stats if API fails
    stats.totalUsers = 0
    stats.totalGames = 0
    stats.totalMatches = 0
    stats.totalPurchases = 0
    stats.avgPlaytime = 0
  }
}

const onFiltersChange = (newFilters) => {
  Object.assign(filters, newFilters)
  fetchUsers(1)
}

const onPageChange = (page) => {
  fetchUsers(page)
}

const goToProfile = (userId) => {
  router.push({ name: 'profile', params: { userId } })
}

onMounted(() => {
  fetchUsers()
  fetchStats()
})
</script>

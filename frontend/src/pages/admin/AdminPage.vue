<template>
  <div class="space-y-6 p-6">
    <h1 class="font-semibold text-2xl">Users</h1>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-4">
      <div class="w-64">
        <Label>Search</Label>
        <Input
          v-model="filters.search"
          placeholder="Name, email or nickname"
          @keyup.enter="fetchUsers(1)"
        />
      </div>

      <div class="w-40">
        <Label>Type</Label>
        <Select v-model="filters.type">
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="P">Player</SelectItem>
            <SelectItem value="A">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="w-40">
        <Label>Status</Label>
        <Select v-model="filters.blocked">
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="0">Active</SelectItem>
            <SelectItem value="1">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button @click="fetchUsers(1)">Apply</Button>
    </div>

    <!-- Table -->
    <div class="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nickname</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 5" :key="i">
              <TableCell colspan="5">
                <Skeleton class="w-full h-6" />
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow v-for="user in users" :key="user.id">
              <TableCell>
                <span
                  @click="goToProfile(user.id)"
                  class="text-blue-500 underline cursor-pointer"
                  >{{ user.id }}</span
                ></TableCell
              >
              <TableCell>{{ user.nickname }}</TableCell>
              <TableCell>{{ user.email }}</TableCell>
              <TableCell>
                <Badge :variant="user.type === 'A' ? 'destructive' : 'secondary'">
                  {{ user.type === 'A' ? 'Admin' : 'Player' }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="user.blocked ? 'destructive' : 'success'">
                  {{ user.blocked ? 'Blocked' : 'Active' }}
                </Badge>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex justify-between items-center">
      <p class="text-muted-foreground text-sm">
        Page {{ meta.current_page }} of {{ meta.last_page }} — {{ meta.total }} users
      </p>

      <div class="flex gap-2">
        <Button
          variant="outline"
          :disabled="meta.current_page === 1"
          @click="fetchUsers(meta.current_page - 1)"
        >
          Previous
        </Button>

        <Button
          variant="outline"
          :disabled="meta.current_page === meta.last_page"
          @click="fetchUsers(meta.current_page + 1)"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useAdminStore } from '@/stores/admin'

// shadcn components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'vue-sonner'
import router from '@/router'

const adminStore = useAdminStore()
const goToProfile = (userId) => {
  router.push({
    name: `profile`,
    params: {
      userId,
    },
  })
}
const users = ref([])
const loading = ref(false)

const meta = reactive({
  current_page: 1,
  last_page: 1,
  total: 0,
  per_page: 15,
})

const filters = reactive({
  search: '',
  type: '',
  blocked: '', // '' | '0' | '1'
})

// Sync component filters to store whenever they change
watch(
  filters,
  () => {
    fetchUsers(1) // reset to page 1 on filter change
  },
  { deep: true },
)

const fetchUsers = async (page = 1) => {
  loading.value = true

  try {
    // Update store with current page and filters
    adminStore.userListQueryParams.page = page
    adminStore.userListQueryParams.filters.type = filters.type || ''
    adminStore.userListQueryParams.filters.blocked = filters.blocked || ''

    const response = await adminStore.getAllUsers()

    // Laravel-style pagination
    users.value = response.data
    meta.current_page = response.data.current_page
    meta.last_page = response.data.last_page
    meta.total = response.data.total
    meta.per_page = response.data.per_page

    // Show toast if no users
    if (users.value.length === 0) {
      toast.error('No users found for the selected filters')
    }
  } catch (error) {
    // Optional: handle errors generically
    toast.error('Failed to fetch users')
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

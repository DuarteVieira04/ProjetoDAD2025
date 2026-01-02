<template>
  <div class="space-y-6 p-6">
    <h1 class="font-semibold text-2xl">Users</h1>

    <div class="flex flex-wrap items-end gap-4">
      <div class="w-64">
        <Label>Search</Label>
        <Input
          v-model="localFilters.search"
          placeholder="Name, email or nickname"
          @keyup.enter="applyFilters"
        />
      </div>

      <div class="w-40">
        <Label>Type</Label>
        <Select v-model="localFilters.type">
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
        <Select v-model="localFilters.blocked">
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

      <Button @click="applyFilters">Apply</Button>
    </div>

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
                  @click="$emit('go-to-profile', user.id)"
                  class="text-blue-500 underline cursor-pointer"
                  >{{ user.id }}</span
                >
              </TableCell>
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

    <div class="flex justify-between items-center">
      <p class="text-muted-foreground text-sm">
        Page {{ meta.current_page }} of {{ meta.last_page }} — {{ meta.total }} users
      </p>

      <div class="flex gap-2">
        <Button
          variant="outline"
          :disabled="meta.current_page === 1"
          @click="$emit('page-change', meta.current_page - 1)"
        >
          Previous
        </Button>

        <Button
          variant="outline"
          :disabled="meta.current_page === meta.last_page"
          @click="$emit('page-change', meta.current_page + 1)"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
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

// Props from parent
const props = defineProps({
  users: { type: Array, required: true },
  meta: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  filters: { type: Object, required: true },
})

console.log(props.users)

// Emits
const emit = defineEmits(['filters-change', 'page-change', 'go-to-profile'])

// Local copy of filters for input fields
const localFilters = reactive({ ...props.filters })

// Apply filters
const applyFilters = () => {
  emit('filters-change', { ...localFilters })
}
</script>

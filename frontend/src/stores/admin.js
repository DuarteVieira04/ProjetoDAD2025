import { defineStore } from 'pinia'
import { ref, inject } from 'vue'
import axios from 'axios'
import { useAPIStore } from './api'

export const useAdminStore = defineStore('admin', () => {
  const API_BASE_URL = inject('apiBaseURL')

  // Shared query parameters for user list
  const userListQueryParams = ref({
    page: 1,
    filters: {
      per_page: 15,
      type: '', // '' | 'P' | 'A'
      status: '', // '' | '0' (active) | '1' (blocked) – adjust if backend uses 'blocked'
      sort_by: 'id',
      sort_direction: 'desc',
    },
  })

  const getAllUsers = async () => {
    const apiStore = useAPIStore()

    console.log({ tokenGetter: apiStore.token })
    const params = {
      page: userListQueryParams.value.page,
      per_page: userListQueryParams.value.filters.per_page,
      // Only include filters if they have values
      ...(userListQueryParams.value.filters.type && {
        type: userListQueryParams.value.filters.type,
      }),
      ...(userListQueryParams.value.filters.status && {
        status: userListQueryParams.value.filters.status,
      }),
      sort_by: userListQueryParams.value.filters.sort_by,
      sort_direction: userListQueryParams.value.filters.sort_direction,
    }

    // Debug log to check token
    console.log('[AdminStore] Token before request:', apiStore.token?.value)

    return axios.get(`${API_BASE_URL}/admin/users`, {
      params,
      headers: {
        Authorization: `Bearer ${apiStore.getToken()}`,
      },
    })
  }

  return {
    getAllUsers,
    userListQueryParams,
  }
})

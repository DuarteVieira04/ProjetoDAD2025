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
      blocked: '', // '' | '0' (active) | '1' (blocked) – adjust if backend uses 'blocked'
      sort_by: 'id',
      sort_direction: 'desc',
    },
  })

  const getAllUsers = async () => {
    const apiStore = useAPIStore()
    const token = localStorage.getItem('authToken')

    const filters = { ...userListQueryParams.value.filters, page: userListQueryParams.value.page }

    // Only include filters with actual values (skip '' or 'all')
    const params = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => value !== '' && value !== 'all'),
    )

    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.data.data.length === 0) {
        return { message: 'No users found', users: [] }
      }

      return response.data
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  const getUserDetails = async (userID) => {
    const user = await axios.get(`${API_BASE_URL}/admin/user/${userID}`)
    return user
  }

  return {
    getAllUsers,
    getUserDetails,
    userListQueryParams,
  }
})

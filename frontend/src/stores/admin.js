import { defineStore } from 'pinia'
import { ref, inject } from 'vue'
import axios from 'axios'

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
    // const token = localStorage.getItem('authToken')

    const filters = { ...userListQueryParams.value.filters, page: userListQueryParams.value.page }

    // Only include filters with actual values (skip '' or 'all')
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== '' && value !== 'all'),
    )

    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        params,
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

  const deleteUser = async (userId) => {
    await axios.delete(`${API_BASE_URL}/admin/user/${userId}`)
  }

  const getUserDetails = async (userID) => {
    const response = await axios.get(`${API_BASE_URL}/admin/user/${userID}`)
    const user = response.data
    if (user.photo_avatar_filename) {
      const baseUrl = API_BASE_URL.replace('/api', '')
      user.avatar_url = `${baseUrl}/storage/photos_avatars/${user.photo_avatar_filename}`
    }

    return user
  }

  const setUserBlocked = async (userId, blocked) => {
    return axios.put(`${API_BASE_URL}/admin/user/${userId}`, {
      blocked,
    })
  }

  const getStats = async () => {
    return axios.get(`${API_BASE_URL}/statistics`)
  }

  return {
    getAllUsers,
    getUserDetails,
    setUserBlocked,
    getStats,
    deleteUser,
    userListQueryParams,
  }
})

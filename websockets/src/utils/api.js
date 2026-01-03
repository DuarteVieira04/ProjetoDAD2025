import axios from 'axios'

/**
 * Create an Axios instance for Laravel API
 * @param {Object} options
 * @param {string} [options.token] - Optional Bearer token
 * @returns {AxiosInstance}
 */
export function createApiClient({ token } = {}) {
  const headers = {
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return axios.create({
    baseURL: process.env.API_BASE_URL,
    headers,
    timeout: 5000, // optional
  })
}

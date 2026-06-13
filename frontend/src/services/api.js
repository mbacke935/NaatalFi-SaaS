import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, attempt silent refresh then retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const authPath = original?.url || ''
    const isAuthEntryPoint =
      authPath.includes('/auth/login/') ||
      authPath.includes('/auth/register/') ||
      authPath.includes('/auth/verify-email/') ||
      authPath.includes('/auth/forgot-password/') ||
      authPath.includes('/auth/reset-password/') ||
      authPath.includes('/auth/token/refresh/')

    if (error.response?.status === 401 && !original._retry && !isAuthEntryPoint) {
      original._retry = true
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        )
        useAuthStore.getState().setToken(data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api

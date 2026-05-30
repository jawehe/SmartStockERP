// src/services/api.ts
import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Inject token ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-refresh queue ────────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject:  (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as RetryConfig

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${String(token)}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing     = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      }

      try {
        const { data } = await axios.post<{ data: { access_token: string } }>(
          '/api/auth/refresh',
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        )
        const newToken = data.data.access_token
        localStorage.setItem('access_token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api
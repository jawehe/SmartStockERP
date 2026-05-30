// src/services/auth.service.ts
import api from './api'
import type { User } from '../types/index'

interface LoginResponse {
  access_token:  string
  refresh_token: string
  user:          User
}

interface ApiWrap<T> { success: boolean; message: string; data: T }

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await api.post<ApiWrap<LoginResponse>>('/auth/login', { email, password })
    return res.data.data
  },

  async register(payload: {
    name: string; email: string; password: string; role: string
  }): Promise<User> {
    const res = await api.post<ApiWrap<User>>('/auth/register', payload)
    return res.data.data
  },

  async logout(): Promise<void> {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  async me(): Promise<User> {
    const res = await api.get<ApiWrap<User>>('/auth/me')
    return res.data.data
  },
}
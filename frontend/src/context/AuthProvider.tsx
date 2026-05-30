// src/context/AuthProvider.tsx
import React, { useState, useMemo } from 'react'
import { AuthContext } from './AuthContext'
import type { ReactNode } from 'react'
import type { User, Permission } from '../types/permissions'
import type { Role } from '../types/permissions'
import { dashboardPathForRole } from '../router/routeConfig.ts'
import { ROLE_PERMISSIONS } from '../types/permissions'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user")
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  })

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    console.log("🔐 Login - User:", userData)
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  const logout = () => {
    console.log("🚪 Logout")
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  const getDashboardPath = (role?: Role) => {
    const userRole = role || user?.role
    if (!userRole) return '/login'
    return dashboardPathForRole(userRole)
  }

  // Fonction pour vérifier les permissions
  const can = (permission: Permission): boolean => {
    if (!user) return false
    const permissions = ROLE_PERMISSIONS[user.role] || []
    return permissions.includes(permission)
  }

  // Computed properties pour les rôles
  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const isSeller = user?.role === 'seller'

  const loading = false

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    getDashboardPath,
    can,
    isAdmin,
    isManager,
    isSeller
  }), [user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<User | null>(null)
const [loading, setLoading] = useState(true)
  const login = (token: string, userData: User) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setLoading(false)
  }
 useEffect(() => {
  const initAuth = () => {
    try {
      const stored = localStorage.getItem('user')
      const token = localStorage.getItem('access_token')

      if (stored && token) {
        const parsedUser = JSON.parse(stored)
        setUser(parsedUser)
      } else {
        setUser(null)
      }
    } catch  {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  initAuth()
}, [])
  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
    setLoading(false)
  }
  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === 'admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

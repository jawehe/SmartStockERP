import { useState } from 'react'
import { AuthContext } from './AuthContext'
import type { ReactNode } from 'react'
import type { User } from '../types/index'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const login = async (email: string) => {
    setLoading(true)

    // fake example (بدّلها بـ API متاعك)
    const fakeUser = { id: 1, email }

    setUser(fakeUser as User)
    setLoading(false)
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
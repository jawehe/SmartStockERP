// src/components/guards/ProtectedRoute.tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AppLayout from '../layout/AppLayout'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f4f6f9]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#6b7a99]">Chargement...</span>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  return <AppLayout>{children}</AppLayout>
}

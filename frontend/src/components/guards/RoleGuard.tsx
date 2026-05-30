// src/components/guards/RoleGuard.tsx
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { Role } from '../../types/permissions'

function Forbidden() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-[#1a2e4a]">Accès refusé</h2>
      <p className="text-sm text-[#6b7a99] text-center max-w-xs">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <button onClick={() => navigate(-1)}
        className="px-5 py-2 bg-[#1e4db7] text-white rounded-lg text-sm font-medium hover:bg-[#1a3fa0] transition-colors">
        ← Retour
      </button>
    </div>
  )
}

export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role as Role)) return <Forbidden />
  return <>{children}</>
}

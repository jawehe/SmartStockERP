// src/components/layout/Topbar.tsx
import { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'

export default function Topbar() {
  const [search, setSearch] = useState('')
  const { user }            = useAuth()


  const initials = user?.name
    ?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? 'U'

  return (
    <header className="h-14 bg-white border-b border-[#e4e9f0] flex items-center px-6 gap-4 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-[440px] flex items-center gap-2 bg-[#f4f6f9] border border-[#e4e9f0] rounded-lg px-3 h-9 focus-within:border-[#1e4db7] transition-colors">
        <span className="text-[#9aa5bf] text-sm">🔍</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search data, stock or sales..."
          className="flex-1 border-none bg-transparent outline-none text-sm text-[#1a2e4a] placeholder:text-[#9aa5bf]" />
        {search && (
          <button onClick={() => setSearch('')} className="text-[#9aa5bf] hover:text-[#1a2e4a] text-xs">×</button>
        )}
      </div>

      {/* Notification bell */}
      <button
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[#9aa5bf] hover:bg-gray-100 transition-colors text-lg">
        🔔
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      </button>

      {/* User info */}
      <div className="flex items-center gap-2.5">
        <div className="text-right hidden sm:block">
          <div className="font-medium text-sm text-[#1a2e4a] leading-tight">{user?.name ?? 'User'}</div>
          <div className="text-[11px] text-[#6b7a99] capitalize">{user?.role ?? 'guest'}</div>
        </div>
        <button
          className="w-9 h-9 rounded-full bg-[#1e4db7] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#1a3fa0] transition-colors">
          {initials}
        </button>
      </div>
    </header>
  )
}

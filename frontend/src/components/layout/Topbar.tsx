// src/components/layout/Topbar.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Topbar() {
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search)}`)
    }
  }

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() ?? 
    user?.email?.charAt(0).toUpperCase() ?? 'U'

  return (
    <header className="h-16 bg-white border-b border-[#e4e9f0] flex items-center justify-between px-6 shrink-0">
      {/* Left side - espace vide ou logo small */}
      <div className="w-10">
        {/* Optionnel: petit logo ou menu toggle */}
      </div>

      {/* Search - au centre */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa5bf] text-base">
            🔍
          </span>
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search data, stock or sales..."
            className="w-full pl-10 pr-10 py-2 bg-[#f8f9fc] border border-[#e4e9f0] rounded-xl text-sm text-[#1a2e4a] placeholder:text-[#9aa5bf] focus:outline-none focus:border-[#1e4db7] focus:bg-white transition-all"
          />
          {search && (
            <button 
              type="button"
              onClick={() => setSearch('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa5bf] hover:text-[#1a2e4a] text-lg font-medium"
            >
              ×
            </button>
          )}
        </div>
      </form>

      {/* Right side - Notifications & User */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[#9aa5bf] hover:bg-[#f0f4ff] hover:text-[#1e4db7] transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-[#e4e9f0]"></div>

        {/* User info */}
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 hover:bg-[#f0f4ff] rounded-xl px-2 py-1.5 transition-all"
        >
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-sm text-[#1a2e4a] leading-tight">
              {user?.name ?? 'User'}
            </div>
            <div className="text-[11px] text-[#6b7a99] capitalize">
              {user?.role ?? 'guest'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e4db7] to-[#1a3fa0] flex items-center justify-center text-white font-semibold text-sm shadow-sm hover:shadow transition-all">
            {initials}
          </div>
        </button>
      </div>
    </header>
  )
}
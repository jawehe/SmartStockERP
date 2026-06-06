// src/components/layout/Topbar.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import NotificationBell from '../UI/NotificationBell'

export default function Topbar() {
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

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
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-[#e4e9f0] dark:border-slate-700 flex items-center justify-between px-6 shrink-0">
      {/* Left side */}
      <div className="w-10">
        {/* Espace réservé */}
      </div>

      {/* Search - au centre */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa5bf] dark:text-slate-500 text-base">
            🔍
          </span>
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search data, stock or sales..."
            className="w-full pl-10 pr-10 py-2 bg-[#f8f9fc] dark:bg-slate-900 border border-[#e4e9f0] dark:border-slate-700 rounded-xl text-sm text-[#1a2e4a] dark:text-white placeholder:text-[#9aa5bf] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#1e4db7] dark:focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          {search && (
            <button 
              type="button"
              onClick={() => setSearch('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa5bf] dark:text-slate-500 hover:text-[#1a2e4a] dark:hover:text-white text-lg font-medium"
            >
              ×
            </button>
          )}
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* 🌙 Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[#6b7a99] dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Separator */}
        <div className="w-px h-8 bg-[#e4e9f0] dark:bg-slate-700"></div>

        {/* User info */}
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 hover:bg-[#f0f4ff] dark:hover:bg-slate-800 rounded-xl px-2 py-1.5 transition-all"
        >
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-sm text-[#1a2e4a] dark:text-white leading-tight">
              {user?.name ?? 'User'}
            </div>
            <div className="text-[11px] text-[#6b7a99] dark:text-slate-400 capitalize">
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
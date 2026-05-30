// src/components/layout/Sidebar.tsx
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { NAV_ITEMS, dashboardPathForRole } from '../../router/routeConfig.ts'
import type { Role } from '../../types/permissions'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Filter nav items by role
  const menuItems = NAV_ITEMS.filter((item) => {
    if (!user) return false
    return item.roles.includes(user.role as Role)
  })

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Handle dashboard click - navigate to role-specific dashboard
  const handleDashboardClick = () => {
    if (user) {
      navigate(dashboardPathForRole(user.role as Role))
    }
  }

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? 'U'

  const roleColor: Record<string, string> = {
    admin:   'text-red-400',
    manager: 'text-amber-400',
    seller:  'text-green-400',
  }

  return (
    <aside className="w-[220px] bg-[#1a2e4a] flex flex-col shrink-0 h-screen">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.07]">
        <button onClick={handleDashboardClick}
          className="flex items-center gap-2.5 w-full text-left">
          <div className="w-9 h-9 bg-[#1e4db7] rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0">
            ⊟
          </div>
          <div>
            <div className="text-white font-semibold text-[15px] leading-tight">SmartStock</div>
            <div className="text-[#8fa3bc] text-[10px] tracking-[0.08em]">ENTERPRISE SUITE</div>
          </div>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button 
            key={item.path} 
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left border-l-[3px]
              ${isActive(item.path)
                ? 'bg-white/10 text-white font-medium border-[#1e4db7]'
                : 'text-[#8fa3bc] border-transparent hover:bg-white/5 hover:text-white'}`}>
            <span className="text-base shrink-0">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom: settings + user */}
      <div className="px-3 pb-4">
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8fa3bc] hover:bg-white/5 hover:text-white transition-all">
          <span>⚙</span>Settings
        </button>
        
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8fa3bc] hover:bg-white/5 hover:text-white transition-all">
          <span>?</span>Support
        </button>

        <button onClick={() => navigate('/sales')}
          className="w-full mt-2 py-2.5 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors">
          + Add New Entry
        </button>

        {/* User pill */}
        <div className="mt-3 flex items-center gap-2.5 px-2 py-2 rounded-lg border border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#1e4db7] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.name || user?.email}</div>
            <div className={`text-[10px] capitalize font-medium ${roleColor[user?.role ?? ''] ?? 'text-[#8fa3bc]'}`}>
              {user?.role}
            </div>
          </div>
          <button onClick={logout}
            className="text-[#8fa3bc] hover:text-white transition-colors text-sm"
            title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  )
}
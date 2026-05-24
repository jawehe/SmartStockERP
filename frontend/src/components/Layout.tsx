// src/components/Layout.tsx
import { useState } from 'react'
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface NavItem { path: string; label: string; icon: string }

const NAV: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/products',  label: 'Products',  icon: '⊡' },
  { path: '/clients',   label: 'Clients',   icon: '◎' },
  { path: '/sales',     label: 'Sales',     icon: '◈' },
  { path: '/analytics', label: 'Analytics', icon: '⬡' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout }    = useAuth()
  const navigate            = useNavigate()
  const location            = useLocation()
  const [search, setSearch] = useState('')

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() ?? 'U'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: 220, background: 'var(--sidebar-bg)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '0 0 16px',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: 'var(--blue-main)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', fontWeight: 600,
            }}>⊟</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>SmartStock</div>
              <div style={{ color: 'var(--sidebar-text)', fontSize: 10, letterSpacing: '0.08em' }}>ENTERPRISE SUITE</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.path)
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, border: 'none',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: active ? '#fff' : 'var(--sidebar-text)',
                  fontSize: 14, fontWeight: active ? 500 : 400,
                  cursor: 'pointer', marginBottom: 2,
                  borderLeft: active ? '3px solid var(--blue-main)' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '0 12px' }}>
          {[['⚙', 'Settings'], ['?', 'Support']].map(([icon, label]) => (
            <button key={label} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, border: 'none',
              background: 'transparent', color: 'var(--sidebar-text)',
              fontSize: 14, cursor: 'pointer', marginBottom: 2,
            }}>{icon} {label}</button>
          ))}
          <button onClick={() => navigate('/sales')}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: 'var(--blue-main)', border: 'none',
              color: '#fff', fontWeight: 500, fontSize: 14, cursor: 'pointer', marginTop: 6,
            }}>+ Add New Entry</button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: 56, background: '#fff', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
        }}>
          <div style={{
            flex: 1, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0 12px', height: 36,
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search data, stock or sales..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1 }} />
          </div>

          <button style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text-muted)', position: 'relative', cursor: 'pointer' }}>
            🔔
            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{user?.name ?? 'Admin User'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role ?? 'administrator'}</div>
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 600, fontSize: 13,
            }}>{initials}</div>
            <button onClick={logout}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

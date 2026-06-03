// src/router/routeConfig.ts
import type { Role } from '../types/permissions'

export interface NavItem {
  label: string
  path:  string
  icon:  string
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  // ── Dashboards par rôle ─────────────────────────────────
  { label: 'Dashboard',  path: '/admin/dashboard',   icon: '▦', roles: ['admin']                    },
  { label: 'Dashboard',  path: '/manager/dashboard', icon: '▦', roles: ['manager']                  },
  { label: 'Dashboard',  path: '/seller/dashboard',  icon: '▦', roles: ['seller']                   },
  // ── Shared ──────────────────────────────────────────────
  { label: 'Products',   path: '/products',          icon: '⊡', roles: ['admin','manager','seller']  },
  { label: 'Clients',    path: '/clients',           icon: '◎', roles: ['admin','manager','seller']  },
  { label: 'Sales',      path: '/sales',             icon: '◈', roles: ['admin','manager','seller']  },
  { label: 'Analytics',  path: '/analytics',         icon: '⬡', roles: ['admin','manager']           },
   { label: 'Inventory',   path: '/inventory',          icon: '📦', roles: ['admin','manager'] },
  { label: 'Suppliers',   path: '/suppliers',   icon: '🏭', roles: ['admin', 'manager'] },
  { label: 'Purchases',   path: '/purchases',   icon: '📦', roles: ['admin', 'manager'] }, 
  { label: 'Support',    path: '/support',           icon: '?', roles: ['admin','manager','seller'] },
  { label: 'Settings',   path: '/settings',          icon: '⚙', roles: ['admin'] },
 
  
  // ── Admin only ───────────────────────────────────────────
  { label: 'Users',      path: '/admin/users',       icon: '⊕', roles: ['admin']                    },
  
]

/** Retourne le path du dashboard selon le rôle */
export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case 'admin':   return '/admin/dashboard'
    case 'manager': return '/manager/dashboard'
    case 'seller':  return '/seller/dashboard'
  }
}
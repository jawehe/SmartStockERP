// src/hooks/usePermissions.ts
import { useAuth } from './useAuth'

export function usePermissions() {
  const { can, user, isAdmin, isManager, isSeller } = useAuth()
  
  return {
    can,
    isAdmin, 
    isManager, 
    isSeller,
    canCreateSale:    can('create:sale'),
    canDeleteSale:    can('delete:sale'),
    canManageStock:   can('adjust:stock'),
    canCreateProduct: can('create:product'),
    canEditProduct:   can('edit:product'),
    canDeleteProduct: can('delete:product'),
    canViewAnalytics: can('read:analytics'),
    canManageUsers:   can('manage:users'),
    role: user?.role ?? null,
  }
}
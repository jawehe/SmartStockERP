// src/types/permissions.ts

export type Role = 'admin' | 'manager' | 'seller'

export type Permission =
  | 'create:sale'   | 'read:sale'    | 'delete:sale'
  | 'create:product'| 'edit:product' | 'delete:product'
  | 'read:analytics'| 'manage:users' | 'adjust:stock'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'create:sale','read:sale','delete:sale',
    'create:product','edit:product','delete:product',
    'read:analytics','manage:users','adjust:stock',
  ],
  manager: [
    'create:sale','read:sale',
    'create:product','edit:product',
    'read:analytics','adjust:stock',
  ],
  seller: ['create:sale','read:sale','create:product'],
}
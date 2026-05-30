// src/context/AuthContext.tsx
import { createContext } from "react";
import type { User, Permission } from "../types/permissions";
import type { Role } from "../types/permissions";

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  getDashboardPath: (role?: Role) => string
  // Ajout des fonctions de permission
  can: (permission: Permission) => boolean
  isAdmin: boolean
  isManager: boolean
  isSeller: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
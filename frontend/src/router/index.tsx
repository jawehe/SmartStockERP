// src/router/index.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute }  from '../components/guards/ProtectedRoute'
import { RoleGuard }       from '../components/guards/RoleGuard'

// Auth pages
import LoginPage    from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPassword from '../pages/auth/ForgetPassword'

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import UsersPage      from '../pages/admin/UsersPage'

// Manager pages
//import ManagerDashboard from '../pages/manager/ManagerDashboard'

// Seller pages
import SellerDashboard from '../pages/seller/SellerDashboard'

// Shared pages
import ProductsPage  from '../pages/shared/ProductsPage'
import ClientsPage   from '../pages/shared/ClientsPage'
import SalesPage     from '../pages/shared/SalesPage'
import AnalyticsPage from '../pages/shared/AnalyticsPage'

// ── Smart redirect after login ───────────────────────────────
import { useAuth } from '../hooks/useAuth'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user)   return <Navigate to="/login" replace />
  switch (user.role) {
    case 'admin':   return <Navigate to="/admin/dashboard"   replace />
    case 'manager': return <Navigate to="/manager/dashboard" replace />
    case 'seller':  return <Navigate to="/seller/dashboard"  replace />
    default:        return <Navigate to="/login"             replace />
  }
}

// ── Public guard — redirect to dashboard if already logged in
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user)    return <RootRedirect />
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Public ──────────────────────────────────────── */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>
  }
/>

      {/* ── Admin routes ────────────────────────────────── */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <RoleGuard roles={['admin']}>
            <AdminDashboard />
          </RoleGuard>
        </ProtectedRoute>
      } />

      <Route path="/admin/users" element={
        <ProtectedRoute>
          <RoleGuard roles={['admin']}>
            <UsersPage />
          </RoleGuard>
        </ProtectedRoute>
      } />

    

      {/* ── Seller routes ───────────────────────────────── */}
      <Route path="/seller/dashboard" element={
        <ProtectedRoute>
          <RoleGuard roles={['seller']}>
            <SellerDashboard />
          </RoleGuard>
        </ProtectedRoute>
      } />

      {/* ── Shared routes (all roles) ────────────────────── */}
      <Route path="/products" element={
        <ProtectedRoute>
          <RoleGuard roles={['admin','manager','seller']}>
            <ProductsPage />
          </RoleGuard>
        </ProtectedRoute>
      } />

      <Route path="/clients" element={
        <ProtectedRoute>
          <RoleGuard roles={['admin','manager','seller']}>
            <ClientsPage />
          </RoleGuard>
        </ProtectedRoute>
      } />

      <Route path="/sales" element={
        <ProtectedRoute>
          <RoleGuard roles={['admin','manager','seller']}>
            <SalesPage />
          </RoleGuard>
        </ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute>
          <RoleGuard roles={['admin','manager']}>
            <AnalyticsPage />
          </RoleGuard>
        </ProtectedRoute>
      } />

      {/* ── Root redirect ────────────────────────────────── */}
      <Route path="/"  element={<RootRedirect />} />
      <Route path="*"  element={<RootRedirect />} />
    </Routes>
  )
}

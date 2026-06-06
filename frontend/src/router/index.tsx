// src/router/index.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../components/guards/ProtectedRoute'
import { RoleGuard } from '../components/guards/RoleGuard'
import AppLayout from '../components/layout/AppLayout'  // ← Garde AppLayout

// Auth pages
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPassword from '../pages/auth/ForgetPassword'

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import UsersPage from '../pages/admin/UsersPage'
import SuppliersPage from '../pages/admin/SuppliersPage'
import PurchasesPage from '../pages/admin/PurchasesPage'
import AuditLogsPage from '../pages/admin/AuditLogsPage'
// Manager pages 
import ManagerDashboard from '../pages/manager/ManagerDashboard'

// Seller pages
import SellerDashboard from '../pages/seller/SellerDashboard'

// Shared pages
import ProductsPage from '../pages/shared/ProductsPage'
import ClientsPage from '../pages/shared/ClientsPage'
import SalesPage from '../pages/shared/SalesPage'
import AnalyticsPage from '../pages/shared/AnalyticsPage'
import SupportPage from '../pages/shared/SupportPage'
import SettingsPage from '../pages/shared/SettingsPage'

import { useAuth } from '../hooks/useAuth'
import { dashboardPathForRole } from './routeConfig'
import ProfilePage from '../pages/shared/ProfilePage'
import InventoryPage from '../pages/shared/InventoryPage'
import ReportsPage from '../pages/shared/ReportsPage'
import NotificationsPage from '../pages/shared/NotificationsPage'
import WarehousesPage from '../pages/admin/WarehousesPage'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  
  const dashboardPath = dashboardPathForRole(user.role)
  return <Navigate to={dashboardPath} replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <RootRedirect />
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>  {/* ← Garde AppLayout */}
          {/* Admin routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <RoleGuard roles={['admin']}>
                <AdminDashboard />
              </RoleGuard>
            } 
          />
          
          <Route 
            path="/admin/users" 
            element={
              <RoleGuard roles={['admin']}>
                <UsersPage />
              </RoleGuard>
            } 
          />
          <Route 
            path="/manager/dashboard" 
            element={
              <RoleGuard roles={['manager']}>
                <ManagerDashboard />
              </RoleGuard>
            } 
          />

          {/* Seller routes */}
          <Route 
            path="/seller/dashboard" 
            element={
              <RoleGuard roles={['seller']}>
                <SellerDashboard />
              </RoleGuard>
            } 
          />

          {/* Shared routes */}
          <Route 
            path="/products" 
            element={
              <RoleGuard roles={['admin', 'manager', 'seller']}>
                <ProductsPage />
              </RoleGuard>
            } 
          />

          <Route 
            path="/clients" 
            element={
              <RoleGuard roles={['admin', 'manager', 'seller']}>
                <ClientsPage />
              </RoleGuard>
            } 
          />

          <Route 
            path="/sales" 
            element={
              <RoleGuard roles={['admin', 'manager', 'seller']}>
                <SalesPage />
              </RoleGuard>
            } 
          />

          <Route 
            path="/analytics" 
            element={
              <RoleGuard roles={['admin', 'manager']}>
                <AnalyticsPage />
              </RoleGuard>
            } 
          />

          <Route 
            path="/support" 
            element={
              <RoleGuard roles={['admin', 'manager', 'seller']}>
                <SupportPage />
              </RoleGuard>
            } 
          />

          <Route 
            path="/settings" 
            element={
              <RoleGuard roles={['admin', 'manager']}>
                <SettingsPage />
              </RoleGuard>
            } 
          />
          <Route 
  path="/profile" 
  element={
    <RoleGuard roles={['admin', 'manager', 'seller']}>
      <ProfilePage />
    </RoleGuard>
  } 
/>
<Route 
  path="/inventory" 
  element={
    <RoleGuard roles={['admin', 'manager']}>
      <InventoryPage />
    </RoleGuard>
  } 
/>
<Route path="/suppliers" element={
  <RoleGuard roles={['admin', 'manager']}>
    <SuppliersPage />
  </RoleGuard>
} />
<Route path="/purchases" element={
  <RoleGuard roles={['admin', 'manager']}>
    <PurchasesPage />
  </RoleGuard>
} />
<Route 
  path="/reports" 
  element={
    <RoleGuard roles={['admin', 'manager']}>
      <ReportsPage />
    </RoleGuard>
  } 
/>
<Route 
  path="/notifications" 
  element={
    <RoleGuard roles={['admin', 'manager', 'seller']}>
      <NotificationsPage />
    </RoleGuard>
  } 
/>
<Route 
  path="/audit-logs" 
  element={
    <RoleGuard roles={['admin']}>
      <AuditLogsPage />
    </RoleGuard>
  } 
/>
<Route path="/warehouses" element={
  <RoleGuard roles={['admin', 'manager']}>
    <WarehousesPage />
  </RoleGuard>
} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
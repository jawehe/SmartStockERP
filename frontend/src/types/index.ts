// src/types/index.ts — Tous les types TypeScript du projet

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'manager' | 'cashier'
  created_at: string
}

export interface Category {
  id: number
  name: string
  description: string | null
  product_count: number
}

export interface Product {
  id: number
  name: string
  sku: string
  description: string | null
  price: number
  stock_quantity: number
  low_stock_threshold: number
  is_low_stock: boolean
  category_id: number | null
  category_name: string | null
  created_at: string
}

export interface Client {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  total_spent: number
  sale_count: number
  created_at: string
}

export interface SaleItem {
  id: number
  product_id: number
  product_name: string | null
  product_sku: string | null
  quantity: number
  unit_price: number
  subtotal: number
}
export type SaleStatus = 'pending' | 'completed' | 'cancelled'
export interface Sale {
  id: number
  total_amount: number
  status: SaleStatus
  note: string | null
  sale_date: string
  client: { id: number; name: string } | null
  cashier: { id: number; name: string } | null
  items?: SaleItem[]
}

export interface DashboardStats {
  period: string
  sales: {
    count: number
    revenue: number
    avg_basket: number
    growth_pct: number | null
  }
  inventory: {
    total_products: number
    low_stock_count: number
  }
  clients_count: number
  top_products: {
    id: number; name: string; sku: string
    qty_sold: number; revenue: number
  }[]
  low_stock_alerts: {
    id: number; name: string; sku: string
    stock: number; threshold: number
  }[]
}

export interface RevenuePoint {
  date: string
  revenue: number
  sales_count: number
}

export interface TopProduct {
  rank: number
  id: number
  name: string
  sku: string
  category: string | null
  total_qty: number
  total_revenue: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// Formulaires
export interface ProductForm {
  name: string
  sku: string
  price: string
  stock_quantity: string
  low_stock_threshold: string
  category_id: string
  description: string
}

export interface ClientForm {
  name: string
  email: string
  phone: string
  address: string
}

export interface SaleCartItem {
  product_id: number
  name: string
  sku: string
  unit_price: number
  quantity: number
}
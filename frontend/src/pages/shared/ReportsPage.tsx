// src/pages/shared/ReportsPage.tsx
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import api from '../../services/api'
import { Button } from '../../components/UI/Button'


interface MonthlySale {
  month: number
  total: number
  count: number
}

interface TopProduct {
  id: number
  name: string
  sku: string
  total_quantity: number
  total_revenue: number
}

interface TopClient {
  id: number
  name: string
  email: string
  total_spent: number
  order_count: number
}

interface ProfitData {
  total_sales: number
  total_purchases: number
  profit: number
  margin: number
}

interface StockStats {
  total_value: number
  total_products: number
  low_stock_count: number
  out_of_stock_count: number
  stock_in_last_30_days: number
  stock_out_last_30_days: number
}

const COLORS = ['#1e4db7', '#16a34a', '#dc2626', '#d97706', '#8b5cf6', '#ec489a', '#06b6d4', '#84cc16']
const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(n)
const formatTooltipValue = (value: unknown): string => {
  if (typeof value === 'number') {
    return fmt(value)
  }
  return String(value ?? '')
}
export default function ReportsPage() {
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [profit, setProfit] = useState<ProfitData | null>(null)
  const [stockStats, setStockStats] = useState<StockStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  
  const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

  useEffect(() => {
    const fetchAllReports = async () => {
      setLoading(true)
      try {
        const [salesRes, productsRes, profitRes, stockRes, clientsRes] = await Promise.all([
          api.get(`/reports/sales?year=${year}`),
          api.get('/reports/products?limit=5'),
          api.get('/reports/profit'),
          api.get('/reports/stock'),
          api.get('/reports/top-clients?limit=5')
        ])

        setMonthlySales(salesRes.data.monthly_sales || [])
        setTopProducts(productsRes.data.top_products || [])
        setProfit(profitRes.data)
        setStockStats(stockRes.data)
        setTopClients(clientsRes.data.top_clients || [])
      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllReports()
  }, [year])

  // Données pour le graphique des ventes
  const chartData = monthNames.map((name, idx) => {
    const sale = monthlySales.find(s => s.month === idx + 1)
    return {
      name,
      ventes: sale?.total || 0,
      commandes: sale?.count || 0
    }
  })

  // Données pour PieChart
  const pieData = topProducts.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    value: p.total_revenue
  }))

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Mois', 'Ventes (USD)', 'Nombre de commandes']
    const rows = chartData.map(d => [d.name, d.ventes, d.commandes])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `rapport_ventes_${year}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Reports & Analytics</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Advanced business intelligence and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm bg-white"
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          <Button variant="secondary" icon="↓" onClick={exportToCSV}>Export Report</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="text-sm opacity-80">Total Revenue</div>
          <div className="text-2xl font-bold mt-1">{profit ? fmt(profit.total_sales) : '$0'}</div>
          <div className="text-xs opacity-70 mt-2">Year to date</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <div className="text-sm opacity-80">Total Purchases</div>
          <div className="text-2xl font-bold mt-1">{profit ? fmt(profit.total_purchases) : '$0'}</div>
          <div className="text-xs opacity-70 mt-2">Cost of goods</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="text-sm opacity-80">Net Profit</div>
          <div className="text-2xl font-bold mt-1">{profit ? fmt(profit.profit) : '$0'}</div>
          <div className="text-xs opacity-70 mt-2">Margin: {profit?.margin || 0}%</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <div className="text-sm opacity-80">Inventory Value</div>
          <div className="text-2xl font-bold mt-1">{stockStats ? fmt(stockStats.total_value) : '$0'}</div>
          <div className="text-xs opacity-70 mt-2">{stockStats?.total_products || 0} products</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Bar Chart */}
        <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
          <h3 className="font-semibold text-[#1a2e4a] mb-4">Monthly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" />
          
              <Tooltip formatter={(value: unknown) => { if (typeof value === 'number') return fmt(value)
 return String(value ?? '')
}} />
              <Legend />
              <Bar yAxisId="left" dataKey="ventes" fill="#1e4db7" name="Ventes (USD)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="commandes" fill="#16a34a" name="Commandes" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Pie Chart */}
        <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
          <h3 className="font-semibold text-[#1a2e4a] mb-4">Top Products by Revenue</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltipValue} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[#9aa5bf]">No data available</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Stats */}
        <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
          <h3 className="font-semibold text-[#1a2e4a] mb-4">Inventory Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#e4e9f0]">
              <span className="text-[#6b7a99]">Total Products</span>
              <span className="font-semibold">{formatNumber(stockStats?.total_products || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e4e9f0]">
              <span className="text-[#6b7a99]">Low Stock Products</span>
              <span className="font-semibold text-amber-600">{stockStats?.low_stock_count || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e4e9f0]">
              <span className="text-[#6b7a99]">Out of Stock</span>
              <span className="font-semibold text-red-600">{stockStats?.out_of_stock_count || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e4e9f0]">
              <span className="text-[#6b7a99]">Stock In (30 days)</span>
              <span className="font-semibold text-green-600">+{formatNumber(stockStats?.stock_in_last_30_days || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#6b7a99]">Stock Out (30 days)</span>
              <span className="font-semibold text-red-600">-{formatNumber(stockStats?.stock_out_last_30_days || 0)}</span>
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
          <h3 className="font-semibold text-[#1a2e4a] mb-4">Top Clients</h3>
          {topClients.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {topClients.map((client, idx) => (
                <div key={client.id} className="flex items-center justify-between py-2 border-b border-[#e4e9f0] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f0f4ff] flex items-center justify-center text-[#1e4db7] font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{client.name}</div>
                      <div className="text-xs text-[#6b7a99]">{client.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{fmt(client.total_spent)}</div>
                    <div className="text-xs text-[#6b7a99]">{client.order_count} orders</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[#9aa5bf]">No clients data</div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white border border-[#e4e9f0] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e4e9f0]">
          <h3 className="font-semibold text-[#1a2e4a]">Best Selling Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-[#e4e9f0]">
                <th className="text-left p-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">PRODUCT</th>
                <th className="text-left p-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">SKU</th>
                <th className="text-left p-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">QUANTITY SOLD</th>
                <th className="text-left p-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">REVENUE</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <tr key={product.id} className="border-b border-[#e4e9f0] hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-sm">{product.name}</td>
                    <td className="p-3 text-sm text-[#6b7a99] font-mono">{product.sku}</td>
                    <td className="p-3 text-sm">{formatNumber(product.total_quantity)} units</td>
                    <td className="p-3 font-semibold text-sm text-[#1e4db7]">{fmt(product.total_revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-[#9aa5bf]">No sales data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
// src/pages/shared/AnalyticsPage.tsx
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from 'recharts'
import api from '../../services/api'

interface TopProduct {
  product_id: number
  product_name: string
  quantity_sold: number
  revenue: number
}

interface StockAlerts {
  critical: number
  warning: number
  normal: number
  total_products: number
}

interface MonthlyRevenue {
  year: number
  monthly_revenue: number[]
  total_revenue: number
  total_orders: number
}

interface DashboardStats {
  total_products: number
  total_clients: number
  monthly_revenue: number
  growth_percentage: number
}

interface SalesForecast {
  predictions: Array<{
    date: string
    day: string
    predicted_revenue: number
  }>
  total_predicted: number
  average_daily: number
  days: number
  model_accuracy: {
    mae: number
    r2: number
    note?: string
  }
}

interface AIRecommendation {
  product_id: number
  product_name: string
  product_sku: string
  current_stock: number
  avg_daily_sales: number
  days_remaining: number
  recommended_order: number
  priority: string
}

const COLORS = ['#dc2626', '#d97706', '#16a34a']

export default function AnalyticsPage() {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlerts | null>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [salesForecast, setSalesForecast] = useState<SalesForecast | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState<'analytics' | 'forecast' | 'recommendations'>('analytics')

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(n)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [topRes, stockRes, revenueRes, statsRes, forecastRes, recosRes] = await Promise.all([
          api.get('/analytics/top-products?limit=5'),
          api.get('/analytics/stock-alerts'),
          api.get(`/analytics/monthly-revenue?year=${year}`),
          api.get('/analytics/dashboard-stats'),
          api.get('/ai/sales-forecast?days=30'),
          api.get('/ai/recommendations')
        ])
        setTopProducts(topRes.data.data || [])
        setStockAlerts(stockRes.data.data)
        setMonthlyRevenue(revenueRes.data.data)
        setDashboardStats(statsRes.data.data)
        setSalesForecast(forecastRes.data.data)
        setAiRecommendations(recosRes.data.data || [])
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [year])

  const pieData = stockAlerts ? [
    { name: 'Critical', value: stockAlerts.critical },
    { name: 'Warning', value: stockAlerts.warning },
    { name: 'Normal', value: stockAlerts.normal }
  ] : []

  const barData = monthlyRevenue?.monthly_revenue.map((value, index) => ({
    month: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][index],
    revenue: value
  })) || []

  const forecastChartData = salesForecast?.predictions.slice(0, 14).map(pred => ({
    date: pred.date.slice(5),
    revenue: pred.predicted_revenue
  })) || []

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      default: return 'text-green-600 bg-green-50'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Analytics Dashboard</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Business intelligence and AI-powered insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm"
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e4e9f0]">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-[#1e4db7] border-b-2 border-[#1e4db7]'
              : 'text-[#6b7a99] hover:text-[#1a2e4a]'
          }`}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'forecast'
              ? 'text-[#1e4db7] border-b-2 border-[#1e4db7]'
              : 'text-[#6b7a99] hover:text-[#1a2e4a]'
          }`}
        >
          📈 Sales Forecast
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'text-[#1e4db7] border-b-2 border-[#1e4db7]'
              : 'text-[#6b7a99] hover:text-[#1a2e4a]'
          }`}
        >
          🤖 AI Recommendations
        </button>
      </div>

      {/* Tab Analytics */}
      {activeTab === 'analytics' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
              <div className="text-sm text-[#6b7a99]">Total Products</div>
              <div className="text-2xl font-bold text-[#1a2e4a] mt-1">{dashboardStats?.total_products || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
              <div className="text-sm text-[#6b7a99]">Total Clients</div>
              <div className="text-2xl font-bold text-[#1a2e4a] mt-1">{dashboardStats?.total_clients || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
              <div className="text-sm text-[#6b7a99]">Monthly Revenue</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{fmt(dashboardStats?.monthly_revenue || 0)}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
              <div className="text-sm text-[#6b7a99]">Growth</div>
              <div className={`text-2xl font-bold mt-1 ${(dashboardStats?.growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(dashboardStats?.growth_percentage || 0) >= 0 ? '+' : ''}{dashboardStats?.growth_percentage}%
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Products Bar Chart */}
            <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
              <h3 className="font-semibold text-[#1a2e4a] mb-4">Top Selling Products</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} units`} />
                  <Legend />
                  <Bar dataKey="quantity_sold" fill="#1e4db7" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stock Alerts Pie Chart */}
            <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
              <h3 className="font-semibold text-[#1a2e4a] mb-4">Stock Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
            <h3 className="font-semibold text-[#1a2e4a] mb-4">Monthly Revenue {year}</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip formatter={(value) => fmt(value as number)} />
                <Legend />
                <Bar dataKey="revenue" fill="#1e4db7" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-[#6b7a99]">
                Total Revenue {year}: <span className="font-bold text-[#1e4db7]">{fmt(monthlyRevenue?.total_revenue || 0)}</span>
                {' | '}
                Total Orders: <span className="font-bold">{monthlyRevenue?.total_orders || 0}</span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Tab Forecast */}
      {activeTab === 'forecast' && salesForecast && (
        <>
          {/* Forecast KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
              <div className="text-sm opacity-80">Total Forecast (30 days)</div>
              <div className="text-2xl font-bold mt-1">{fmt(salesForecast.total_predicted)}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
              <div className="text-sm opacity-80">Daily Average</div>
              <div className="text-2xl font-bold mt-1">{fmt(salesForecast.average_daily)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
              <div className="text-sm opacity-80">Model Accuracy</div>
              <div className="text-2xl font-bold mt-1">
                {salesForecast.model_accuracy?.r2 
                  ? `${(salesForecast.model_accuracy.r2 * 100).toFixed(0)}%`
                  : 'N/A'}
              </div>
              {salesForecast.model_accuracy?.mae > 0 && (
                <div className="text-xs opacity-70 mt-1">MAE: {fmt(salesForecast.model_accuracy.mae)}</div>
              )}
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
            <h3 className="font-semibold text-[#1a2e4a] mb-4">14-Day Revenue Forecast</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(value) => fmt(value as number)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#1e4db7" strokeWidth={2} name="Predicted Revenue" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Table */}
          <div className="bg-white border border-[#e4e9f0] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-[#1a2e4a]">Daily Forecast - Next 30 Days</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">DATE</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">DAY</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7a99]">PREDICTED REVENUE</th>
                  </tr>
                </thead>
                <tbody>
                  {salesForecast.predictions.map((pred) => (
                    <tr key={pred.date} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{pred.date}</td>
                      <td className="py-3 px-4 capitalize">{pred.day}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#1e4db7]">{fmt(pred.predicted_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab AI Recommendations */}
      {activeTab === 'recommendations' && (
        <>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🤖</span>
              <div>
                <h3 className="font-semibold text-[#1a2e4a]">AI-Powered Reorder Recommendations</h3>
                <p className="text-sm text-[#6b7a99]">Based on sales velocity and current stock levels</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e4e9f0] rounded-2xl overflow-hidden">
            {aiRecommendations.length === 0 ? (
              <div className="text-center py-12 text-[#9aa5bf]">
                No recommendations at this time. All stock levels are optimal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">PRODUCT</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">CURRENT STOCK</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">DAILY SALES</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">DAYS LEFT</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">PRIORITY</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">RECOMMENDED ORDER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiRecommendations.map((rec) => (
                      <tr key={rec.product_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{rec.product_name}</div>
                            <div className="text-xs text-[#9aa5bf]">{rec.product_sku}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{rec.current_stock} units</td>
                        <td className="py-3 px-4">{rec.avg_daily_sales.toFixed(1)}/day</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${rec.days_remaining < 10 ? 'text-red-600' : 'text-[#1a2e4a]'}`}>
                            {rec.days_remaining} days
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                            {rec.priority === 'high' ? '⚠️ High' : '📦 Medium'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#1e4db7]">{rec.recommended_order} units</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}